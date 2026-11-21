import { createHash, randomUUID } from 'node:crypto';
import { EntityManager, LockMode } from '@mikro-orm/postgresql';
import { Dinheiro } from '../domain/money';
import { CarteiraEntity } from '../entities/carteira.entity';
import { LancamentoCarteiraEntity } from '../entities/lancamento-carteira.entity';
import { TransacaoApostaEntity } from '../entities/transacao-aposta.entity';
import { MensagemOutboxEntity } from '../entities/mensagem-outbox.entity';

export type TipoOperacaoAposta =
  | 'APOSTA'
  | 'GANHO'
  | 'PERDA'
  | 'ESTORNO'
  | 'REVERSAO';

export interface ProcessarTransacaoApostaInput {
  idCarteira: string;
  chaveIdempotencia: string;
  valorCentavos: bigint | string;
  moeda?: string;
  tipoOperacao?: TipoOperacaoAposta;
  idReferenciaExterna?: string | null;
  idCorrelacao?: string | null;
}

export interface ProcessarTransacaoApostaOutput {
  idTransacao: string;
  idCarteira: string;
  chaveIdempotencia: string;
  tipoOperacao: TipoOperacaoAposta;
  valorCentavos: string;
  saldoRestanteCentavos: string;
  versaoCarteira: number;
  status: TransacaoApostaEntity['status'];
  idempotente: boolean;
}

function centavosParaDinheiro(centavos: bigint, moeda: string): Dinheiro {
  return Dinheiro.deCentavos(centavos, moeda);
}

function calcularHashPayload(payload: Record<string, unknown>): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

export class ProcessarTransacaoApostaUseCase {
  constructor(private readonly em: EntityManager) {}

  async executar(
    input: ProcessarTransacaoApostaInput,
  ): Promise<ProcessarTransacaoApostaOutput> {
    const idCarteira = input.idCarteira.trim();
    const chaveIdempotencia = input.chaveIdempotencia.trim();

    if (!idCarteira) {
      throw new Error('O id da carteira é obrigatório.');
    }
    if (!chaveIdempotencia) {
      throw new Error('A chave de idempotência é obrigatória.');
    }

    const moeda = (input.moeda ?? 'BRL').trim().toUpperCase();
    const tipoOperacao: TipoOperacaoAposta = input.tipoOperacao ?? 'APOSTA';
    const referenciaExterna = input.idReferenciaExterna?.trim() || null;

    const valorBigInt =
      typeof input.valorCentavos === 'bigint'
        ? input.valorCentavos
        : BigInt(input.valorCentavos.trim());

    if (valorBigInt <= 0n) {
      throw new Error('O valor em centavos deve ser maior que zero.');
    }

    const valorDinheiro = centavosParaDinheiro(valorBigInt, moeda);
    const payloadHash = calcularHashPayload({
      idCarteira,
      tipoOperacao,
      valorCentavos: valorBigInt.toString(),
      moeda: valorDinheiro.moeda,
      idReferenciaExterna: referenciaExterna,
    });

    return this.em.transactional(async (txEm) => {
      const carteira = await txEm.findOne(
        CarteiraEntity,
        { id: idCarteira },
        { lockMode: LockMode.PESSIMISTIC_WRITE },
      );

      if (!carteira) {
        throw new Error('Carteira não encontrada.');
      }

      if (carteira.moeda.trim().toUpperCase() !== valorDinheiro.moeda) {
        throw new Error('Moeda incompatível com a carteira.');
      }

      const transacaoExistente = await txEm.findOne(TransacaoApostaEntity, {
        chaveIdempotencia,
      });

      if (transacaoExistente) {
        if (
          transacaoExistente.hashPayload &&
          transacaoExistente.hashPayload !== payloadHash
        ) {
          throw new Error(
            'Conflito de idempotência: a mesma chave foi enviada com payload diferente.',
          );
        }

        return {
          idTransacao: transacaoExistente.id,
          idCarteira: carteira.id,
          chaveIdempotencia: transacaoExistente.chaveIdempotencia,
          tipoOperacao:
            (transacaoExistente.tipoOperacao as TipoOperacaoAposta) ?? tipoOperacao,
          valorCentavos: BigInt(transacaoExistente.valorCentavos).toString(),
          saldoRestanteCentavos: BigInt(carteira.saldoCentavos).toString(),
          versaoCarteira: carteira.versao,
          status: transacaoExistente.status,
          idempotente: true,
        };
      }

      const saldoAntesBigInt = BigInt(carteira.saldoCentavos);
      const saldoAntesDinheiro = centavosParaDinheiro(
        saldoAntesBigInt,
        carteira.moeda,
      );

      const ehDebito = tipoOperacao === 'APOSTA';
      const ehSemMovimento = tipoOperacao === 'PERDA';

      let saldoDepoisDinheiro = saldoAntesDinheiro;
      let novoStatus: TransacaoApostaEntity['status'] = 'CONFIRMADA';

      if (ehDebito) {
        if (!saldoAntesDinheiro.ehMaiorOuIgual(valorDinheiro)) {
          throw new Error('Saldo insuficiente na carteira.');
        }
        saldoDepoisDinheiro = saldoAntesDinheiro.subtrair(valorDinheiro);
        novoStatus = 'CONFIRMADA';
      } else if (!ehSemMovimento) {
        // GANHO, ESTORNO, REVERSAO
        saldoDepoisDinheiro = saldoAntesDinheiro.somar(valorDinheiro);
        novoStatus = tipoOperacao === 'GANHO' ? 'LIQUIDADA' : 'CANCELADA';
      }

      const saldoDepoisBigInt = saldoDepoisDinheiro.centavos;
      const valorNormalizadoStr = valorBigInt.toString();
      const saldoAntesStr = saldoAntesBigInt.toString();
      const saldoDepoisStr = saldoDepoisBigInt.toString();

      const agora = new Date();
      const idTransacao = randomUUID();
      const idLancamento = randomUUID();
      const idOutbox = randomUUID();
      const idEvento = randomUUID();

      if (!ehSemMovimento) {
        carteira.saldoCentavos = saldoDepoisStr;
        carteira.versao += 1;
      }
      carteira.atualizadoEm = agora;

      const transacao = txEm.create(TransacaoApostaEntity, {
        id: idTransacao,
        carteira,
        chaveIdempotencia,
        hashPayload: payloadHash,
        tipoOperacao,
        valorCentavos: valorNormalizadoStr,
        moeda: valorDinheiro.moeda,
        status: novoStatus,
        idReferenciaExterna: referenciaExterna,
        codigoFalha: null,
        snapshotSaldoCentavos: saldoDepoisStr,
        criadoEm: agora,
        atualizadoEm: agora,
      });

      const entitiesToPersist: unknown[] = [carteira, transacao];

      if (!ehSemMovimento) {
        const lancamento = txEm.create(LancamentoCarteiraEntity, {
          id: idLancamento,
          carteira,
          idTransacao,
          tipo: ehDebito ? 'DEBITO' : 'CREDITO',
          valorCentavos: valorNormalizadoStr,
          saldoAntesCentavos: saldoAntesStr,
          saldoDepoisCentavos: saldoDepoisStr,
          moeda: valorDinheiro.moeda,
          referenciaId: chaveIdempotencia,
          criadoEm: agora,
        });
        entitiesToPersist.push(lancamento);
      }

      const outbox = txEm.create(MensagemOutboxEntity, {
        id: idOutbox,
        idEvento,
        tipoEvento:
          tipoOperacao === 'APOSTA'
            ? 'APOSTA_CONFIRMADA'
            : tipoOperacao === 'GANHO'
              ? 'APOSTA_LIQUIDADA'
              : tipoOperacao === 'PERDA'
                ? 'APOSTA_PERDIDA'
                : 'APOSTA_REVERTIDA',
        idAgregado: carteira.id,
        dados: {
          idTransacao,
          idCarteira: carteira.id,
          chaveIdempotencia,
          tipoOperacao,
          valorCentavos: valorNormalizadoStr,
          moeda: valorDinheiro.moeda,
          saldoAntesCentavos: saldoAntesStr,
          saldoRestanteCentavos: saldoDepoisStr,
          versaoCarteira: carteira.versao,
        },
        idCorrelacao: input.idCorrelacao ?? null,
        status: 'PENDENTE',
        tentativas: 0,
        criadaEm: agora,
        publicadaEm: null,
        ultimoErro: null,
      });

      entitiesToPersist.push(outbox);
      txEm.persist(entitiesToPersist);

      return {
        idTransacao,
        idCarteira: carteira.id,
        chaveIdempotencia,
        tipoOperacao,
        valorCentavos: valorNormalizadoStr,
        saldoRestanteCentavos: saldoDepoisStr,
        versaoCarteira: carteira.versao,
        status: novoStatus,
        idempotente: false,
      };
    });
  }
}
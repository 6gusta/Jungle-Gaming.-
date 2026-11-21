import { randomUUID } from 'node:crypto';
import { EntityManager } from '@mikro-orm/postgresql';
import { Dinheiro } from '../domain/money';
import { CarteiraEntity } from '../entities/carteira.entity';
import { LancamentoCarteiraEntity } from '../entities/lancamento-carteira.entity';
import { MensagemOutboxEntity } from '../entities/mensagem-outbox.entity';

export interface CriarCarteiraInput {
  idUsuario: string;
  saldoInicialCentavos?: bigint | string;
  moeda?: string;
  idCorrelacao?: string;
}

export interface CriarCarteiraOutput {
  idCarteira: string;
  idUsuario: string;
  saldoCentavos: string;
  moeda: string;
  versao: number;
}

export class CriarCarteiraUseCase {
  constructor(private readonly em: EntityManager) {}

  async executar(input: CriarCarteiraInput): Promise<CriarCarteiraOutput> {
    const idUsuario = input.idUsuario.trim();
    if (!idUsuario) {
      throw new Error('O id do usuário é obrigatório.');
    }

    const moeda = (input.moeda ?? 'BRL').trim().toUpperCase();
    const zeroMoeda = Dinheiro.zero(moeda);

    let saldoInicial: Dinheiro;
    if (input.saldoInicialCentavos === undefined) {
      saldoInicial = zeroMoeda;
    } else {
      const valorBigInt =
        typeof input.saldoInicialCentavos === 'bigint'
          ? input.saldoInicialCentavos
          : BigInt(input.saldoInicialCentavos.trim());

      if (valorBigInt < 0n) {
        throw new Error('O saldo inicial em centavos deve ser maior ou igual a zero.');
      }

      // Converte centavos bigint para string decimal de 2 casas para o Dinheiro.deTextoDecimal
      const inteiro = valorBigInt / 100n;
      const frac = (valorBigInt % 100n).toString().padStart(2, '0');
      saldoInicial = Dinheiro.deTextoDecimal(`${inteiro.toString()}.${frac}`, moeda);
    }

    const agora = new Date();
    const idCarteira = randomUUID();
    const versaoInicial = 1;
    const saldoCentavosNormalizado = saldoInicial.centavos.toString();

    const carteira = this.em.create(CarteiraEntity, {
      id: idCarteira,
      idUsuario,
      saldoCentavos: saldoCentavosNormalizado,
      moeda: saldoInicial.moeda,
      versao: versaoInicial,
      criadoEm: agora,
      atualizadoEm: agora,
    });

    if (saldoInicial.centavos > 0n) {
      this.em.create(LancamentoCarteiraEntity, {
        id: randomUUID(),
        carteira,
        idTransacao: null,
        tipo: 'CREDITO',
        valorCentavos: saldoCentavosNormalizado,
        saldoAntesCentavos: '0',
        saldoDepoisCentavos: saldoCentavosNormalizado,
        moeda: saldoInicial.moeda,
        referenciaId: `abertura:${idCarteira}`,
        criadoEm: agora,
      });
    }

    this.em.create(MensagemOutboxEntity, {
      id: randomUUID(),
      idEvento: randomUUID(),
      tipoEvento: 'CarteiraCriada',
      idAgregado: idCarteira,
      idCorrelacao: input.idCorrelacao ?? null,
      dados: {
        idCarteira,
        idUsuario,
        moeda: saldoInicial.moeda,
        saldoCentavos: saldoCentavosNormalizado,
        versao: versaoInicial,
        criadoEm: agora.toISOString(),
      },
      status: 'PENDENTE',
      tentativas: 0,
      criadaEm: agora,
      publicadaEm: null,
      ultimoErro: null,
    });

    await this.em.flush();

    return {
      idCarteira,
      idUsuario,
      saldoCentavos: saldoCentavosNormalizado,
      moeda: saldoInicial.moeda,
      versao: versaoInicial,
    };
  }
}
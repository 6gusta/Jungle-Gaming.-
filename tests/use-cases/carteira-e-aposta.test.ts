import { describe, expect, it, beforeEach } from 'bun:test';
import { CriarCarteiraUseCase } from '../../src/use-cases/criar-carteira.use-case';
import { ProcessarTransacaoApostaUseCase } from '../../src/use-cases/processar-transacao-aposta.use-case';

class CarteiraEntity {
  id!: string;
  idUsuario!: string;
  saldoCentavos: string = '0';
  moeda: string = 'BRL';
  versao: number = 1;
  criadoEm: Date = new Date();
  atualizadoEm: Date = new Date();
}

class TransacaoApostaEntity {
  id!: string;
  idCarteira!: string;
  chaveIdempotencia!: string;
  valorCentavos: string = '0';
  moeda: string = 'BRL';
  status: string = 'PENDENTE';
  hashPayload?: string | null;
  tipoOperacao: string = 'APOSTA';
  criadoEm: Date = new Date();
  atualizadoEm: Date = new Date();
}

class LancamentoCarteiraEntity {
  id!: string;
  idCarteira!: string;
  tipo!: string;
  valorCentavos: string = '0';
  moeda: string = 'BRL';
  referenciaId!: string;
  idTransacao?: string | null;
  saldoAntesCentavos: string = '0';
  saldoDepoisCentavos: string = '0';
  criadoEm: Date = new Date();
}

class MensagemOutboxEntity {
  id!: string;
  idEvento!: string;
  tipoEvento!: string;
  idAgregado!: string;
  dados: unknown;
  status: string = 'PENDENTE';
  tentativas: number = 0;
  criadaEm: Date = new Date();
}

function criarEmFake() {
  const carteiras: CarteiraEntity[] = [];
  const transacoes: TransacaoApostaEntity[] = [];
  const lancamentos: LancamentoCarteiraEntity[] = [];
  const outbox: MensagemOutboxEntity[] = [];

  const em: any = {
    create(EntityClass: any, data: any) {
      const name = EntityClass?.name ?? '';
      const instance = Object.assign(new EntityClass(), data);
      if (name.includes('Carteira') && !name.includes('Lancamento')) {
        carteiras.push(instance);
      } else if (name.includes('TransacaoAposta')) {
        transacoes.push(instance);
      } else if (name.includes('LancamentoCarteira')) {
        lancamentos.push(instance);
      } else if (name.includes('MensagemOutbox')) {
        outbox.push(instance);
      }
      return instance;
    },
    persist() {},
    async flush() {},
    async findOne(EntityClass: any, where: any) {
      const name = EntityClass?.name ?? '';
      if (name.includes('Carteira') && !name.includes('Lancamento')) {
        return (
          carteiras.find(
            (c) =>
              (where.id && c.id === where.id) ||
              (where.idUsuario &&
                where.moeda &&
                c.idUsuario === where.idUsuario &&
                c.moeda === where.moeda),
          ) ?? null
        );
      }
      if (name.includes('TransacaoAposta')) {
        return (
          transacoes.find(
            (t) => t.chaveIdempotencia === where.chaveIdempotencia,
          ) ?? null
        );
      }
      return null;
    },
    async transactional(cb: (txEm: any) => Promise<any>) {
      return cb(em);
    },
  };

  return { em, carteiras, transacoes, lancamentos, outbox };
}

describe('Casos de Uso - Carteira e Transação de Aposta', () => {
  let ctx: ReturnType<typeof criarEmFake>;
  let criarCarteira: CriarCarteiraUseCase;
  let processarAposta: ProcessarTransacaoApostaUseCase;

  beforeEach(() => {
    ctx = criarEmFake();
    criarCarteira = new CriarCarteiraUseCase(ctx.em);
    processarAposta = new ProcessarTransacaoApostaUseCase(ctx.em);
  });

  it('cria carteira com saldo inicial em bigint, gera lançamento e evento no outbox', async () => {
    const res = await criarCarteira.executar({
      idUsuario: 'user-1',
      saldoInicialCentavos: '10000',
      moeda: 'brl',
    });

    expect(res.idUsuario).toBe('user-1');
    expect(res.saldoCentavos).toBe('10000');
    expect(res.moeda).toBe('BRL');
    expect(res.versao).toBe(1);
    expect(ctx.lancamentos.length).toBe(1);
    expect(ctx.outbox.length).toBe(1);
    expect(ctx.outbox[0].tipoEvento).toBe('CarteiraCriada');
  });

  it('rejeita saldo inicial negativo', async () => {
    await expect(
      criarCarteira.executar({
        idUsuario: 'user-1',
        saldoInicialCentavos: '-500',
        moeda: 'BRL',
      }),
    ).rejects.toThrow();
  });

  it('processa aposta, debita saldo, incrementa versão e grava ledger + outbox', async () => {
    const carteira = await criarCarteira.executar({
      idUsuario: 'user-1',
      saldoInicialCentavos: '5000',
      moeda: 'BRL',
    });

    const aposta = await processarAposta.executar({
      idCarteira: carteira.idCarteira,
      chaveIdempotencia: 'idem-001',
      valorCentavos: '1500',
      moeda: 'BRL',
    });

    expect(aposta.idempotente).toBe(false);
    expect(aposta.status).toBe('CONFIRMADA');
    expect(aposta.valorCentavos).toBe('1500');
    expect(aposta.saldoRestanteCentavos).toBe('3500');
    expect(aposta.versaoCarteira).toBe(2);
    expect(ctx.lancamentos.at(-1)?.saldoAntesCentavos).toBe('5000');
    expect(ctx.lancamentos.at(-1)?.saldoDepoisCentavos).toBe('3500');
    expect(ctx.outbox.at(-1)?.tipoEvento).toBe('APOSTA_CONFIRMADA');
  });

  it('retorna resultado idempotente na mesma chave e mesmo payload sem debitar duas vezes', async () => {
    const carteira = await criarCarteira.executar({
      idUsuario: 'user-1',
      saldoInicialCentavos: '5000',
      moeda: 'BRL',
    });

    const primeira = await processarAposta.executar({
      idCarteira: carteira.idCarteira,
      chaveIdempotencia: 'idem-dup',
      valorCentavos: '2000',
      moeda: 'BRL',
    });

    const segunda = await processarAposta.executar({
      idCarteira: carteira.idCarteira,
      chaveIdempotencia: 'idem-dup',
      valorCentavos: '2000',
      moeda: 'BRL',
    });

    expect(primeira.idempotente).toBe(false);
    expect(segunda.idempotente).toBe(true);
    expect(segunda.idTransacao).toBe(primeira.idTransacao);
    expect(segunda.saldoRestanteCentavos).toBe('3000');
    expect(ctx.transacoes.length).toBe(1);
  });

  it('lança erro ao reutilizar chave de idempotência com payload diferente', async () => {
    const carteira = await criarCarteira.executar({
      idUsuario: 'user-1',
      saldoInicialCentavos: '5000',
      moeda: 'BRL',
    });

    await processarAposta.executar({
      idCarteira: carteira.idCarteira,
      chaveIdempotencia: 'idem-conflito',
      valorCentavos: '1000',
      moeda: 'BRL',
    });

    await expect(
      processarAposta.executar({
        idCarteira: carteira.idCarteira,
        chaveIdempotencia: 'idem-conflito',
        valorCentavos: '2500',
        moeda: 'BRL',
      }),
    ).rejects.toThrow(/Conflito de idempotência/i);
  });

  it('bloqueia aposta quando o saldo é insuficiente', async () => {
    const carteira = await criarCarteira.executar({
      idUsuario: 'user-1',
      saldoInicialCentavos: '500',
      moeda: 'BRL',
    });

    await expect(
      processarAposta.executar({
        idCarteira: carteira.idCarteira,
        chaveIdempotencia: 'idem-sem-saldo',
        valorCentavos: '1000',
        moeda: 'BRL',
      }),
    ).rejects.toThrow(/Saldo insuficiente/i);
  });
});

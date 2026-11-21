import { MikroORM } from '@mikro-orm/postgresql';
import config from './mikro-orm.config';
import { CriarCarteiraUseCase } from './use-cases/criar-carteira.use-case';
import { ProcessarTransacaoApostaUseCase } from './use-cases/processar-transacao-aposta.use-case';

async function main() {
  const orm = await MikroORM.init(config);
  const em = orm.em.fork();

  try {
    const criarCarteira = new CriarCarteiraUseCase(em);
    const carteira = await criarCarteira.executar({
      idUsuario: 'user-001',
      saldoInicialCentavos: 10000,
      moeda: 'BRL',
    });
    console.log('Carteira criada:', carteira);

    const processarAposta = new ProcessarTransacaoApostaUseCase(em);
    const aposta1 = await processarAposta.executar({
      idCarteira: carteira.idCarteira,
      chaveIdempotencia: 'aposta-123',
      valorCentavos: 2500,
      moeda: 'BRL',
    });
    console.log('1ª execução:', aposta1);

    const aposta2 = await processarAposta.executar({
      idCarteira: carteira.idCarteira,
      chaveIdempotencia: 'aposta-123',
      valorCentavos: 2500,
      moeda: 'BRL',
    });
    console.log('2ª execução (idempotente):', aposta2);
  } finally {
    await orm.close();
  }
}

main();

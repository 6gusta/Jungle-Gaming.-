import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/postgresql';
import { CarteiraHttpController } from './carteira.controller';
import { CriarCarteiraUseCase } from '../use-cases/criar-carteira.use-case';
import { ProcessarTransacaoApostaUseCase } from '../use-cases/processar-transacao-aposta.use-case';
import { CarteiraEntity } from '../entities/carteira.entity';
import { LancamentoCarteiraEntity } from '../entities/lancamento-carteira.entity';
import { TransacaoApostaEntity } from '../entities/transacao-aposta.entity';
import { MensagemOutboxEntity } from '../entities/mensagem-outbox.entity';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      CarteiraEntity,
      LancamentoCarteiraEntity,
      TransacaoApostaEntity,
      MensagemOutboxEntity,
    ]),
  ],
  controllers: [CarteiraHttpController],
  providers: [
    {
      provide: CriarCarteiraUseCase,
      useFactory: (em: EntityManager) => new CriarCarteiraUseCase(em),
      inject: [EntityManager],
    },
    {
      provide: ProcessarTransacaoApostaUseCase,
      useFactory: (em: EntityManager) =>
        new ProcessarTransacaoApostaUseCase(em),
      inject: [EntityManager],
    },
  ],
})
export class CarteiraModule {}

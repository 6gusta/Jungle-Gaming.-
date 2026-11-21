import { Migration } from '@mikro-orm/migrations';

export class Migration20261120022344 extends Migration {

  override name = 'Migration20261120022344';

  override up(): void | Promise<void> {
    this.addSql(`create table "carteiras" ("id" varchar(64) not null, "id_usuario" varchar(64) not null, "saldo_centavos" int not null default 0, "moeda" varchar(3) not null default 'BRL', "criado_em" timestamptz not null, "atualizado_em" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "carteiras" add constraint "carteiras_id_usuario_unique" unique ("id_usuario");`);

    this.addSql(`create table "lancamentos_carteira" ("id" varchar(64) not null, "id_carteira" varchar(64) not null, "tipo" varchar(16) not null, "valor_centavos" int not null, "moeda" varchar(3) not null default 'BRL', "referencia_id" varchar(128) not null, "criado_em" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "lancamentos_carteira" add constraint "uq_lancamentos_referencia_tipo" unique ("referencia_id", "tipo");`);

    this.addSql(`create table "mensagens_inbox" ("id" varchar(64) not null, "id_evento" varchar(128) not null, "tipo_evento" varchar(128) not null, "status" varchar(24) not null default 'RECEBIDA', "recebida_em" timestamptz not null, "processada_em" timestamptz null, "erro" varchar(1000) null, primary key ("id"));`);
    this.addSql(`alter table "mensagens_inbox" add constraint "mensagens_inbox_id_evento_unique" unique ("id_evento");`);

    this.addSql(`create table "mensagens_outbox" ("id" varchar(64) not null, "id_evento" varchar(128) not null, "tipo_evento" varchar(128) not null, "id_agregado" varchar(64) not null, "dados" jsonb not null, "id_correlacao" varchar(128) null, "status" varchar(24) not null default 'PENDENTE', "tentativas" int not null default 0, "criada_em" timestamptz not null, "publicada_em" timestamptz null, "ultimo_erro" varchar(1000) null, primary key ("id"));`);
    this.addSql(`alter table "mensagens_outbox" add constraint "mensagens_outbox_id_evento_unique" unique ("id_evento");`);

    this.addSql(`create table "transacoes_aposta" ("id" varchar(64) not null, "id_carteira" varchar(64) not null, "chave_idempotencia" varchar(128) not null, "valor_centavos" int not null, "moeda" varchar(3) not null default 'BRL', "status" varchar(24) not null default 'PENDENTE', "criado_em" timestamptz not null, "atualizado_em" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "transacoes_aposta" add constraint "uq_transacoes_aposta_chave_idempotencia" unique ("chave_idempotencia");`);

    this.addSql(`alter table "carteiras" add constraint "chk_carteiras_saldo_centavos_nao_negativo" check (saldo_centavos >= 0);`);

    this.addSql(`alter table "lancamentos_carteira" add constraint "lancamentos_carteira_id_carteira_foreign" foreign key ("id_carteira") references "carteiras" ("id") on delete restrict;`);
    this.addSql(`alter table "lancamentos_carteira" add constraint "chk_lancamentos_valor_centavos_positivo" check (valor_centavos > 0);`);

    this.addSql(`alter table "mensagens_outbox" add constraint "chk_mensagens_outbox_tentativas_nao_negativo" check (tentativas >= 0);`);

    this.addSql(`alter table "transacoes_aposta" add constraint "transacoes_aposta_id_carteira_foreign" foreign key ("id_carteira") references "carteiras" ("id") on delete restrict;`);
    this.addSql(`alter table "transacoes_aposta" add constraint "chk_transacoes_aposta_valor_centavos_positivo" check (valor_centavos > 0);`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "lancamentos_carteira" drop constraint "lancamentos_carteira_id_carteira_foreign";`);
    this.addSql(`alter table "transacoes_aposta" drop constraint "transacoes_aposta_id_carteira_foreign";`);

    this.addSql(`drop table if exists "carteiras" cascade;`);
    this.addSql(`drop table if exists "lancamentos_carteira" cascade;`);
    this.addSql(`drop table if exists "mensagens_inbox" cascade;`);
    this.addSql(`drop table if exists "mensagens_outbox" cascade;`);
    this.addSql(`drop table if exists "transacoes_aposta" cascade;`);
  }

}

import { Migration } from '@mikro-orm/migrations';

export class Migration20261120125323 extends Migration {

  override name = 'Migration20261120125323';

  override up(): void | Promise<void> {
    this.addSql(`alter table "carteiras" drop constraint "carteiras_id_usuario_unique";`);
    this.addSql(`alter table "carteiras" add "versao" int not null default 1;`);
    this.addSql(`alter table "carteiras" alter column "saldo_centavos" type bigint using ("saldo_centavos"::bigint);`);
    this.addSql(`alter table "carteiras" add constraint "uq_carteiras_usuario_moeda" unique ("id_usuario", "moeda");`);
    this.addSql(`alter table "carteiras" add constraint "chk_carteiras_versao_positiva" check (versao >= 1);`);

    this.addSql(`alter table "lancamentos_carteira" drop constraint "uq_lancamentos_referencia_tipo";`);
    this.addSql(`alter table "lancamentos_carteira" add "id_transacao" varchar(64) null, add "saldo_antes_centavos" bigint not null default '0', add "saldo_depois_centavos" bigint not null default '0';`);
    this.addSql(`alter table "lancamentos_carteira" alter column "valor_centavos" type bigint using ("valor_centavos"::bigint);`);
    this.addSql(`alter table "lancamentos_carteira" add constraint "uq_lancamentos_carteira_referencia_tipo" unique ("id_carteira", "referencia_id", "tipo");`);
    this.addSql(`alter table "lancamentos_carteira" add constraint "chk_lancamentos_saldo_depois_nao_negativo" check (saldo_depois_centavos >= 0);`);
    this.addSql(`alter table "lancamentos_carteira" add constraint "chk_lancamentos_saldo_antes_nao_negativo" check (saldo_antes_centavos >= 0);`);

    this.addSql(`alter table "mensagens_inbox" drop constraint "mensagens_inbox_id_evento_unique";`);
    this.addSql(`alter table "mensagens_inbox" add "consumidor" varchar(128) not null default 'default-consumer', add "tentativas" int not null default 1;`);
    this.addSql(`create index "idx_inbox_status_recebida" on "mensagens_inbox" ("status", "recebida_em");`);
    this.addSql(`alter table "mensagens_inbox" add constraint "uq_inbox_consumidor_evento" unique ("consumidor", "id_evento");`);

    this.addSql(`create index "idx_mensagens_outbox_status_criada" on "mensagens_outbox" ("status", "criada_em");`);

    this.addSql(`alter table "transacoes_aposta" add "hash_payload" varchar(128) null, add "tipo_operacao" varchar(24) not null default 'APOSTA', add "id_referencia_externa" varchar(128) null, add "codigo_falha" varchar(64) null, add "snapshot_saldo_centavos" bigint null;`);
    this.addSql(`alter table "transacoes_aposta" alter column "valor_centavos" type bigint using ("valor_centavos"::bigint);`);
    this.addSql(`create index "idx_transacoes_aposta_carteira_criado" on "transacoes_aposta" ("id_carteira", "criado_em");`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "carteiras" drop constraint "uq_carteiras_usuario_moeda";`);
    this.addSql(`alter table "carteiras" drop constraint "chk_carteiras_versao_positiva";`);
    this.addSql(`alter table "carteiras" drop column "versao";`);
    this.addSql(`alter table "carteiras" alter column "saldo_centavos" type int using ("saldo_centavos"::int);`);
    this.addSql(`alter table "carteiras" alter column "saldo_centavos" set default 0;`);
    this.addSql(`alter table "carteiras" add constraint "carteiras_id_usuario_unique" unique ("id_usuario");`);

    this.addSql(`alter table "lancamentos_carteira" drop constraint "uq_lancamentos_carteira_referencia_tipo";`);
    this.addSql(`alter table "lancamentos_carteira" drop constraint "chk_lancamentos_saldo_depois_nao_negativo";`);
    this.addSql(`alter table "lancamentos_carteira" drop constraint "chk_lancamentos_saldo_antes_nao_negativo";`);
    this.addSql(`alter table "lancamentos_carteira" drop column "id_transacao", drop column "saldo_antes_centavos", drop column "saldo_depois_centavos";`);
    this.addSql(`alter table "lancamentos_carteira" alter column "valor_centavos" type int using ("valor_centavos"::int);`);
    this.addSql(`alter table "lancamentos_carteira" add constraint "uq_lancamentos_referencia_tipo" unique ("referencia_id", "tipo");`);

    this.addSql(`drop index "idx_inbox_status_recebida";`);
    this.addSql(`alter table "mensagens_inbox" drop constraint "uq_inbox_consumidor_evento";`);
    this.addSql(`alter table "mensagens_inbox" drop column "consumidor", drop column "tentativas";`);
    this.addSql(`alter table "mensagens_inbox" add constraint "mensagens_inbox_id_evento_unique" unique ("id_evento");`);

    this.addSql(`drop index "idx_mensagens_outbox_status_criada";`);

    this.addSql(`drop index "idx_transacoes_aposta_carteira_criado";`);
    this.addSql(`alter table "transacoes_aposta" drop column "hash_payload", drop column "tipo_operacao", drop column "id_referencia_externa", drop column "codigo_falha", drop column "snapshot_saldo_centavos";`);
    this.addSql(`alter table "transacoes_aposta" alter column "valor_centavos" type int using ("valor_centavos"::int);`);
  }

}

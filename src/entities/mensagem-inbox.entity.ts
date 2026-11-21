import { Entity, PrimaryKey, Property, Unique, Index } from '@mikro-orm/decorators/legacy';

@Entity({ tableName: 'mensagens_inbox' })
@Unique({ name: 'uq_inbox_consumidor_evento', properties: ['consumidor', 'idEvento'] })
@Index({ name: 'idx_inbox_status_recebida', properties: ['status', 'recebidaEm'] })
export class MensagemInboxEntity {
  @PrimaryKey({ type: 'string', length: 64 })
  id!: string;

  @Property({ type: 'string', length: 128, default: 'default-consumer' })
  consumidor: string = 'default-consumer';

  @Property({ fieldName: 'id_evento', type: 'string', length: 128 })
  idEvento!: string;

  @Property({ fieldName: 'tipo_evento', type: 'string', length: 128 })
  tipoEvento!: string;

  @Property({ type: 'string', length: 24, default: 'RECEBIDA' })
  status: 'RECEBIDA' | 'PROCESSADA' | 'FALHA' = 'RECEBIDA';

  @Property({ type: 'number', default: 1 })
  tentativas: number = 1;

  @Property({ fieldName: 'recebida_em', type: 'Date' })
  recebidaEm: Date = new Date();

  @Property({ fieldName: 'processada_em', type: 'Date', nullable: true })
  processadaEm: Date | null = null;

  @Property({ type: 'string', length: 1000, nullable: true })
  erro: string | null = null;
}
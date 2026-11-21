import { Entity, PrimaryKey, Property, Check, Index } from '@mikro-orm/decorators/legacy';

@Entity({ tableName: 'mensagens_outbox' })
@Index({ name: 'idx_mensagens_outbox_status_criada', properties: ['status', 'criadaEm'] })
@Check({ name: 'chk_mensagens_outbox_tentativas_nao_negativo', expression: 'tentativas >= 0' })
export class MensagemOutboxEntity {
  @PrimaryKey({ type: 'string', length: 64 })
  id!: string;

  @Property({ fieldName: 'id_evento', type: 'string', length: 128, unique: true })
  idEvento!: string;

  @Property({ fieldName: 'tipo_evento', type: 'string', length: 128 })
  tipoEvento!: string;

  @Property({ fieldName: 'id_agregado', type: 'string', length: 64 })
  idAgregado!: string;

  @Property({ type: 'json' })
  dados!: Record<string, unknown>;

  @Property({ fieldName: 'id_correlacao', type: 'string', length: 128, nullable: true })
  idCorrelacao: string | null = null;

  @Property({ type: 'string', length: 24, default: 'PENDENTE' })
  status: 'PENDENTE' | 'PUBLICADA' | 'FALHA' = 'PENDENTE';

  @Property({ type: 'number', default: 0 })
  tentativas: number = 0;

  @Property({ fieldName: 'criada_em', type: 'Date' })
  criadaEm: Date = new Date();

  @Property({ fieldName: 'publicada_em', type: 'Date', nullable: true })
  publicadaEm: Date | null = null;

  @Property({ fieldName: 'ultimo_erro', type: 'string', length: 1000, nullable: true })
  ultimoErro: string | null = null;
}
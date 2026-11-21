import { Entity, PrimaryKey, Property, ManyToOne, Check, Unique, Index } from '@mikro-orm/decorators/legacy';
import { CarteiraEntity } from './carteira.entity';

@Entity({ tableName: 'transacoes_aposta' })
@Unique({ name: 'uq_transacoes_aposta_chave_idempotencia', properties: ['chaveIdempotencia'] })
@Index({ name: 'idx_transacoes_aposta_carteira_criado', properties: ['carteira', 'criadoEm'] })
@Check({ name: 'chk_transacoes_aposta_valor_centavos_positivo', expression: 'valor_centavos > 0' })
export class TransacaoApostaEntity {
  @PrimaryKey({ type: 'string', length: 64 })
  id!: string;

  @ManyToOne(() => CarteiraEntity, {
    fieldName: 'id_carteira',
    deleteRule: 'restrict',
  })
  carteira!: CarteiraEntity;

  @Property({ fieldName: 'chave_idempotencia', type: 'string', length: 128 })
  chaveIdempotencia!: string;

  @Property({ fieldName: 'hash_payload', type: 'string', length: 128, nullable: true })
  hashPayload: string | null = null;

  @Property({ fieldName: 'tipo_operacao', type: 'string', length: 24, default: 'APOSTA' })
  tipoOperacao: 'ABERTURA' | 'APOSTA' | 'GANHO' | 'PERDA' | 'ESTORNO' | 'REVERSAO' = 'APOSTA';

  @Property({ fieldName: 'valor_centavos', type: 'bigint' })
  valorCentavos!: string;

  @Property({ type: 'string', length: 3, default: 'BRL' })
  moeda: string = 'BRL';

  @Property({ type: 'string', length: 24, default: 'PENDENTE' })
  status:
    | 'PENDENTE'
    | 'AGUARDANDO_REFERENCIA'
    | 'CONFIRMADA'
    | 'CANCELADA'
    | 'LIQUIDADA'
    | 'FALHA' = 'PENDENTE';

  @Property({ fieldName: 'id_referencia_externa', type: 'string', length: 128, nullable: true })
  idReferenciaExterna: string | null = null;

  @Property({ fieldName: 'codigo_falha', type: 'string', length: 64, nullable: true })
  codigoFalha: string | null = null;

  @Property({ fieldName: 'snapshot_saldo_centavos', type: 'bigint', nullable: true })
  snapshotSaldoCentavos: string | null = null;

  @Property({ fieldName: 'criado_em', type: 'Date' })
  criadoEm: Date = new Date();

  @Property({ fieldName: 'atualizado_em', type: 'Date', onUpdate: () => new Date() })
  atualizadoEm: Date = new Date();
}
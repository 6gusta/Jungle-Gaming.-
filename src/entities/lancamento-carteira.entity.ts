import { Entity, PrimaryKey, Property, ManyToOne, Check, Unique } from '@mikro-orm/decorators/legacy';
import { CarteiraEntity } from './carteira.entity';

@Entity({ tableName: 'lancamentos_carteira' })
@Unique({ name: 'uq_lancamentos_carteira_referencia_tipo', properties: ['carteira', 'referenciaId', 'tipo'] })
@Check({ name: 'chk_lancamentos_valor_centavos_positivo', expression: 'valor_centavos > 0' })
@Check({ name: 'chk_lancamentos_saldo_antes_nao_negativo', expression: 'saldo_antes_centavos >= 0' })
@Check({ name: 'chk_lancamentos_saldo_depois_nao_negativo', expression: 'saldo_depois_centavos >= 0' })
export class LancamentoCarteiraEntity {
  @PrimaryKey({ type: 'string', length: 64 })
  id!: string;

  @ManyToOne(() => CarteiraEntity, {
    fieldName: 'id_carteira',
    deleteRule: 'restrict',
  })
  carteira!: CarteiraEntity;

  @Property({ fieldName: 'id_transacao', type: 'string', length: 64, nullable: true })
  idTransacao: string | null = null;

  @Property({ type: 'string', length: 16 })
  tipo!: 'CREDITO' | 'DEBITO';

  @Property({ fieldName: 'valor_centavos', type: 'bigint' })
  valorCentavos!: string;

  @Property({ fieldName: 'saldo_antes_centavos', type: 'bigint', default: '0' })
  saldoAntesCentavos: string = '0';

  @Property({ fieldName: 'saldo_depois_centavos', type: 'bigint', default: '0' })
  saldoDepoisCentavos: string = '0';

  @Property({ type: 'string', length: 3, default: 'BRL' })
  moeda: string = 'BRL';

  @Property({ fieldName: 'referencia_id', type: 'string', length: 128 })
  referenciaId!: string;

  @Property({ fieldName: 'criado_em', type: 'Date' })
  criadoEm: Date = new Date();
}
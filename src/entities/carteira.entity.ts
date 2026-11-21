import { Entity, PrimaryKey, Property, Check, Unique } from '@mikro-orm/decorators/legacy';

@Entity({ tableName: 'carteiras' })
@Unique({ name: 'uq_carteiras_usuario_moeda', properties: ['idUsuario', 'moeda'] })
@Check({ name: 'chk_carteiras_saldo_centavos_nao_negativo', expression: 'saldo_centavos >= 0' })
@Check({ name: 'chk_carteiras_versao_positiva', expression: 'versao >= 1' })
export class CarteiraEntity {
  @PrimaryKey({ type: 'string', length: 64 })
  id!: string;

  @Property({ fieldName: 'id_usuario', type: 'string', length: 64 })
  idUsuario!: string;

  @Property({ fieldName: 'saldo_centavos', type: 'bigint', default: '0' })
  saldoCentavos: string = '0';

  @Property({ type: 'string', length: 3, default: 'BRL' })
  moeda: string = 'BRL';

  @Property({ type: 'number', default: 1 })
  versao: number = 1;

  @Property({ fieldName: 'criado_em', type: 'Date' })
  criadoEm: Date = new Date();

  @Property({ fieldName: 'atualizado_em', type: 'Date', onUpdate: () => new Date() })
  atualizadoEm: Date = new Date();
}
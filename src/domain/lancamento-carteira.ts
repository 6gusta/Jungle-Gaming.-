import { Dinheiro } from './dinheiro';

export type TipoLancamentoCarteira = 'CREDITO' | 'DEBITO';

export interface PropsLancamentoCarteira {
  id: string;
  idCarteira: string;
  tipo: TipoLancamentoCarteira;
  valor: Dinheiro;
  saldoApos: Dinheiro;
  referenciaExterna: string;
  criadoEm?: Date;
}

export class LancamentoCarteira {
  public readonly id: string;
  public readonly idCarteira: string;
  public readonly tipo: TipoLancamentoCarteira;
  public readonly valor: Dinheiro;
  public readonly saldoApos: Dinheiro;
  public readonly referenciaExterna: string;
  public readonly criadoEm: Date;

  constructor(props: PropsLancamentoCarteira) {
    if (!props.id.trim()) {
      throw new Error('O id do lançamento é obrigatório');
    }
    if (!props.idCarteira.trim()) {
      throw new Error('O idCarteira do lançamento é obrigatório');
    }
    if (props.valor.ehZeroOuNegativo()) {
      throw new Error('O valor do lançamento precisa ser maior que zero');
    }
    if (props.saldoApos.ehNegativo()) {
      throw new Error('O saldoApos não pode ser negativo');
    }
    if (!props.referenciaExterna.trim()) {
      throw new Error('A referenciaExterna do lançamento é obrigatória');
    }

    this.id = props.id;
    this.idCarteira = props.idCarteira;
    this.tipo = props.tipo;
    this.valor = props.valor;
    this.saldoApos = props.saldoApos;
    this.referenciaExterna = props.referenciaExterna;
    this.criadoEm = props.criadoEm ?? new Date();
  }
}

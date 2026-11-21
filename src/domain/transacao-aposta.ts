import { Dinheiro } from './money';

export type StatusTransacaoAposta =
  | 'PENDENTE'
  | 'CONFIRMADA'
  | 'CANCELADA'
  | 'LIQUIDADA';

export interface PropsTransacaoAposta {
  id: string;
  idCarteira: string;
  chaveIdempotencia: string;
  valor: Dinheiro;
  status?: StatusTransacaoAposta;
  criadoEm?: Date;
  atualizadoEm?: Date;
}

export class TransacaoAposta {
  public readonly id: string;
  public readonly idCarteira: string;
  public readonly chaveIdempotencia: string;
  public readonly valor: Dinheiro;
  private _status: StatusTransacaoAposta;
  public readonly criadoEm: Date;
  private _atualizadoEm: Date;

  constructor(props: PropsTransacaoAposta) {
    if (!props.id.trim()) {
      throw new Error('O id da transação de aposta é obrigatório');
    }
    if (!props.idCarteira.trim()) {
      throw new Error('O idCarteira da transação de aposta é obrigatório');
    }
    if (!props.chaveIdempotencia.trim()) {
      throw new Error('A chaveIdempotencia é obrigatória');
    }
    if (props.valor.ehZeroOuNegativo()) {
      throw new Error('O valor da aposta precisa ser maior que zero');
    }

    this.id = props.id;
    this.idCarteira = props.idCarteira;
    this.chaveIdempotencia = props.chaveIdempotencia;
    this.valor = props.valor;
    this._status = props.status ?? 'PENDENTE';
    this.criadoEm = props.criadoEm ?? new Date();
    this._atualizadoEm = props.atualizadoEm ?? new Date();
  }

  get status(): StatusTransacaoAposta {
    return this._status;
  }

  get atualizadoEm(): Date {
    return this._atualizadoEm;
  }

  confirmar(agora: Date = new Date()): void {
    if (this._status !== 'PENDENTE') {
      throw new Error(`Não é possível confirmar aposta no status ${this._status}`);
    }
    this._status = 'CONFIRMADA';
    this._atualizadoEm = agora;
  }

  cancelar(agora: Date = new Date()): void {
    if (this._status === 'LIQUIDADA') {
      throw new Error('Não é possível cancelar uma aposta já liquidada');
    }
    this._status = 'CANCELADA';
    this._atualizadoEm = agora;
  }

  liquidar(agora: Date = new Date()): void {
    if (this._status !== 'CONFIRMADA') {
      throw new Error(`Não é possível liquidar aposta no status ${this._status}`);
    }
    this._status = 'LIQUIDADA';
    this._atualizadoEm = agora;
  }
}

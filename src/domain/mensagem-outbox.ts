export type StatusMensagemOutbox = 'PENDENTE' | 'PUBLICADO' | 'FALHOU';

export interface PropsMensagemOutbox {
  id: string;
  tipoEvento: string;
  idAgregado: string;
  cargaUtil: Record<string, unknown>;
  status?: StatusMensagemOutbox;
  tentativas?: number;
  criadoEm?: Date;
  publicadoEm?: Date | null;
}

export class MensagemOutbox {
  public readonly id: string;
  public readonly tipoEvento: string;
  public readonly idAgregado: string;
  public readonly cargaUtil: Record<string, unknown>;
  private _status: StatusMensagemOutbox;
  private _tentativas: number;
  public readonly criadoEm: Date;
  private _publicadoEm: Date | null;

  constructor(props: PropsMensagemOutbox) {
    if (!props.id.trim()) {
      throw new Error('O id do outbox é obrigatório');
    }
    if (!props.tipoEvento.trim()) {
      throw new Error('O tipoEvento do outbox é obrigatório');
    }
    if (!props.idAgregado.trim()) {
      throw new Error('O idAgregado do outbox é obrigatório');
    }

    this.id = props.id;
    this.tipoEvento = props.tipoEvento;
    this.idAgregado = props.idAgregado;
    this.cargaUtil = props.cargaUtil;
    this._status = props.status ?? 'PENDENTE';
    this._tentativas = props.tentativas ?? 0;
    this.criadoEm = props.criadoEm ?? new Date();
    this._publicadoEm = props.publicadoEm ?? null;
  }

  get status(): StatusMensagemOutbox {
    return this._status;
  }

  get tentativas(): number {
    return this._tentativas;
  }

  get publicadoEm(): Date | null {
    return this._publicadoEm;
  }

  marcarPublicado(agora: Date = new Date()): void {
    this._status = 'PUBLICADO';
    this._publicadoEm = agora;
  }

  registrarFalha(maxTentativas = 5): void {
    this._tentativas += 1;
    if (this._tentativas >= maxTentativas) {
      this._status = 'FALHOU';
    }
  }
}

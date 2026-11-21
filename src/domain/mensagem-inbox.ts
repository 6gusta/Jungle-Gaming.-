export type StatusMensagemInbox = 'RECEBIDA' | 'PROCESSADA' | 'FALHOU';

export interface PropsMensagemInbox {
  idMensagem: string;
  tipoEvento: string;
  cargaUtil: Record<string, unknown>;
  status?: StatusMensagemInbox;
  recebidoEm?: Date;
  processadoEm?: Date | null;
}

export class MensagemInbox {
  public readonly idMensagem: string;
  public readonly tipoEvento: string;
  public readonly cargaUtil: Record<string, unknown>;
  private _status: StatusMensagemInbox;
  public readonly recebidoEm: Date;
  private _processadoEm: Date | null;

  constructor(props: PropsMensagemInbox) {
    if (!props.idMensagem.trim()) {
      throw new Error('O idMensagem do inbox é obrigatório');
    }
    if (!props.tipoEvento.trim()) {
      throw new Error('O tipoEvento do inbox é obrigatório');
    }

    this.idMensagem = props.idMensagem;
    this.tipoEvento = props.tipoEvento;
    this.cargaUtil = props.cargaUtil;
    this._status = props.status ?? 'RECEBIDA';
    this.recebidoEm = props.recebidoEm ?? new Date();
    this._processadoEm = props.processadoEm ?? null;
  }

  get status(): StatusMensagemInbox {
    return this._status;
  }

  get processadoEm(): Date | null {
    return this._processadoEm;
  }

  marcarProcessada(agora: Date = new Date()): void {
    this._status = 'PROCESSADA';
    this._processadoEm = agora;
  }

  marcarFalha(agora: Date = new Date()): void {
    this._status = 'FALHOU';
    this._processadoEm = agora;
  }
}

export interface PropsEventoIntegracao<TPayload = Record<string, unknown>> {
  idEvento: string;
  tipoEvento: string;
  ocorridoEm: Date;
  idAgregado: string;
  dados: TPayload;
  idCorrelacao?: string;
}

export class EventoIntegracao<TPayload = Record<string, unknown>> {
  public readonly idEvento: string;
  public readonly tipoEvento: string;
  public readonly ocorridoEm: Date;
  public readonly idAgregado: string;
  public readonly dados: TPayload;
  public readonly idCorrelacao?: string;

  constructor(props: PropsEventoIntegracao<TPayload>) {
    if (!props.idEvento.trim()) {
      throw new Error('idEvento é obrigatório');
    }
    if (!props.tipoEvento.trim()) {
      throw new Error('tipoEvento é obrigatório');
    }
    if (!props.idAgregado.trim()) {
      throw new Error('idAgregado é obrigatório');
    }
    if (!(props.ocorridoEm instanceof Date) || Number.isNaN(props.ocorridoEm.getTime())) {
      throw new Error('ocorridoEm precisa ser uma Data válida');
    }

    this.idEvento = props.idEvento;
    this.tipoEvento = props.tipoEvento;
    this.ocorridoEm = props.ocorridoEm;
    this.idAgregado = props.idAgregado;
    this.dados = props.dados;
    this.idCorrelacao = props.idCorrelacao;
  }
}

export interface PropsDinheiro {
  amount: string;   // decimal string com 2 casas, ex.: "25.00"
  currency: string; // ISO-4217, ex.: "BRL"
}

const DECIMAL_TWO_PLACES_REGEX = /^-?(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;
const CURRENCY_REGEX = /^[A-Z]{3}$/;

function parseStringDecimalParaCentavos(valor: string): bigint {
  if (typeof valor !== 'string') {
    throw new Error('O valor monetário deve ser informado como string');
  }

  const limpo = valor.trim();
  if (!limpo || !DECIMAL_TWO_PLACES_REGEX.test(limpo)) {
    throw new Error(
      `Valor monetário inválido: "${valor}". Use string decimal com até 2 casas (ex.: "25.00")`,
    );
  }

  const negativo = limpo.startsWith('-');
  const semSinal = negativo ? limpo.slice(1) : limpo;
  const [parteInteira, parteFrac = ''] = semSinal.split('.');

  if (parteFrac.length > 2) {
    throw new Error(`Valor monetário não pode ter mais de 2 casas decimais: "${valor}"`);
  }

  const fracPreenchida = parteFrac.padEnd(2, '0');
  const centavos = BigInt(parteInteira) * 100n + BigInt(fracPreenchida);

  return negativo ? -centavos : centavos;
}

export class Dinheiro {
  public readonly moeda: string;

  private constructor(
    public readonly centavos: bigint,
    moeda: string,
  ) {
    if (typeof centavos !== 'bigint') {
      throw new Error('O valor em centavos precisa ser um bigint');
    }

    const moedaNormalizada = moeda.trim().toUpperCase();
    if (!CURRENCY_REGEX.test(moedaNormalizada)) {
      throw new Error('A moeda é obrigatória e deve seguir o padrão ISO-4217 (ex.: BRL)');
    }

    this.moeda = moedaNormalizada;
  }

  static deTextoDecimal(amount: string, moeda = 'BRL'): Dinheiro {
    return new Dinheiro(parseStringDecimalParaCentavos(amount), moeda);
  }

  static deCentavos(centavos: bigint | string, moeda = 'BRL'): Dinheiro {
    const valorBigInt = typeof centavos === 'bigint' ? centavos : BigInt(centavos);
    return new Dinheiro(valorBigInt, moeda);
  }

  /**
   * Mantido por compatibilidade, mas exige string decimal sem notação científica
   * e sem mais de 2 casas decimais.
   */
  static deDecimal(valor: string, moeda = 'BRL'): Dinheiro {
    return new Dinheiro(parseStringDecimalParaCentavos(valor), moeda);
  }

  static zero(moeda = 'BRL'): Dinheiro {
    return new Dinheiro(0n, moeda);
  }

  private garantirMesmaMoeda(outro: Dinheiro): void {
    if (this.moeda !== outro.moeda) {
      throw new Error(`Moedas incompatíveis: ${this.moeda} e ${outro.moeda}`);
    }
  }

  somar(outro: Dinheiro): Dinheiro {
    this.garantirMesmaMoeda(outro);
    return new Dinheiro(this.centavos + outro.centavos, this.moeda);
  }

  subtrair(outro: Dinheiro): Dinheiro {
    this.garantirMesmaMoeda(outro);
    return new Dinheiro(this.centavos - outro.centavos, this.moeda);
  }

  ehNegativo(): boolean {
    return this.centavos < 0n;
  }

  ehZeroOuNegativo(): boolean {
    return this.centavos <= 0n;
  }

  ehMaiorOuIgual(outro: Dinheiro): boolean {
    this.garantirMesmaMoeda(outro);
    return this.centavos >= outro.centavos;
  }

  igualA(outro: Dinheiro): boolean {
    return this.moeda === outro.moeda && this.centavos === outro.centavos;
  }

  paraStringDecimal(): string {
    const negativo = this.centavos < 0n;
    const abs = negativo ? -this.centavos : this.centavos;
    const inteiro = abs / 100n;
    const frac = (abs % 100n).toString().padStart(2, '0');
    const formatado = `${inteiro.toString()}.${frac}`;
    return negativo ? `-${formatado}` : formatado;
  }

  toJSON(): PropsDinheiro {
    return {
      amount: this.paraStringDecimal(),
      currency: this.moeda,
    };
  }
}
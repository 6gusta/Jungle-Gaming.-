export interface MoneyProps {
  amount: string;   // decimal string com 2 casas, ex.: "25.00"
  currency: string; // ISO-4217, ex.: "BRL"
}

const DECIMAL_TWO_PLACES_REGEX = /^-?(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;
const CURRENCY_REGEX = /^[A-Z]{3}$/;

function parseDecimalToMinorUnits(amount: string): bigint {
  if (typeof amount !== 'string') {
    throw new Error('O valor monetário deve ser informado como string.');
  }

  const trimmed = amount.trim();
  if (!trimmed || !DECIMAL_TWO_PLACES_REGEX.test(trimmed)) {
    throw new Error(
      `Valor monetário inválido: "${amount}". Use string decimal com até 2 casas (ex.: "25.00"), sem notação científica.`,
    );
  }

  const negative = trimmed.startsWith('-');
  const unsigned = negative ? trimmed.slice(1) : trimmed;
  const [intPart, fracPart = ''] = unsigned.split('.');

  if (fracPart.length > 2) {
    throw new Error(`Valor monetário não pode ter mais de 2 casas decimais: "${amount}".`);
  }

  const paddedFrac = fracPart.padEnd(2, '0');
  const minor = BigInt(intPart) * 100n + BigInt(paddedFrac);

  return negative ? -minor : minor;
}

function formatMinorUnitsToAmount(minor: bigint): string {
  const negative = minor < 0n;
  const absMinor = negative ? -minor : minor;
  const intPart = absMinor / 100n;
  const fracPart = (absMinor % 100n).toString().padStart(2, '0');
  const formatted = `${intPart.toString()}.${fracPart}`;

  return negative ? `-${formatted}` : formatted;
}

export class Money {
  public readonly currency: string;

  private constructor(
    private readonly minorUnits: bigint,
    currency: string,
  ) {
    const normalizedCurrency = currency.trim().toUpperCase();
    if (!CURRENCY_REGEX.test(normalizedCurrency)) {
      throw new Error(`Moeda inválida: "${currency}". Informe um código ISO-4217 de 3 letras.`);
    }

    this.currency = normalizedCurrency;
  }

  static from(props: MoneyProps): Money {
    const minor = parseDecimalToMinorUnits(props.amount);
    return new Money(minor, props.currency);
  }

  static zero(currency: string): Money {
    return new Money(0n, currency);
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(`Moedas incompatíveis: ${this.currency} e ${other.currency}.`);
    }
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.minorUnits + other.minorUnits, this.currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.minorUnits - other.minorUnits, this.currency);
  }

  negate(): Money {
    return new Money(-this.minorUnits, this.currency);
  }

  isZero(): boolean {
    return this.minorUnits === 0n;
  }

  isPositive(): boolean {
    return this.minorUnits > 0n;
  }

  isNegative(): boolean {
    return this.minorUnits < 0n;
  }

  isLessThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.minorUnits < other.minorUnits;
  }

  equals(other: Money): boolean {
    return this.currency === other.currency && this.minorUnits === other.minorUnits;
  }

  toJSON(): MoneyProps {
    return {
      amount: formatMinorUnitsToAmount(this.minorUnits),
      currency: this.currency,
    };
  }

  toString(): string {
    return `${formatMinorUnitsToAmount(this.minorUnits)} ${this.currency}`;
  }
}
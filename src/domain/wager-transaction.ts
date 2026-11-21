import { Money } from './money';

export enum TransactionKind {
  Opening = 'OPENING',
  Bet = 'BET',
  Win = 'WIN',
  Loss = 'LOSS',
  Refund = 'REFUND',
  Rollback = 'ROLLBACK',
}

export enum TransactionStatus {
  Pending = 'PENDING',
  PendingReference = 'PENDING_REFERENCE',
  Processed = 'PROCESSED',
  Rejected = 'REJECTED',
  Failed = 'FAILED',
}

export enum FailureCode {
  InsufficientFunds = 'INSUFFICIENT_FUNDS',
  InvalidCurrency = 'INVALID_CURRENCY',
  ReferenceNotFound = 'REFERENCE_NOT_FOUND',
  ReferenceExpired = 'REFERENCE_EXPIRED',
  InvalidReferenceType = 'INVALID_REFERENCE_TYPE',
  InvalidReferenceScope = 'INVALID_REFERENCE_SCOPE',
  ReferenceAmountMismatch = 'REFERENCE_AMOUNT_MISMATCH',
  AlreadyReversed = 'ALREADY_REVERSED',
  ReversalWouldCauseNegativeBalance = 'REVERSAL_WOULD_CAUSE_NEGATIVE_BALANCE',
}

export interface CreateWagerTransactionProps {
  id: string;
  providerId: string;
  externalTransactionId: string;
  idempotencyKey: string;
  payloadHash: string;
  playerId: string;
  walletId: string;
  roundId: string;
  gameId: string;
  kind: TransactionKind;
  money: Money;
  referenceExternalTransactionId?: string | null;
  createdAt?: Date;
}

export interface WagerTransactionState {
  id: string;
  providerId: string;
  externalTransactionId: string;
  idempotencyKey: string;
  payloadHash: string;
  playerId: string;
  walletId: string;
  roundId: string;
  gameId: string;
  kind: TransactionKind;
  status: TransactionStatus;
  money: Money;
  referenceExternalTransactionId: string | null;
  failureCode: FailureCode | null;
  failureReason: string | null;
  balanceSnapshot: Money | null;
  retryCount: number;
  nextRetryAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class WagerTransaction {
  public readonly referenceExternalTransactionId: string | null;
  public readonly createdAt: Date;

  private _status: TransactionStatus;
  private _failureCode: FailureCode | null;
  private _failureReason: string | null;
  private _balanceSnapshot: Money | null;
  private _retryCount: number;
  private _nextRetryAt: Date | null;
  private _updatedAt: Date;

  private constructor(state: WagerTransactionState) {
    if (!state.id.trim()) {
      throw new Error('O id da transação é obrigatório.');
    }
    if (!state.providerId.trim()) {
      throw new Error('O providerId da transação é obrigatório.');
    }
    if (!state.externalTransactionId.trim()) {
      throw new Error('O externalTransactionId da transação é obrigatório.');
    }
    if (!state.idempotencyKey.trim()) {
      throw new Error('O idempotencyKey da transação é obrigatório.');
    }
    if (!state.payloadHash.trim()) {
      throw new Error('O payloadHash da transação é obrigatório.');
    }
    if (!state.playerId.trim()) {
      throw new Error('O playerId da transação é obrigatório.');
    }
    if (!state.walletId.trim()) {
      throw new Error('O walletId da transação é obrigatório.');
    }
    if (!state.roundId.trim()) {
      throw new Error('O roundId da transação é obrigatório.');
    }
    if (!state.gameId.trim()) {
      throw new Error('O gameId da transação é obrigatório.');
    }
    if (state.money.isNegative()) {
      throw new Error('O valor da transação não pode ser negativo.');
    }

    const requiresReference =
      state.kind === TransactionKind.Refund || state.kind === TransactionKind.Rollback;
    const refId = state.referenceExternalTransactionId?.trim() || null;

    if (requiresReference && !refId) {
      throw new Error(
        `A operação ${state.kind} exige referenceExternalTransactionId.`,
      );
    }

    this.id = state.id;
    this.providerId = state.providerId;
    this.externalTransactionId = state.externalTransactionId;
    this.idempotencyKey = state.idempotencyKey;
    this.payloadHash = state.payloadHash;
    this.playerId = state.playerId;
    this.walletId = state.walletId;
    this.roundId = state.roundId;
    this.gameId = state.gameId;
    this.kind = state.kind;
    this.money = state.money;
    this.referenceExternalTransactionId = refId;
    this._status = state.status;
    this._failureCode = state.failureCode;
    this._failureReason = state.failureReason;
    this._balanceSnapshot = state.balanceSnapshot;
    this._retryCount = state.retryCount;
    this._nextRetryAt = state.nextRetryAt;
    this.createdAt = state.createdAt;
    this._updatedAt = state.updatedAt;
  }

  public readonly id: string;
  public readonly providerId: string;
  public readonly externalTransactionId: string;
  public readonly idempotencyKey: string;
  public readonly payloadHash: string;
  public readonly playerId: string;
  public readonly walletId: string;
  public readonly roundId: string;
  public readonly gameId: string;
  public readonly kind: TransactionKind;
  public readonly money: Money;

  static create(props: CreateWagerTransactionProps): WagerTransaction {
    const now = props.createdAt ?? new Date();
    return new WagerTransaction({
      id: props.id,
      providerId: props.providerId,
      externalTransactionId: props.externalTransactionId,
      idempotencyKey: props.idempotencyKey,
      payloadHash: props.payloadHash,
      playerId: props.playerId,
      walletId: props.walletId,
      roundId: props.roundId,
      gameId: props.gameId,
      kind: props.kind,
      status: TransactionStatus.Pending,
      money: props.money,
      referenceExternalTransactionId: props.referenceExternalTransactionId ?? null,
      failureCode: null,
      failureReason: null,
      balanceSnapshot: null,
      retryCount: 0,
      nextRetryAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static rehydrate(state: WagerTransactionState): WagerTransaction {
    return new WagerTransaction(state);
  }

  get status(): TransactionStatus {
    return this._status;
  }

  get failureCode(): FailureCode | null {
    return this._failureCode;
  }

  get failureReason(): string | null {
    return this._failureReason;
  }

  get balanceSnapshot(): Money | null {
    return this._balanceSnapshot;
  }

  get retryCount(): number {
    return this._retryCount;
  }

  get nextRetryAt(): Date | null {
    return this._nextRetryAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  markPendingReference(nextRetryAt: Date, reason?: string, now: Date = new Date()): void {
    this._status = TransactionStatus.PendingReference;
    this._retryCount += 1;
    this._nextRetryAt = nextRetryAt;
    this._failureCode = FailureCode.ReferenceNotFound;
    this._failureReason = reason ?? 'Transação de referência ainda não encontrada.';
    this._updatedAt = now;
  }

  markProcessed(balanceAfter: Money, now: Date = new Date()): void {
    this._status = TransactionStatus.Processed;
    this._balanceSnapshot = balanceAfter;
    this._failureCode = null;
    this._failureReason = null;
    this._nextRetryAt = null;
    this._updatedAt = now;
  }

  markRejected(
    code: FailureCode,
    reason: string,
    balanceSnapshot: Money | null = null,
    now: Date = new Date(),
  ): void {
    this._status = TransactionStatus.Rejected;
    this._failureCode = code;
    this._failureReason = reason;
    this._balanceSnapshot = balanceSnapshot;
    this._nextRetryAt = null;
    this._updatedAt = now;
  }

  markFailed(code: FailureCode, reason: string, now: Date = new Date()): void {
    this._status = TransactionStatus.Failed;
    this._failureCode = code;
    this._failureReason = reason;
    this._nextRetryAt = null;
    this._updatedAt = now;
  }
}

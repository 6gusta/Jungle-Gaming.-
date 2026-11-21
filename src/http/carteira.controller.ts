import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
} from '@nestjs/common';
import { CriarCarteiraUseCase } from '../use-cases/criar-carteira.use-case';
import { ProcessarTransacaoApostaUseCase } from '../use-cases/processar-transacao-aposta.use-case';

class CriarCarteiraDto {
  idUsuario: string;
  saldoInicialCentavos?: string;
  moeda?: string;
}

class ProcessarApostaDto {
  idCarteira: string;
  chaveIdempotencia?: string;
  valorCentavos: string;
  moeda?: string;
}

@Controller()
export class CarteiraHttpController {
  constructor(
    private readonly criarCarteiraUseCase: CriarCarteiraUseCase,
    private readonly processarTransacaoApostaUseCase: ProcessarTransacaoApostaUseCase,
  ) {}

  @Post('carteiras')
  @HttpCode(HttpStatus.CREATED)
  async criarCarteira(@Body() body: CriarCarteiraDto) {
    try {
      return await this.criarCarteiraUseCase.executar({
        idUsuario: body.idUsuario,
        saldoInicialCentavos: body.saldoInicialCentavos ?? '0',
        moeda: body.moeda ?? 'BRL',
      });
    } catch (err: any) {
      throw this.mapearErroHttp(err);
    }
  }

  @Post('apostas')
  @HttpCode(HttpStatus.CREATED)
  async processarAposta(
    @Body() body: ProcessarApostaDto,
    @Headers('idempotency-key') idempotencyKeyHeader?: string,
  ) {
    const chaveIdempotencia =
      idempotencyKeyHeader?.trim() || body.chaveIdempotencia?.trim();

    if (!chaveIdempotencia) {
      throw new BadRequestException(
        'Informe a chave de idempotência no header Idempotency-Key ou no corpo da requisição.',
      );
    }

    try {
      return await this.processarTransacaoApostaUseCase.executar({
        idCarteira: body.idCarteira,
        chaveIdempotencia,
        valorCentavos: body.valorCentavos,
        moeda: body.moeda ?? 'BRL',
      });
    } catch (err: any) {
      throw this.mapearErroHttp(err);
    }
  }

  private mapearErroHttp(err: any) {
    const msg = String(err?.message ?? '');

    if (/não encontrad/i.test(msg)) {
      return new NotFoundException(msg);
    }
    if (/conflito de idempotência/i.test(msg)) {
      return new ConflictException(msg);
    }
    if (/saldo insuficiente|negativ|inválid|moeda|obrigatór/i.test(msg)) {
      return new BadRequestException(msg);
    }

    return err;
  }
}

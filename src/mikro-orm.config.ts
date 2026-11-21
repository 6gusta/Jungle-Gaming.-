import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from '@mikro-orm/postgresql';
import { Migrator } from '@mikro-orm/migrations';
import { HealthCheck } from './healthcheck.entity';
import { CarteiraEntity } from './entities/carteira.entity';
import { LancamentoCarteiraEntity } from './entities/lancamento-carteira.entity';
import { TransacaoApostaEntity } from './entities/transacao-aposta.entity';
import { MensagemInboxEntity } from './entities/mensagem-inbox.entity';
import { MensagemOutboxEntity } from './entities/mensagem-outbox.entity';

const envPath = resolve(process.cwd(), '.env');
if (!process.env.DATABASE_URL && existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

const rawUrl = process.env.DATABASE_URL ?? '';
const useSsl =
  process.env.DB_SSL === 'true' ||
  rawUrl.includes('sslmode=require') ||
  rawUrl.includes('neon.tech');

if (useSsl && !process.env.PGSSLMODE) {
  process.env.PGSSLMODE = 'require';
}

function buildClientUrl(urlStr: string): string {
  const parsed = new URL(urlStr);
  if (!parsed.searchParams.has('sslmode')) {
    parsed.searchParams.set('sslmode', 'require');
  }
  return parsed.toString();
}

export default defineConfig({
  ...(process.env.DATABASE_URL
    ? { clientUrl: buildClientUrl(process.env.DATABASE_URL) }
    : {
        host: process.env.DB_HOST ?? 'localhost',
        port: Number(process.env.DB_PORT ?? 5432),
        user: process.env.DB_USER ?? 'jungle',
        password: process.env.DB_PASSWORD ?? 'jungle_password',
        dbName: process.env.DB_NAME ?? 'jungle_gaming',
      }),
  ...(useSsl
    ? {
        driverOptions: {
          ssl: { rejectUnauthorized: false },
        } as Record<string, unknown>,
      }
    : {}),
  entities: [
    HealthCheck,
    CarteiraEntity,
    LancamentoCarteiraEntity,
    TransacaoApostaEntity,
    MensagemInboxEntity,
    MensagemOutboxEntity,
  ],
  extensions: [Migrator],
  migrations: {
    path: 'dist/migrations',
    pathTs: 'src/migrations',
    transactional: true,
    allOrNothing: true,
  },
});
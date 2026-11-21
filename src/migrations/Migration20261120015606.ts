import { Migration } from '@mikro-orm/migrations';

export class Migration20261120015606 extends Migration {

  override name = 'Migration20261120015606';

  override up(): void | Promise<void> {
    this.addSql(`create table "health_check" ("id" serial primary key, "created_at" timestamptz not null);`);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists "health_check" cascade;`);
  }

}

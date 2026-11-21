import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import mikroOrmConfig from './mikro-orm.config';
import { CarteiraModule } from './http/carteira.module';

@Module({
  imports: [
    MikroOrmModule.forRoot(mikroOrmConfig),
    CarteiraModule,
  ],
})
export class AppModule {}

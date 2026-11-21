import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity()
export class HealthCheck {
  @PrimaryKey({ type: 'number' })
  id!: number;

  @Property({ type: 'Date' })
  createdAt: Date = new Date();
}
require('dotenv').config()
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import config from 'config';

// PostGreSQL DB connection config
const postgresConfig = config.get<{
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}>('postgresConfig');

// PostGreSQL DB connection creation
export const AppDataSource = new DataSource({
  ...postgresConfig,
  type: 'postgres',
  synchronize: false,
  logging: false,
  entities: ['src/entities/**/*{.ts,.js}'],
  migrations: ['src/migrations/**/*{.ts,.js}'],
  subscribers: ['src/subscribers/**/*{.ts,.js}'],
});


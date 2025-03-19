import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { productionConfig } from './production.config';

const isProd = process.env.NODE_ENV === 'production';

const getConfigValue = (configService: ConfigService, key: string, defaultValue: any) => {
  const value = configService.get(key);
  return value !== undefined ? value : defaultValue;
};

const baseConfig = (configService: ConfigService) => ({
  type: 'postgres' as const,
  host: getConfigValue(configService, 'DB_HOST', 'localhost'),
  port: getConfigValue(configService, 'DB_PORT', 5432),
  username: getConfigValue(configService, 'DB_USERNAME', 'postgres'),
  password: getConfigValue(configService, 'DB_PASSWORD', ''),
  database: getConfigValue(configService, 'DB_DATABASE', 'spade'),
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  migrationsRun: true,
  synchronize: false,
});

export const getTypeOrmConfig = (configService: ConfigService): TypeOrmModuleOptions => {
  const config = {
    ...baseConfig(configService),
    ...(isProd ? productionConfig : {})
  };
  return config as TypeOrmModuleOptions;
};

export const getDataSourceConfig = (configService: ConfigService): DataSourceOptions => {
  const config = {
    ...baseConfig(configService),
    ...(isProd ? productionConfig : {})
  };
  return config as DataSourceOptions;
};

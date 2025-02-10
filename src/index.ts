export class PrismaQueryConfig {
  sensitiveFields: string[] = [];
  excludeKeys: string[] = [];
  requestFields: string[] = [];
  forbiddenKeys: string[] = [];

  constructor(config?: Partial<PrismaQueryConfig>) {
    Object.assign(this, config);
  }
}

export class PrismaQueryService {
  private static config: PrismaQueryConfig = new PrismaQueryConfig();

  static configure(config: Partial<PrismaQueryConfig>) {
    PrismaQueryService.config = new PrismaQueryConfig(config);
  }

  static getConfig() {
    return PrismaQueryService.config;
  }
}

export * from './decorators/prisma-query.decorator';
export * from './dtos/prisma-query.dto';
export * from './types/query.type';
export * from './utils/exception-filter';
export * from './utils/operators';
export * from './utils/paginate';
export * from './utils/parsers';
export * from './utils/swagger-properties';

export default PrismaQueryService;

export {
  PrismaQueryExceptionFilter,
  usePrismaQueryExceptionFilter,
} from './utils/exception-filter';

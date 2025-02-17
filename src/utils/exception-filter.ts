import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  Logger,
} from '@nestjs/common';

import PrismaQueryService from '../index';

@Catch()
export class PrismaQueryExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaQueryExceptionFilter.name);
  private readonly logErrors: boolean;

  constructor() {
    this.logErrors = PrismaQueryService.getConfig().logErrors;
  }
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    if (this.logErrors) {
      this.logger.error(exception);
    }

    const responseBody = {
      statusCode: exception.getStatus(),
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    return response.status(exception.getStatus()).json(responseBody);
  }
}

export const usePrismaQueryExceptionFilter = (app: any) => {
  app.useGlobalFilters(new PrismaQueryExceptionFilter());
};

export const createPrismaQueryExceptionFilter =
  (): PrismaQueryExceptionFilter => {
    return new PrismaQueryExceptionFilter();
  };

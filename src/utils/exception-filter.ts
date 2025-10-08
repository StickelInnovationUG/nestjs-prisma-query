import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

import { PrismaQueryService } from '../index';

interface IResponse {
  status(code: number): this;
  json(body: any): void;
}

@Catch()
export class PrismaQueryExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaQueryExceptionFilter.name);
  private readonly logErrors: boolean;

  constructor() {
    try {
      this.logErrors = PrismaQueryService.getConfig().logErrors;
    } catch {
      this.logErrors = false;
    }
  }

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<IResponse>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string | object;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getResponse();
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'An unexpected internal server error occurred';
    }

    if (this.logErrors) {
      this.logger.error(
        `Error caught by PrismaQueryExceptionFilter: Status ${status}`,
        exception.stack,
        exception,
      );
    }

    const responseBody = {
      statusCode: status,
      ...(typeof message === 'object' ? message : { message }),
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    return response.status(status).json(responseBody);
  }
}

export const usePrismaQueryExceptionFilter = (app: any) => {
  app.useGlobalFilters(new PrismaQueryExceptionFilter());
};

export const createPrismaQueryExceptionFilter =
  (): PrismaQueryExceptionFilter => {
    return new PrismaQueryExceptionFilter();
  };

import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';

import { PrismaQueryService } from '../index';
import type {
  NestedFieldTypeMap,
  ParsedPrismaQuery,
} from '../types/query.type';
import {
  parseFilterString,
  parseInclude,
  parseLogicalOperators,
  parseOrderBy,
} from '../utils/parsers';

export const PrismaQuery = <TDto extends object>(config: {
  fieldTypeMap: NestedFieldTypeMap;
  dto: new () => TDto;
  forbiddenKeys?: string[];
  sensitiveFields?: string[];
  excludeKeys?: string[];
}) => {
  return createParamDecorator(async (_, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const query = request.query as Record<string, string>;

    // Fetch global config
    const globalConfig = PrismaQueryService.getConfig();

    // Merge decorator config with global config
    const fieldTypeMap = config.fieldTypeMap;
    const dto = config.dto;
    const sensitiveFields = [
      ...(globalConfig.sensitiveFields || []),
      ...(config.sensitiveFields || []),
    ];
    const excludeKeys = [
      ...(globalConfig.excludeKeys || []),
      ...(config.excludeKeys || []),
    ];
    const forbiddenKeys = [
      ...(globalConfig.forbiddenKeys || []),
      ...(config.forbiddenKeys || []),
    ];

    // Check for forbidden keys
    const foundForbiddenKeys = forbiddenKeys.filter((key) => key in query);
    if (foundForbiddenKeys.length > 0) {
      throw new BadRequestException(
        `Forbidden keys found in query: ${foundForbiddenKeys.join(', ')}`,
      );
    }

    // Remove excluded keys
    excludeKeys.forEach((key) => {
      delete query[key];
    });

    // Validate DTO structure
    const dtoInstance = plainToInstance(dto, query);
    try {
      await validateOrReject(dtoInstance);
    } catch (error) {
      throw new BadRequestException('Invalid query parameters', error.message);
    }

    const prismaArgs: ParsedPrismaQuery = {};

    for (const key of Object.keys(query)) {
      if (key.startsWith('filter.')) {
        const field = key.replace('filter.', '');
        if (sensitiveFields.includes(field)) {
          throw new BadRequestException(
            `Filtering by sensitive field ${field} is not allowed.`,
          );
        }
        prismaArgs.where = {
          ...prismaArgs.where,
          ...parseFilterString(field, query[key], fieldTypeMap),
        };
      } else if (['$AND', '$OR', '$NOT'].includes(key)) {
        prismaArgs.where = prismaArgs.where || {};
        prismaArgs.where[key.slice(1)] = parseLogicalOperators(
          query[key],
          fieldTypeMap,
        );
      } else if (key === 'orderBy') {
        prismaArgs.orderBy = parseOrderBy(query[key]);
      } else if (['include', 'select'].includes(key)) {
        prismaArgs.include = parseInclude(query[key]);
      } else if (sensitiveFields.includes(key)) {
        throw new BadRequestException(
          `Access to sensitive field ${key} is not allowed.`,
        );
      } else {
        try {
          prismaArgs[key] = JSON.parse(query[key]);
        } catch {
          prismaArgs[key] = query[key];
        }
      }
    }

    // Add global request fields (e.g., userId, accountId) to `where` clause
    if (globalConfig.requestFields) {
      globalConfig.requestFields.forEach((field) => {
        if (request[field]) {
          prismaArgs.where = { ...prismaArgs.where, [field]: request[field] };
        }
      });
    }

    return prismaArgs;
  })();
};

export default PrismaQuery;

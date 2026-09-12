import { BadRequestException, Injectable } from '@nestjs/common';

import type { ParsedPrismaQuery } from './types/query.type';
import { paginate, PaginationResult } from './utils/paginate';

// A helper type for type assertion, not for use in method signatures
type FindManyArgs<T> = T extends { findMany: (args: infer U) => any }
  ? U
  : never;

@Injectable()
export class PrismaQueryExecutorService {
  /**
   * Executes a paginated `findMany` query.
   * The `model` parameter is typed as `any` to prevent a known Prisma/TypeScript
   * circular reference error during compile-time analysis.
   */
  findManyWithPagination<TResult>(
    model: any, // <-- This is the definitive fix for type checking
    query: ParsedPrismaQuery,
  ): Promise<PaginationResult<TResult>> {
    if (query.by || query._count || query._sum) {
      throw new BadRequestException(
        'Aggregation parameters (groupBy, compute) are not allowed for this endpoint.',
      );
    }
    const findManyArgs = query as FindManyArgs<any>;
    return paginate<any, TResult>(
      model,
      findManyArgs as { take?: number; skip?: number },
    );
  }

  /**
   * Performs a powerful aggregation query, intelligently choosing between `groupBy` and `aggregate`.
   * - If the `groupBy` parameter is provided, it performs a `groupBy` query.
   * - Otherwise, it performs an `aggregate` query on the entire dataset.
   * @param model The Prisma delegate for the model (e.g., prisma.video).
   * @param query The parsed query object from the @PrismaQuery decorator.
   */
  performAggregation(model: any, query: ParsedPrismaQuery) {
    // If 'by' exists, we delegate to our robust groupBy logic.
    if (query.by && Array.isArray(query.by) && query.by.length > 0) {
      return this.executeGroupBy(model, query);
    }
    // Otherwise, we perform a top-level aggregation.
    return this.executeAggregate(model, query);
  }

  private executeGroupBy(model: any, query: ParsedPrismaQuery) {
    if (!query.by || !Array.isArray(query.by) || query.by.length === 0) {
      throw new BadRequestException(
        "The 'groupBy' query parameter is required for this operation.",
      );
    }
    if (query.select || query.include) {
      throw new BadRequestException(
        'Parameters "select" and "include" cannot be used with "groupBy".',
      );
    }

    const { by, where, orderBy, skip, take, having } = query;
    const final_count = query._count ? { ...query._count } : undefined;
    const final_sum = query._sum ? { ...query._sum } : undefined;
    const final_avg = query._avg ? { ...query._avg } : undefined;
    const final_min = query._min ? { ...query._min } : undefined;
    const final_max = query._max ? { ...query._max } : undefined;
    const aggregations = {
      _count: final_count,
      _sum: final_sum,
      _avg: final_avg,
      _min: final_min,
      _max: final_max,
    };

    if (orderBy) {
      const orderByArray = Array.isArray(orderBy) ? orderBy : [orderBy];
      for (const orderItem of orderByArray) {
        const aggKey = Object.keys(orderItem)[0];
        if ((aggregations as any)[aggKey]) {
          const innerObject = (orderItem as any)[aggKey] as Record<string, any>;
          const fieldKey = Object.keys(innerObject)[0];
          if ((aggregations as any)[aggKey]._all) {
            delete (aggregations as any)[aggKey]._all;
          }
          (aggregations as any)[aggKey][fieldKey] = true;
        }
      }
    }

    return model.groupBy({
      by,
      where,
      orderBy,
      skip,
      take,
      having,
      ...(final_count && { _count: final_count }),
      ...(final_sum && { _sum: final_sum }),
      ...(final_avg && { _avg: final_avg }),
      ...(final_min && { _min: final_min }),
      ...(final_max && { _max: final_max }),
    } as any);
  }

  private executeAggregate(model: any, query: ParsedPrismaQuery) {
    const { where, _count, _sum, _avg, _min, _max } = query;

    // Validation for `aggregate`
    if (!_count && !_sum && !_avg && !_min && !_max) {
      throw new BadRequestException(
        "The 'compute' query parameter is required for an aggregation query.",
      );
    }
    if (query.orderBy || query.take || query.skip || query.having) {
      throw new BadRequestException(
        'Parameters "orderBy", "take", "skip", and "having" are not allowed for this type of aggregation query.',
      );
    }

    return model.aggregate({
      where,
      ...(_count && { _count }),
      ...(_sum && { _sum }),
      ...(_avg && { _avg }),
      ...(_min && { _min }),
      ...(_max && { _max }),
    } as any);
  }
}

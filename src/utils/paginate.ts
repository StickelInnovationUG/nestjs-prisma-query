import { BadRequestException } from '@nestjs/common';

type PaginationResult<T> = {
  data: T[];
  totalCount: number;
  currentPage: number;
  isFirstPage: boolean;
  isLastPage: boolean;
};

type ExtractFindManyArgs<ModelDelegate> = ModelDelegate extends {
  findMany(args: infer Args): any;
}
  ? Args
  : never;

type ExtractFindManyReturn<ModelDelegate> = ModelDelegate extends {
  findMany(args: any): Promise<Array<infer T>>;
}
  ? T
  : never;

export const paginate = async <
  ModelDelegate extends {
    findMany: (args: any) => Promise<any[]>;
    count: (args: any) => Promise<number>;
  },
  T = ExtractFindManyReturn<ModelDelegate>,
>(
  model: ModelDelegate,
  query: ExtractFindManyArgs<ModelDelegate> & { take?: number; skip?: number },
): Promise<PaginationResult<T>> => {
  const { take = 10, skip = 0, ...findArgs } = query;

  try {
    // Fetch paginated data
    const data: T[] = await model.findMany({
      ...findArgs,
      take,
      skip,
    });

    const totalCount: number = await model.count({
      where: findArgs.where,
    });

    const currentPage = Math.floor(skip / take) + 1;

    return {
      data,
      totalCount,
      currentPage,
      isFirstPage: skip === 0,
      isLastPage: skip + take >= totalCount,
    };
  } catch (error) {
    throw new BadRequestException(
      `Invalid query parameters', ${error.message}`,
    );
  }
};

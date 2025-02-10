import { ApiProperty } from '@nestjs/swagger';

export class PaginationResultDto<T> {
  @ApiProperty({ description: 'Paginated data', type: [Object] })
  data: T[];

  @ApiProperty({ description: 'Total number of items in the database' })
  totalCount: number;

  @ApiProperty({ description: 'The current page number' })
  currentPage: number;

  @ApiProperty({
    description: 'Indicates whether the current page is the first page',
  })
  isFirstPage: boolean;

  @ApiProperty({
    description: 'Indicates whether the current page is the last page',
  })
  isLastPage: boolean;
}

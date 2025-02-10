import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class PrismaQueryDto<T> {
  @ApiPropertyOptional({
    description: 'Comma-separated list of fields to select in the query.',
    examples: {
      empty: {
        summary: 'No fields selected',
        value: '',
      },
      selectedFields: {
        summary: 'Selected fields',
        value: 'videoCrn,createdAt',
      },
    },
  })
  @IsOptional()
  @IsString()
  select?: string;

  @ApiPropertyOptional({
    description: 'Comma-separated list of relations to include in the query.',
    examples: {
      empty: {
        summary: 'No relations included',
        value: '',
      },
      includedRelations: {
        summary: 'Included relations',
        value: 'progress,video',
      },
    },
  })
  @IsOptional()
  @IsString()
  include?: string;

  @ApiPropertyOptional({
    description:
      'Comma-separated list of fields and sort directions for ordering. Example: "createdAt:desc,test:asc".',
    examples: {
      empty: {
        summary: 'No order by',
        value: '',
      },
      orderBy: {
        summary: 'Order by',
        value: 'createdAt:desc',
      },
    },
  })
  @IsOptional()
  @IsString()
  orderBy?: string;

  @ApiPropertyOptional({
    description: 'Fields to apply distinct on. Removes duplicate records.',
    examples: {
      empty: {
        summary: 'No distinct on',
        value: '',
      },
      distinct: {
        summary: 'Distinct on',
        value: 'videoCrn,userId',
      },
    },
  })
  @IsOptional()
  @IsString()
  distinct?: string;

  @ApiPropertyOptional({
    description: 'Number of records to take (limit the result set)',
    example: 10,
  })
  @IsOptional()
  @IsInt()
  @Transform(({ value }) => parseInt(value, 0))
  take?: number;

  @ApiPropertyOptional({
    description: 'Number of records to skip (for pagination)',
    example: 0,
  })
  @IsOptional()
  @IsInt()
  @Transform(({ value }) => parseInt(value, 0))
  skip?: number;

  @ApiPropertyOptional({
    description:
      'Cursor-based pagination. Specify the starting point for fetching records.',
    examples: {
      empty: {
        summary: 'No cursor',
        value: '',
      },
      cursor: {
        summary: 'Cursor',
        value: '{"id": 10}',
      },
    },
  })
  @IsOptional()
  @IsString()
  cursor?: keyof T;
}

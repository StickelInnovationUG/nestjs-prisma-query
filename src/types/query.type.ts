export type FieldType = 'number' | 'string' | 'date' | NestedFieldTypeMap;

export type NestedFieldTypeMap = {
  [key: string]: FieldType | NestedFieldTypeMap;
};

export type PrismaOrderByValue = string | { [key: string]: PrismaOrderByValue };

// Helper type for aggregation fields like _sum, _avg, etc.
// Example: { progress: true, duration: true }
type PrismaAggregationField = Record<string, boolean>;

// Helper type specifically for _count, which can also accept `_all`.
// Example: { _all: true } or { videoCrn: true }
type PrismaCountAggregation = { _all?: boolean } & PrismaAggregationField;

/**
 * The main parsed query object. It includes properties for both standard
 * Prisma `find` operations and `groupBy` aggregation operations.
 */
export type ParsedPrismaQuery = {
  // Standard find properties
  select?: Record<string, any>;
  include?: Record<string, any>;
  where?: Record<string, any>;
  orderBy?: PrismaOrderByValue | PrismaOrderByValue[];
  distinct?: string[];
  take?: number;
  skip?: number;
  cursor?: Record<string, any>;
  // Aggregation properties ---

  /**
   * The fields to group by. Corresponds to Prisma's `by`.
   * @example ['videoCrn', 'userId']
   */
  by?: string[];

  /**
   * A `where` clause for filtering groups. Corresponds to Prisma's `having`.
   * Note: The parser for this is not implemented yet, but the type is here.
   */
  having?: Record<string, any>;

  /**
   * The fields to count.
   */
  _count?: PrismaCountAggregation;

  /**
   * The fields to sum.
   */
  _sum?: PrismaAggregationField;

  /**
   * The fields to average.
   */
  _avg?: PrismaAggregationField;

  /**
   * The fields to find the minimum of.
   */
  _min?: PrismaAggregationField;

  /**
   * The fields to find the maximum of.
   */
  _max?: PrismaAggregationField;
};

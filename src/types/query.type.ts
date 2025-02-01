export type FieldType = "number" | "string" | "date" | NestedFieldTypeMap;

export type NestedFieldTypeMap = {
  [key: string]: FieldType | NestedFieldTypeMap;
};

export type PrismaOrderByValue = string | { [key: string]: PrismaOrderByValue };

export type ParsedPrismaQuery = {
  select?: Record<string, any>;
  include?: Record<string, any>;
  where?: Record<string, any>;
  orderBy?: PrismaOrderByValue | PrismaOrderByValue[];
  distinct?: string[];
  take?: number;
  skip?: number;
  cursor?: Record<string, any>;
};

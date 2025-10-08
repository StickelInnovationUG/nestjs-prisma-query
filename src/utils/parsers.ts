import { BadRequestException } from '@nestjs/common';

import { NestedFieldTypeMap, PrismaOrderByValue } from '../types/query.type';
import { operatorMap } from '../utils/operators';

export const generateFieldTypeMap = <T>(
  model: new () => T,
): NestedFieldTypeMap => {
  const instance = new model();
  const fieldTypeMap: NestedFieldTypeMap = {};

  for (const key of Object.keys(instance)) {
    const value = instance[key];
    const fieldType = typeof value;

    if (fieldType === 'number') {
      fieldTypeMap[key] = 'number';
    } else if (fieldType === 'string') {
      fieldTypeMap[key] = 'string';
    } else if (fieldType === 'object' && value instanceof Date) {
      fieldTypeMap[key] = 'date';
    } else if (fieldType === 'object' && value !== null) {
      // Recursively generate field type map for nested objects
      fieldTypeMap[key] = generateFieldTypeMap(
        value.constructor as new () => any,
      );
    }
  }

  return fieldTypeMap;
};

export const parseOrderBy = (value: string): PrismaOrderByValue[] => {
  const orderBy: PrismaOrderByValue[] = [];
  const parts = value.split(',');

  parts.forEach((part) => {
    const [path, order] = part.trim().split(':');
    if (!path || !order) return;

    // Handle dot notation for nested sorting (e.g., _count.videoCrn)
    const fields = path.split('.');

    // Use reduceRight to build the nested object from the inside out
    const nestedOrderBy = fields.reduceRight(
      (acc, field) => ({ [field]: acc }),
      order.toLowerCase() as PrismaOrderByValue,
    );

    orderBy.push(nestedOrderBy);
  });

  return orderBy;
};

export const parseFields = (value: string): Record<string, boolean> => {
  return value.split(',').reduce((acc, field) => {
    const trimmedField = field.trim();
    if (trimmedField) {
      acc[trimmedField] = true;
    }
    return acc;
  }, {});
};

export const getFieldType = (
  field: string,
  fieldTypeMap: NestedFieldTypeMap,
) => {
  return field.split('.').reduce((currentMap, part) => {
    return typeof currentMap === 'object' && currentMap
      ? currentMap[part]
      : undefined;
  }, fieldTypeMap);
};

const parseNestedFieldString = (field: string, value: any) => {
  const fieldParts = field.split('.');

  if (fieldParts.length === 1) {
    return { [field]: value };
  }

  const [firstPart, ...remainingParts] = fieldParts;
  return {
    [firstPart]: parseNestedFieldString(remainingParts.join('.'), value),
  };
};

export const parseFilterString = (
  field: string,
  filterString: string,
  fieldTypeMap: NestedFieldTypeMap,
) => {
  let operator: string;
  let value: string;

  // 1. INTELLIGENTLY DETERMINE OPERATOR AND VALUE
  if (filterString.startsWith('$') && filterString.includes(':')) {
    // Case 1: An explicit operator is provided (e.g., "$gte:100")
    const [op, ...valueParts] = filterString.split(':');
    operator = op;
    value = valueParts.join(':');
  } else {
    // Case 2: No operator is provided (e.g., "true" or "some-string").
    // Default to '$eq' based on your operators.ts file.
    operator = '$eq';
    value = filterString;
  }

  const prismaOperator = operatorMap[operator];

  if (!prismaOperator) {
    throw new BadRequestException(`Unknown operator: ${operator}`);
  }

  const fieldType = getFieldType(field || '', fieldTypeMap);
  if (!fieldType) {
    // Let Prisma handle validation for deeper fields.
  }

  if (prismaOperator === 'in' || prismaOperator === 'notIn') {
    const values = value.split(',');
    return parseNestedFieldString(field, {
      [prismaOperator]: fieldType === 'number' ? values.map(Number) : values,
    });
  }

  let parsedValue: any;
  if (fieldType === 'number') {
    parsedValue = Number(value);
    if (isNaN(parsedValue)) {
      throw new BadRequestException(`Invalid number value for field: ${field}`);
    }
  } else if (fieldType === 'date') {
    parsedValue = new Date(value);
    if (isNaN(parsedValue.getTime())) {
      throw new BadRequestException(`Invalid date value for field: ${field}`);
    }
  } else if (value.toLowerCase() === 'true') {
    // Handle booleans explicitly
    parsedValue = true;
  } else if (value.toLowerCase() === 'false') {
    parsedValue = false;
  } else {
    // Default to string
    parsedValue = value;
  }

  return parseNestedFieldString(field, { [prismaOperator]: parsedValue });
};

export const parseLogicalOperators = (
  conditionsString: string,
  fieldTypeMap: NestedFieldTypeMap,
) => {
  // Split conditions by `|` to separate individual filters --> we can change here the separator if needed
  const conditionStrings = conditionsString.split('|');
  const parsedConditions = conditionStrings.map((condition) => {
    const [field, filterString] = condition.split('=');
    if (!field || !filterString) {
      throw new BadRequestException(
        `Invalid condition format: ${condition}. Expected format: field=$operator:value`,
      );
    }

    const fieldName = field.replace('filter.', '');
    return parseFilterString(fieldName, filterString, fieldTypeMap);
  });

  return parsedConditions;
};

/**
 * Parses the `compute` query parameter for aggregation operations.
 * Example: `_count,_sum:progress`
 * Becomes: { _count: { _all: true }, _sum: { progress: true } }
 */
const parseNested = (
  value: string,
  key: 'select' | 'include',
): Record<string, any> => {
  const result = {};
  if (!value) {
    return result;
  }
  const fields = value.split(',').map((f) => f.trim());

  for (const field of fields) {
    const parts = field.split('.');
    let current = result;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;

      if (isLast) {
        if (typeof current[part] !== 'object') {
          current[part] = true;
        }
      } else {
        if (typeof current[part] !== 'object' || current[part] === true) {
          current[part] = {};
        }
        if (!current[part][key]) {
          current[part][key] = {};
        }
        current = current[part][key];
      }
    }
  }
  return result;
};

export const parseSelect = (value: string): Record<string, any> => {
  return parseNested(value, 'select');
};

export const parseInclude = (value: string): Record<string, any> => {
  return parseNested(value, 'include');
};

export const parseComputations = (value: string): Record<string, any> => {
  const allowedAggregations = ['_count', '_sum', '_avg', '_min', '_max'];
  const computations = {};

  const parts = value.split(',');

  for (const part of parts) {
    const trimmedPart = part.trim();
    if (!trimmedPart) continue;

    const [func, field] = trimmedPart.split(':');

    if (!allowedAggregations.includes(func)) {
      continue;
    }

    // Handle the special case of `_count` which can be general
    if (func === '_count' && !field) {
      computations['_count'] = { _all: true };
      continue;
    }

    // Initialize the aggregation object if it doesn't exist
    if (!computations[func]) {
      computations[func] = {};
    }

    // Add the field to the aggregation
    computations[func][field] = true;
  }

  return computations;
};

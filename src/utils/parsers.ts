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

export const parseOrderBy = (
  orderString: string,
): PrismaOrderByValue | PrismaOrderByValue[] => {
  return orderString.split(',').map((sort) => {
    const [field, direction] = sort.split(':');
    return field.includes('.')
      ? field
          .split('.')
          .reverse()
          .reduce((acc, curr) => ({ [curr]: acc }), {} as Record<string, any>)
      : { [field]: direction };
  });
};

export const parseInclude = (
  includeString: string,
): Record<string, boolean> => {
  return includeString
    .split(',')
    .reduce(
      (acc, field) => ({ ...acc, [field.trim()]: true }),
      {} as Record<string, boolean>,
    );
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
  const [operator, ...valueParts] = filterString.split(':');
  const prismaOperator = operatorMap[operator];

  if (!prismaOperator) {
    throw new BadRequestException(`Unknown operator: ${operator}`);
  }

  const value = valueParts.join(':');
  const fieldType = getFieldType(field || '', fieldTypeMap);
  if (!fieldType) {
    throw new BadRequestException(`Unsupported field type for field: ${field}`);
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
  } else {
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

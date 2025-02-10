import { ApiPropertyOptional } from '@nestjs/swagger';

import { NestedFieldTypeMap } from '../types/query.type';
import { operatorExamples } from '../utils/operators';

export const applySwaggerProperties = (
  target: any,
  fieldTypeMap: NestedFieldTypeMap,
  parentKey = '',
) => {
  for (const [key, type] of Object.entries(fieldTypeMap)) {
    const fullKey = parentKey ? `${parentKey}.${key}` : key;

    if (typeof type === 'object' && type !== null) {
      // Recursively apply properties for nested fields (populated)
      applySwaggerProperties(target, type as NestedFieldTypeMap, fullKey);
    } else {
      const propertyType = getPropertyType(type);
      ApiPropertyOptional({
        description: `Filter by ${fullKey}`,
        type: propertyType,
        examples: operatorExamples,
      })(target.prototype, `filter.${fullKey}`);
    }
  }
};

export const getPropertyType = (type: any): any => {
  if (typeof type === 'object') {
    return () => type;
  }
  return type;
};

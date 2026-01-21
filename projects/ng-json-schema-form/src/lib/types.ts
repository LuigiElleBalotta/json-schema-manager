export type JsonSchemaType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'object'
  | 'array'
  | 'null';

export type JsonSchemaPrimitive = string | number | boolean | null;

export interface JsonSchemaBase {
  $schema?: string;
  $id?: string;
  $ref?: string;
  $anchor?: string;
  $dynamicRef?: string;
  $dynamicAnchor?: string;
  $comment?: string;
  title?: string;
  description?: string;
  type?: JsonSchemaType | JsonSchemaType[];
  enum?: JsonSchemaPrimitive[];
  const?: JsonSchemaPrimitive;
  default?: unknown;
  examples?: unknown[];
  format?: string;
  readOnly?: boolean;
  writeOnly?: boolean;
  deprecated?: boolean;
  nullable?: boolean;
  contentMediaType?: string;
  contentEncoding?: string;

  minLength?: number;
  maxLength?: number;
  pattern?: string;

  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;

  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  minContains?: number;
  maxContains?: number;

  required?: string[];
}

export interface JsonSchemaObject {
  properties?: Record<string, JsonSchema>;
  patternProperties?: Record<string, JsonSchema>;
  additionalProperties?: boolean | JsonSchema;
  unevaluatedProperties?: boolean | JsonSchema;
  propertyNames?: JsonSchema;
  dependencies?: Record<string, string[] | JsonSchema>;
  dependentRequired?: Record<string, string[]>;
  dependentSchemas?: Record<string, JsonSchema>;
  minProperties?: number;
  maxProperties?: number;
}

export interface JsonSchemaArray {
  items?: JsonSchema | boolean;
  prefixItems?: JsonSchema[];
  additionalItems?: JsonSchema | boolean;
  unevaluatedItems?: JsonSchema | boolean;
  contains?: JsonSchema;
}

export interface JsonSchemaCombinators extends JsonSchemaBase {
  allOf?: JsonSchema[];
  anyOf?: JsonSchema[];
  oneOf?: JsonSchema[];
  not?: JsonSchema;
  if?: JsonSchema;
  then?: JsonSchema;
  else?: JsonSchema;
}

export interface JsonSchema extends JsonSchemaBase, JsonSchemaObject, JsonSchemaArray, JsonSchemaCombinators {
  $defs?: Record<string, JsonSchema>;
  definitions?: Record<string, JsonSchema>;
}

export interface SchemaFieldContext {
  schema: JsonSchema;
  path: string;
  required: boolean;
}

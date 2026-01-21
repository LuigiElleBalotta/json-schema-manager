export type JsonSchemaType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'object'
  | 'array'
  | 'null';

export interface JsonSchemaBase {
  $id?: string;
  $ref?: string;
  title?: string;
  description?: string;
  type?: JsonSchemaType | JsonSchemaType[];
  enum?: Array<string | number | boolean | null>;
  const?: string | number | boolean | null;
  default?: unknown;
  format?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  pattern?: string;
  minItems?: number;
  maxItems?: number;
  required?: string[];
}

export interface JsonSchemaObject extends JsonSchemaBase {
  type?: 'object' | JsonSchemaType[];
  properties?: Record<string, JsonSchema>;
  additionalProperties?: boolean | JsonSchema;
}

export interface JsonSchemaArray extends JsonSchemaBase {
  type?: 'array' | JsonSchemaType[];
  items?: JsonSchema;
}

export type JsonSchema = JsonSchemaBase & JsonSchemaObject & JsonSchemaArray;

export interface SchemaFieldContext {
  schema: JsonSchema;
  path: string;
  required: boolean;
}

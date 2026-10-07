import { JsonSchema } from './types';

const OMIT = Symbol('omit');

/** Complete decimal numbers only: "13", "-0.5", "0,5", "3," (comma or dot as separator). */
const NUMERIC_STRING = /^[+-]?(\d+([.,]\d*)?|[.,]\d+)$/;

type SchemaLike = JsonSchema | boolean | undefined;

const isSchema = (schema: SchemaLike): schema is JsonSchema => !!schema && typeof schema === 'object';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const primaryType = (schema: JsonSchema): string | undefined => {
  const type = schema.type;
  if (Array.isArray(type)) {
    return type.find((item) => item !== 'null') ?? type[0];
  }
  return type;
};

const isNumericType = (type: string | undefined): boolean => type === 'number' || type === 'integer';

/** Converts a numeric string to a number; empty values are omitted; anything else is left as typed. */
function normalizeNumber(value: unknown): unknown {
  if (value === null || value === undefined) {
    return OMIT;
  }
  if (typeof value !== 'string') {
    return value;
  }
  const text = value.trim();
  if (text === '') {
    return OMIT;
  }
  if (NUMERIC_STRING.test(text)) {
    return Number(text.replace(',', '.'));
  }
  return value;
}

/** Picks the oneOf/anyOf variant that declares the most of the object's keys. */
function pickVariant(variants: JsonSchema[], value: Record<string, unknown>): JsonSchema | undefined {
  let best: JsonSchema | undefined;
  let bestScore = 0;
  for (const variant of variants) {
    const declared = Object.keys(variant.properties ?? {});
    const score = declared.filter((key) => key in value).length;
    if (score > bestScore) {
      best = variant;
      bestScore = score;
    }
  }
  return best;
}

function normalizeObject(schema: JsonSchema, value: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...value };
  const patterns = Object.entries(schema.patternProperties ?? {}).map(
    ([pattern, sub]) => [new RegExp(pattern), sub] as const
  );

  for (const key of Object.keys(result)) {
    let sub: SchemaLike = schema.properties?.[key];
    if (sub === undefined) {
      sub = patterns.find(([regex]) => regex.test(key))?.[1];
    }
    if (sub === undefined && isSchema(schema.additionalProperties as SchemaLike)) {
      sub = schema.additionalProperties as JsonSchema;
    }
    if (sub === undefined) {
      continue;
    }
    const next = normalizeNode(sub, result[key]);
    if (next === OMIT) {
      delete result[key];
    } else {
      result[key] = next;
    }
  }
  return result;
}

function normalizeArray(schema: JsonSchema, value: Array<unknown>): Array<unknown> {
  const prefixItems = schema.prefixItems ?? [];
  return value.map((item, index) => {
    const sub = (prefixItems[index] ?? schema.items) as SchemaLike;
    const next = normalizeNode(sub, item);
    // Array positions cannot be dropped without shifting the others.
    return next === OMIT ? null : next;
  });
}

function normalizeNode(schema: SchemaLike, value: unknown): unknown {
  if (!isSchema(schema)) {
    return value;
  }

  const type = primaryType(schema);
  if (isNumericType(type)) {
    return normalizeNumber(value);
  }

  let result: unknown = value;

  for (const sub of schema.allOf ?? []) {
    if (result === OMIT) {
      return OMIT;
    }
    result = normalizeNode(sub, result);
  }
  if (result === OMIT) {
    return OMIT;
  }

  const variants = [...(schema.oneOf ?? []), ...(schema.anyOf ?? [])];
  if (variants.length > 0 && type === undefined) {
    if (isRecord(result)) {
      const variant = pickVariant(variants, result);
      if (variant) {
        result = normalizeNode(variant, result);
      }
    } else if (!Array.isArray(result)) {
      // Primitive: convert only when the variants are numeric and none accepts a string.
      const types = variants.map((variant) => primaryType(variant));
      if (types.some(isNumericType) && !types.includes('string')) {
        result = normalizeNumber(result);
      }
    }
  }

  if (isRecord(result)) {
    return normalizeObject(schema, result);
  }
  if (Array.isArray(result)) {
    return normalizeArray(schema, result);
  }
  return result;
}

/**
 * Coerces values to the types declared by the schema so that the emitted value respects it:
 * - `number`/`integer` numeric strings become JSON numbers (comma or dot as separator);
 * - empty numeric values (`""`, whitespace, `null`) leave the key absent, never `""` or `0`;
 * - integers with decimals are converted to their number but never truncated (validation reports them);
 * - non-numeric strings are left unchanged (validation reports them).
 * Descends into properties, patternProperties, additionalProperties, items, prefixItems and combinators.
 * The same function feeds both the Ajv validation and the emitted value.
 */
export function normalizeValue(schema: JsonSchema, value: unknown): unknown {
  const normalized = normalizeNode(schema, value);
  return normalized === OMIT ? null : normalized;
}

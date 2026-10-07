import { normalizeValue } from './normalize-value';
import { JsonSchema } from './types';

describe('normalizeValue', () => {
  const numberSchema: JsonSchema = { type: 'object', properties: { n: { type: 'number' } } };

  it('converts a numeric string to a number', () => {
    expect(normalizeValue(numberSchema, { n: '13' })).toEqual({ n: 13 });
  });

  it('accepts comma and dot as decimal separator', () => {
    expect(normalizeValue(numberSchema, { n: '0,5' })).toEqual({ n: 0.5 });
    expect(normalizeValue(numberSchema, { n: '0.5' })).toEqual({ n: 0.5 });
  });

  it('keeps numbers untouched', () => {
    expect(normalizeValue(numberSchema, { n: 46.0707 })).toEqual({ n: 46.0707 });
  });

  it('keeps a trailing separator while typing as the number typed so far', () => {
    expect(normalizeValue(numberSchema, { n: '3,' })).toEqual({ n: 3 });
  });

  it('converts inside nested objects and arrays of objects', () => {
    const schema: JsonSchema = {
      type: 'object',
      properties: {
        center: { type: 'object', properties: { lat: { type: 'number' } } },
        points: { type: 'array', items: { type: 'object', properties: { x: { type: 'integer' } } } },
      },
    };
    expect(normalizeValue(schema, { center: { lat: '46.0707' }, points: [{ x: '1' }, { x: '2' }] })).toEqual({
      center: { lat: 46.0707 },
      points: [{ x: 1 }, { x: 2 }],
    });
  });

  it('converts array items and prefixItems', () => {
    const schema: JsonSchema = { type: 'array', prefixItems: [{ type: 'number' }], items: { type: 'integer' } };
    expect(normalizeValue(schema, ['1,5', '2', '3'])).toEqual([1.5, 2, 3]);
  });

  it('converts values under additionalProperties', () => {
    const schema: JsonSchema = { type: 'object', additionalProperties: { type: 'number' } };
    expect(normalizeValue(schema, { a: '1', b: '2,5' })).toEqual({ a: 1, b: 2.5 });
  });

  it('converts values under patternProperties', () => {
    const schema: JsonSchema = { type: 'object', patternProperties: { '^n_': { type: 'number' } } };
    expect(normalizeValue(schema, { n_a: '1', other: '2' })).toEqual({ n_a: 1, other: '2' });
  });

  it('converts through allOf', () => {
    const schema: JsonSchema = { allOf: [{ type: 'object', properties: { a: { type: 'number' } } }, { properties: { b: { type: 'integer' } } }] };
    expect(normalizeValue(schema, { a: '1', b: '2' })).toEqual({ a: 1, b: 2 });
  });

  it('converts through oneOf/anyOf using the variant that declares the keys', () => {
    const schema: JsonSchema = {
      oneOf: [
        { properties: { a: { type: 'number' } } },
        { properties: { b: { type: 'string' } } },
      ],
    };
    expect(normalizeValue(schema, { a: '1' })).toEqual({ a: 1 });
    expect(normalizeValue(schema, { b: '1' })).toEqual({ b: '1' });
  });

  it('leaves string fields untouched', () => {
    const schema: JsonSchema = { type: 'object', properties: { s: { type: 'string' } } };
    expect(normalizeValue(schema, { s: '13' })).toEqual({ s: '13' });
  });

  it('omits the key when a numeric field is empty, null or blank', () => {
    expect(normalizeValue(numberSchema, { n: '' })).toEqual({});
    expect(normalizeValue(numberSchema, { n: '  ' })).toEqual({});
    expect(normalizeValue(numberSchema, { n: null })).toEqual({});
  });

  it('omits the key for an empty ["number","null"] field', () => {
    const schema: JsonSchema = { type: 'object', properties: { n: { type: ['number', 'null'] } } };
    expect(normalizeValue(schema, { n: '' })).toEqual({});
  });

  it('keeps other falsy values and never turns empty into zero', () => {
    expect(normalizeValue(numberSchema, { n: 0 })).toEqual({ n: 0 });
    expect(normalizeValue(numberSchema, { n: '0' })).toEqual({ n: 0 });
    expect((normalizeValue(numberSchema, { n: '' }) as Record<string, unknown>)['n']).toBeUndefined();
  });

  it('puts null in an array position when the number is empty', () => {
    const schema: JsonSchema = { type: 'array', items: { type: 'number' } };
    expect(normalizeValue(schema, ['1', ''])).toEqual([1, null]);
  });

  it('does not truncate an integer with decimals', () => {
    const schema: JsonSchema = { type: 'object', properties: { i: { type: 'integer' } } };
    expect(normalizeValue(schema, { i: '3,5' })).toEqual({ i: 3.5 });
  });

  it('leaves non numeric strings unchanged', () => {
    expect(normalizeValue(numberSchema, { n: 'abc' })).toEqual({ n: 'abc' });
    expect(normalizeValue(numberSchema, { n: '1e3' })).toEqual({ n: '1e3' });
  });

  it('does not mutate the input value', () => {
    const value = { n: '13' };
    normalizeValue(numberSchema, value);
    expect(value).toEqual({ n: '13' });
  });

  it('handles null and undefined roots', () => {
    expect(normalizeValue(numberSchema, null)).toBeNull();
    expect(normalizeValue(numberSchema, undefined)).toBeUndefined();
  });
});

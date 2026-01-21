import { TestBed } from '@angular/core/testing';
import { FormArray, FormGroup } from '@angular/forms';
import { JsonSchemaFormService } from './json-schema-form.service';
import { JsonSchema } from './types';

describe('JsonSchemaFormService', () => {
  let service: JsonSchemaFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JsonSchemaFormService);
  });

  it('builds nested form groups for object schemas', () => {
    const schema: JsonSchema = {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', minLength: 2 },
        age: { type: 'integer', minimum: 1 },
      },
    };

    const control = service.buildControl(schema, { name: 'Ana', age: 30 });
    expect(control instanceof FormGroup).toBeTrue();
    const group = control as FormGroup;
    expect(group.get('name')).toBeTruthy();
    expect(group.get('age')).toBeTruthy();
  });

  it('builds arrays with prefix items and minItems', () => {
    const schema: JsonSchema = {
      type: 'array',
      minItems: 2,
      prefixItems: [{ type: 'string' }, { type: 'integer' }],
      items: { type: 'string' },
    };

    const control = service.buildControl(schema, ['a']);
    expect(control instanceof FormArray).toBeTrue();
    const array = control as FormArray;
    expect(array.length).toBe(2);
  });

  it('adds controls for dynamic properties from the value', () => {
    const schema: JsonSchema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
      additionalProperties: { type: 'string' },
    };

    const control = service.buildControl(schema, { name: 'A', extra: 'value' }) as FormGroup;
    expect(control.contains('extra')).toBeTrue();
  });
});

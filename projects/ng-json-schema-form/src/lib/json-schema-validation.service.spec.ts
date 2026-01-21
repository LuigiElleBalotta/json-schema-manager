import { TestBed } from '@angular/core/testing';
import { JsonSchemaValidationService } from './json-schema-validation.service';
import { JsonSchema } from './types';

describe('JsonSchemaValidationService', () => {
  let service: JsonSchemaValidationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JsonSchemaValidationService);
  });

  it('detects draft-04 schemas', () => {
    const schema: JsonSchema = { $schema: 'http://json-schema.org/draft-04/schema#', type: 'string' };
    expect(service.detectDraft(schema)).toBe('draft4');
  });

  it('validates basic schema constraints', () => {
    const schema: JsonSchema = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', minLength: 2 },
      },
    };

    const errors = service.validate(schema, { name: 'A' });
    expect(errors.length).toBeGreaterThan(0);
  });
});

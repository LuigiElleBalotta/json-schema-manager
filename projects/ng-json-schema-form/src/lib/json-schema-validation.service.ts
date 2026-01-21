import { Injectable } from '@angular/core';
import Ajv, { ErrorObject } from 'ajv';
import Ajv2019 from 'ajv/dist/2019';
import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import AjvDraft04 from 'ajv-draft-04';
import { JsonSchema } from './types';

export type JsonSchemaDraft = 'draft4' | 'draft6' | 'draft7' | 'draft2019' | 'draft2020';

@Injectable({
  providedIn: 'root',
})
export class JsonSchemaValidationService {
  private readonly ajvCache = new Map<JsonSchemaDraft, Ajv>();

  validate(schema: JsonSchema, value: unknown): ErrorObject[] {
    const draft = this.detectDraft(schema);
    const ajv = this.getAjv(draft);
    const validate = ajv.compile(schema as object);
    const valid = validate(value);
    if (valid) {
      return [];
    }
    return validate.errors ?? [];
  }

  detectDraft(schema: JsonSchema): JsonSchemaDraft {
    const schemaId = schema.$schema ?? '';
    if (schemaId.includes('draft-04')) {
      return 'draft4';
    }
    if (schemaId.includes('draft-06')) {
      return 'draft6';
    }
    if (schemaId.includes('draft-07')) {
      return 'draft7';
    }
    if (schemaId.includes('2019-09')) {
      return 'draft2019';
    }
    if (schemaId.includes('2020-12')) {
      return 'draft2020';
    }

    if (schema.$defs) {
      return 'draft2020';
    }
    if (schema.definitions) {
      return 'draft7';
    }

    return 'draft2020';
  }

  private getAjv(draft: JsonSchemaDraft): Ajv {
    if (this.ajvCache.has(draft)) {
      return this.ajvCache.get(draft)!;
    }

    let ajv: Ajv;
    switch (draft) {
      case 'draft4':
        ajv = new AjvDraft04({
          strict: false,
          allErrors: true,
          allowUnionTypes: true,
        });
        break;
      case 'draft2019':
        ajv = new Ajv2019({
          strict: false,
          allErrors: true,
          allowUnionTypes: true,
        });
        break;
      case 'draft6':
      case 'draft7':
        ajv = new Ajv({
          strict: false,
          allErrors: true,
          allowUnionTypes: true,
          schemaId: 'auto',
        });
        break;
      case 'draft2020':
      default:
        ajv = new Ajv2020({
          strict: false,
          allErrors: true,
          allowUnionTypes: true,
        });
    }

    addFormats(ajv);
    this.ajvCache.set(draft, ajv);
    return ajv;
  }
}

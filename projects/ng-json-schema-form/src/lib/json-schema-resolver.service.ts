import { Injectable } from '@angular/core';
import $RefParser from '@apidevtools/json-schema-ref-parser';
import { JsonSchema } from './types';

@Injectable({
  providedIn: 'root',
})
export class JsonSchemaResolverService {
  async resolve(schema: JsonSchema): Promise<JsonSchema> {
    try {
      const resolved = await $RefParser.dereference(schema as object, {
        dereference: {
          circular: 'ignore',
        },
      });
      return resolved as JsonSchema;
    } catch {
      return schema;
    }
  }
}

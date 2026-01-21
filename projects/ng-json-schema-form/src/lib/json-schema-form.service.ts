import { Injectable } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { JsonSchema } from './types';

@Injectable({
  providedIn: 'root',
})
export class JsonSchemaFormService {
  buildControl(schema: JsonSchema, value?: unknown, required = false): AbstractControl {
    const effectiveSchema = this.applyCombinators(schema);
    const resolvedType = this.resolveType(effectiveSchema);

    if (resolvedType === 'object') {
      const group: Record<string, AbstractControl> = {};
      const properties = effectiveSchema.properties ?? {};
      const requiredFields = new Set(effectiveSchema.required ?? []);
      const valueObject = this.isRecord(value) ? value : {};

      for (const [key, propertySchema] of Object.entries(properties)) {
        const childValue = valueObject[key];
        group[key] = this.buildControl(propertySchema, childValue, requiredFields.has(key));
      }

      // Include dynamic keys from value (patternProperties/additionalProperties).
      for (const key of Object.keys(valueObject)) {
        if (group[key]) {
          continue;
        }
        const dynamicSchema = this.resolveDynamicSchema(effectiveSchema, key);
        group[key] = this.buildControl(dynamicSchema ?? {}, valueObject[key], false);
      }

      const control = new FormGroup(group, {
        validators: this.buildValidators(effectiveSchema, required),
      });
      if (effectiveSchema.readOnly) {
        control.disable({ emitEvent: false });
      }
      return control;
    }

    if (resolvedType === 'array') {
      const controls: AbstractControl[] = [];
      const initialItems = Array.isArray(value) ? value : [];
      const minItems = effectiveSchema.minItems ?? 0;
      const prefixItems = effectiveSchema.prefixItems ?? [];
      const tupleLength = Math.max(prefixItems.length, minItems, initialItems.length);

      for (let i = 0; i < tupleLength; i += 1) {
        const itemSchema = (prefixItems[i] ?? effectiveSchema.items) as JsonSchema | boolean | undefined;
        if (itemSchema === false) {
          continue;
        }
        const itemValue = initialItems[i];
        controls.push(this.buildControl((itemSchema as JsonSchema) ?? {}, itemValue, false));
      }

      const control = new FormArray(controls, {
        validators: this.buildValidators(effectiveSchema, required),
      });
      if (effectiveSchema.readOnly) {
        control.disable({ emitEvent: false });
      }
      return control;
    }

    const initialValue = this.resolveInitialValue(effectiveSchema, value);
    const control = new FormControl(initialValue, {
      validators: this.buildValidators(effectiveSchema, required, resolvedType),
      nonNullable: false,
    });

    if (effectiveSchema.readOnly || effectiveSchema.const !== undefined) {
      control.disable({ emitEvent: false });
    }

    return control;
  }

  resolveType(schema: JsonSchema): JsonSchema['type'] | 'enum' {
    if (schema.enum) {
      return 'enum';
    }

    if (schema.oneOf?.length) {
      return this.resolveType(schema.oneOf[0]);
    }
    if (schema.anyOf?.length) {
      return this.resolveType(schema.anyOf[0]);
    }
    if (schema.allOf?.length) {
      return this.resolveType(schema.allOf[0]);
    }

    if (schema.type) {
      if (Array.isArray(schema.type)) {
        const preferred = schema.type.find((item) => item !== 'null');
        return preferred ?? schema.type[0];
      }

      return schema.type;
    }

    if (schema.properties || schema.patternProperties || schema.additionalProperties) {
      return 'object';
    }

    if (schema.items || schema.prefixItems) {
      return 'array';
    }

    return 'string';
  }

  private applyCombinators(schema: JsonSchema): JsonSchema {
    let effective = schema;
    if (schema.allOf?.length) {
      effective = this.mergeSchemas([schema, ...schema.allOf]);
    }
    if (schema.oneOf?.length) {
      effective = schema.oneOf[0];
    }
    if (schema.anyOf?.length) {
      effective = schema.anyOf[0];
    }
    return effective;
  }

  resolveDynamicSchema(schema: JsonSchema, key: string): JsonSchema | undefined {
    const patternSchemas = schema.patternProperties ?? {};
    for (const [pattern, patternSchema] of Object.entries(patternSchemas)) {
      try {
        const regex = new RegExp(pattern);
        if (regex.test(key)) {
          return patternSchema;
        }
      } catch {
        // ignore invalid regex
      }
    }

    if (schema.additionalProperties === true || schema.additionalProperties === undefined) {
      return {};
    }

    if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
      return schema.additionalProperties;
    }

    if (schema.unevaluatedProperties && typeof schema.unevaluatedProperties === 'object') {
      return schema.unevaluatedProperties;
    }
    if (schema.unevaluatedProperties === true) {
      return {};
    }

    return undefined;
  }

  private resolveInitialValue(schema: JsonSchema, value?: unknown): unknown {
    if (value !== undefined) {
      return value;
    }

    if (schema.const !== undefined) {
      return schema.const;
    }

    if (schema.default !== undefined) {
      return schema.default;
    }

    if (schema.enum && schema.enum.length > 0) {
      return schema.enum[0];
    }

    if (schema.type === 'boolean') {
      return false;
    }

    if (schema.type === 'array') {
      return [];
    }

    if (schema.type === 'object') {
      return {};
    }

    return null;
  }

  private buildValidators(
    schema: JsonSchema,
    required: boolean,
    resolvedType?: JsonSchema['type'] | 'enum'
  ): ValidatorFn[] {
    const validators: ValidatorFn[] = [];

    if (required) {
      validators.push(Validators.required);
    }

    if (schema.minLength !== undefined) {
      validators.push(Validators.minLength(schema.minLength));
    }

    if (schema.maxLength !== undefined) {
      validators.push(Validators.maxLength(schema.maxLength));
    }

    if (schema.minimum !== undefined) {
      validators.push(Validators.min(schema.minimum));
    }

    if (schema.maximum !== undefined) {
      validators.push(Validators.max(schema.maximum));
    }

    if (schema.exclusiveMinimum !== undefined) {
      validators.push((control) =>
        control.value === null || control.value === undefined || control.value === ''
          ? null
          : Number(control.value) > schema.exclusiveMinimum!
            ? null
            : { exclusiveMinimum: true }
      );
    }

    if (schema.exclusiveMaximum !== undefined) {
      validators.push((control) =>
        control.value === null || control.value === undefined || control.value === ''
          ? null
          : Number(control.value) < schema.exclusiveMaximum!
            ? null
            : { exclusiveMaximum: true }
      );
    }

    if (schema.multipleOf !== undefined) {
      validators.push((control) => {
        if (control.value === null || control.value === undefined || control.value === '') {
          return null;
        }
        const numericValue = Number(control.value);
        return numericValue % schema.multipleOf! === 0 ? null : { multipleOf: true };
      });
    }

    if (schema.pattern) {
      validators.push(Validators.pattern(schema.pattern));
    }

    if (schema.format === 'email') {
      validators.push(Validators.email);
    }

    if (schema.minItems !== undefined) {
      validators.push((control) =>
        Array.isArray(control.value) && control.value.length < schema.minItems!
          ? { minItems: true }
          : null
      );
    }

    if (schema.maxItems !== undefined) {
      validators.push((control) =>
        Array.isArray(control.value) && control.value.length > schema.maxItems!
          ? { maxItems: true }
          : null
      );
    }

    if (schema.uniqueItems) {
      validators.push((control) => {
        if (!Array.isArray(control.value)) {
          return null;
        }
        const unique = new Set(control.value.map((item) => JSON.stringify(item)));
        return unique.size === control.value.length ? null : { uniqueItems: true };
      });
    }

    if (schema.minProperties !== undefined) {
      validators.push((control) => {
        if (!control.value || typeof control.value !== 'object') {
          return null;
        }
        return Object.keys(control.value).length < schema.minProperties!
          ? { minProperties: true }
          : null;
      });
    }

    if (schema.maxProperties !== undefined) {
      validators.push((control) => {
        if (!control.value || typeof control.value !== 'object') {
          return null;
        }
        return Object.keys(control.value).length > schema.maxProperties!
          ? { maxProperties: true }
          : null;
      });
    }

    if (resolvedType === 'integer') {
      validators.push((control) => {
        if (control.value === null || control.value === undefined || control.value === '') {
          return null;
        }

        const numericValue = Number(control.value);
        return Number.isInteger(numericValue) ? null : { integer: true };
      });
    }

    return validators;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  private mergeSchemas(schemas: JsonSchema[]): JsonSchema {
    return schemas.reduce((acc, schema) => {
      const merged: JsonSchema = {
        ...acc,
        ...schema,
        properties: { ...(acc.properties ?? {}), ...(schema.properties ?? {}) },
        patternProperties: { ...(acc.patternProperties ?? {}), ...(schema.patternProperties ?? {}) },
        required: Array.from(new Set([...(acc.required ?? []), ...(schema.required ?? [])])),
      };
      return merged;
    }, {} as JsonSchema);
  }
}

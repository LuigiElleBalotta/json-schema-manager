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
    const resolvedType = this.resolveType(schema);

    if (resolvedType === 'object') {
      const group: Record<string, AbstractControl> = {};
      const properties = schema.properties ?? {};
      const requiredFields = new Set(schema.required ?? []);

      for (const [key, propertySchema] of Object.entries(properties)) {
        const childValue = this.getValueAtPath(value, key);
        group[key] = this.buildControl(propertySchema, childValue, requiredFields.has(key));
      }

      return new FormGroup(group, {
        validators: this.buildValidators(schema, required),
      });
    }

    if (resolvedType === 'array') {
      const itemsSchema = schema.items ?? {};
      const initialItems = Array.isArray(value) ? value : [];
      const minItems = schema.minItems ?? 0;
      const length = Math.max(initialItems.length, minItems);
      const controls: AbstractControl[] = [];

      for (let i = 0; i < length; i += 1) {
        const itemValue = initialItems[i];
        controls.push(this.buildControl(itemsSchema, itemValue, false));
      }

      return new FormArray(controls, {
        validators: this.buildValidators(schema, required),
      });
    }

    const initialValue = this.resolveInitialValue(schema, value);
    return new FormControl(initialValue, {
      validators: this.buildValidators(schema, required, resolvedType),
      nonNullable: false,
    });
  }

  resolveType(schema: JsonSchema): JsonSchema['type'] | 'enum' {
    if (schema.enum) {
      return 'enum';
    }

    if (schema.type) {
      if (Array.isArray(schema.type)) {
        const preferred = schema.type.find((item) => item !== 'null');
        return preferred ?? schema.type[0];
      }

      return schema.type;
    }

    if (schema.properties) {
      return 'object';
    }

    if (schema.items) {
      return 'array';
    }

    return 'string';
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

  private getValueAtPath(value: unknown, key: string): unknown {
    if (!value || typeof value !== 'object') {
      return undefined;
    }

    return (value as Record<string, unknown>)[key];
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

    if (schema.pattern) {
      validators.push(Validators.pattern(schema.pattern));
    }

    if (schema.format === 'email') {
      validators.push(Validators.email);
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
}

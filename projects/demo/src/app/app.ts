import { Component } from '@angular/core';
import { FormGroup, FormsModule } from '@angular/forms';
import { JsonSchema, JsonSchemaFormComponent } from '@json-schema-manager/ng-json-schema-form';
import { DEMO_SCHEMAS, DemoSchema } from './demo-schemas';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, JsonSchemaFormComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  demoSchemas = DEMO_SCHEMAS;
  selectedId = this.demoSchemas[0].id;
  useCustom = false;

  schemaInput = JSON.stringify(this.demoSchemas[0].schema, null, 2);
  dataInput = JSON.stringify(this.demoSchemas[0].data, null, 2);

  activeSchema: JsonSchema = this.demoSchemas[0].schema;
  activeData: unknown = this.demoSchemas[0].data;
  form?: FormGroup;

  parseError = '';

  get selectedSchema(): DemoSchema {
    return this.demoSchemas.find((schema) => schema.id === this.selectedId) ?? this.demoSchemas[0];
  }

  onSelect(): void {
    this.useCustom = false;
    this.activeSchema = this.selectedSchema.schema;
    this.activeData = this.selectedSchema.data;
    this.schemaInput = JSON.stringify(this.activeSchema, null, 2);
    this.dataInput = JSON.stringify(this.activeData, null, 2);
    this.parseError = '';
  }

  applyCustom(): void {
    this.parseError = '';
    try {
      const parsedSchema = JSON.parse(this.schemaInput) as JsonSchema;
      const parsedData = this.dataInput ? JSON.parse(this.dataInput) : undefined;
      this.activeSchema = parsedSchema;
      this.activeData = parsedData;
      this.useCustom = true;
    } catch (error) {
      this.parseError = error instanceof Error ? error.message : 'Invalid JSON input.';
    }
  }

  resetToDemo(): void {
    this.useCustom = false;
    this.onSelect();
  }

  onFormReady(form: FormGroup): void {
    this.form = form;
  }
}


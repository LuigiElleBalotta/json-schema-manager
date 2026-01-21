import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormArray, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { JsonSchema, JsonSchemaType } from './types';
import { JsonSchemaFormService } from './json-schema-form.service';
import { JsonSchemaValidationService } from './json-schema-validation.service';

@Component({
  selector: 'jsm-schema-node',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <ng-container [ngSwitch]="nodeKind">
      <div *ngSwitchCase="'oneOf'" class="space-y-3">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm font-semibold text-slate-800">{{ schema.title || label }}</div>
            <p *ngIf="schema.description" class="text-xs text-slate-500">{{ schema.description }}</p>
          </div>
          <span class="text-xs text-slate-400">oneOf</span>
        </div>

        <select
          class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          [(ngModel)]="selectedOneOf"
          (ngModelChange)="onOneOfChange()"
        >
          <option *ngFor="let option of schema.oneOf; let i = index" [ngValue]="i">
            {{ option.title || ('Option ' + (i + 1)) }}
          </option>
        </select>

        <jsm-schema-node
          *ngIf="activeVariant"
          [schema]="activeVariant"
          [control]="control"
          [parent]="parent"
          [controlKey]="controlKey"
          [path]="path"
          [errorsMap]="errorsMap"
          [label]="label"
          [required]="required"
          (controlReplaced)="controlReplaced.emit($event)"
        ></jsm-schema-node>
      </div>

      <div *ngSwitchCase="'anyOf'" class="space-y-3">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm font-semibold text-slate-800">{{ schema.title || label }}</div>
            <p *ngIf="schema.description" class="text-xs text-slate-500">{{ schema.description }}</p>
          </div>
          <span class="text-xs text-slate-400">anyOf</span>
        </div>

        <div class="flex flex-col gap-2">
          <label
            *ngFor="let option of schema.anyOf; let i = index"
            class="inline-flex items-center gap-2 text-sm text-slate-700"
          >
            <input
              type="checkbox"
              class="h-4 w-4 rounded border-slate-300 text-slate-900"
              [checked]="selectedAnyOf.has(i)"
              (change)="toggleAnyOf(i)"
            />
            {{ option.title || ('Option ' + (i + 1)) }}
          </label>
        </div>

        <jsm-schema-node
          *ngIf="activeVariant"
          [schema]="activeVariant"
          [control]="control"
          [parent]="parent"
          [controlKey]="controlKey"
          [path]="path"
          [errorsMap]="errorsMap"
          [label]="label"
          [required]="required"
          (controlReplaced)="controlReplaced.emit($event)"
        ></jsm-schema-node>
      </div>

      <div *ngSwitchCase="'allOf'" class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm font-semibold text-slate-800">{{ schema.title || label }}</div>
            <p *ngIf="schema.description" class="text-xs text-slate-500">{{ schema.description }}</p>
          </div>
          <span class="text-xs text-slate-400">allOf</span>
        </div>

        <div *ngFor="let subSchema of mergedAllOf; let i = index" class="rounded-xl border border-slate-200 p-3">
          <jsm-schema-node
            [schema]="subSchema"
            [control]="control"
            [parent]="parent"
            [controlKey]="controlKey"
            [path]="path"
            [errorsMap]="errorsMap"
            [label]="subSchema.title || ('Section ' + (i + 1))"
            [required]="required"
            (controlReplaced)="controlReplaced.emit($event)"
          ></jsm-schema-node>
        </div>
      </div>

      <fieldset *ngSwitchCase="'object'" class="border border-slate-200 rounded-xl p-4 bg-white/70">
        <legend class="px-2 text-sm font-semibold text-slate-700">{{ schema.title || label }}</legend>
        <p *ngIf="schema.description" class="text-xs text-slate-500 mb-4">{{ schema.description }}</p>
        <div *ngIf="metaBadges.length" class="flex flex-wrap gap-2 mb-4">
          <span
            *ngFor="let badge of metaBadges"
            class="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
          >
            {{ badge }}
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4" [formGroup]="controlAsGroup">
          <ng-container *ngFor="let key of objectKeys">
            <div class="flex flex-col gap-2">
              <div class="flex items-center justify-between" *ngIf="isDynamicKey(key)">
                <span class="text-xs font-semibold text-slate-500">{{ key }}</span>
                <button
                  type="button"
                  class="text-xs font-semibold text-rose-600 hover:text-rose-700"
                  (click)="removeDynamicKey(key)"
                >
                  Remove
                </button>
              </div>
              <jsm-schema-node
                [schema]="schemaForKey(key)"
                [control]="controlAsGroup.get(key)"
                [parent]="controlAsGroup"
                [controlKey]="key"
                [path]="pathForChild(key)"
                [errorsMap]="errorsMap"
                [label]="key"
                [required]="isRequired(key)"
                (controlReplaced)="controlReplaced.emit($event)"
              ></jsm-schema-node>
            </div>
          </ng-container>
        </div>

        <div class="mt-4 space-y-2" *ngIf="canAddProperty">
          <div class="text-xs font-semibold text-slate-500">Add property</div>
          <div class="flex flex-col md:flex-row gap-2">
            <input
              class="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              [(ngModel)]="newPropertyKey"
              placeholder="propertyName"
            />
            <button
              type="button"
              class="px-3 py-2 rounded-lg text-sm font-medium bg-slate-900 text-white hover:bg-slate-800"
              (click)="addDynamicProperty()"
            >
              Add
            </button>
          </div>
          <div *ngIf="propertyError" class="text-xs text-rose-600">{{ propertyError }}</div>
        </div>

        <div *ngIf="errorsForPath.length" class="mt-3 text-xs text-rose-600 space-y-1">
          <div *ngFor="let error of errorsForPath">{{ error }}</div>
        </div>
      </fieldset>

      <div *ngSwitchCase="'array'" class="space-y-3">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm font-semibold text-slate-700">{{ schema.title || label }}</div>
            <p *ngIf="schema.description" class="text-xs text-slate-500">{{ schema.description }}</p>
          </div>
          <button
            type="button"
            class="px-3 py-1.5 rounded-full text-sm font-medium bg-slate-900 text-white hover:bg-slate-800"
            (click)="addArrayItem()"
            [disabled]="!canAddArrayItem"
          >
            Add
          </button>
        </div>

        <div class="text-xs text-slate-500" *ngIf="effectiveSchema.contains">
          Must contain item(s) that match the contains schema.
          <span *ngIf="effectiveSchema.minContains">Min: {{ effectiveSchema.minContains }}</span>
          <span *ngIf="effectiveSchema.maxContains">Max: {{ effectiveSchema.maxContains }}</span>
        </div>

        <div *ngIf="metaBadges.length" class="flex flex-wrap gap-2">
          <span
            *ngFor="let badge of metaBadges"
            class="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
          >
            {{ badge }}
          </span>
        </div>

        <div class="space-y-3" *ngIf="arrayControls.length > 0; else emptyArray">
          <div
            *ngFor="let item of arrayControls; let i = index"
            class="rounded-xl border border-slate-200 p-3 bg-white"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-semibold text-slate-500">Item {{ i + 1 }}</span>
              <button
                type="button"
                class="text-xs font-semibold text-rose-600 hover:text-rose-700"
                (click)="removeArrayItem(i)"
              >
                Remove
              </button>
            </div>
            <jsm-schema-node
              [schema]="schemaForIndex(i)"
              [control]="item"
              [parent]="controlAsArray"
              [controlKey]="i"
              [path]="pathForChild(i)"
              [errorsMap]="errorsMap"
              [label]="label + ' item'"
              (controlReplaced)="controlReplaced.emit($event)"
            ></jsm-schema-node>
          </div>
        </div>

        <ng-template #emptyArray>
          <div class="text-xs text-slate-400 italic">No items yet.</div>
        </ng-template>

        <div *ngIf="errorsForPath.length" class="text-xs text-rose-600 space-y-1">
          <div *ngFor="let error of errorsForPath">{{ error }}</div>
        </div>
      </div>

      <div *ngSwitchDefault class="space-y-2">
        <ng-container *ngIf="inputKind !== 'checkbox'">
          <label class="text-sm font-medium text-slate-700">
            {{ schema.title || label }}
            <span *ngIf="required" class="text-rose-500">*</span>
          </label>
          <p *ngIf="schema.description" class="text-xs text-slate-500">{{ schema.description }}</p>
        </ng-container>

        <div *ngIf="metaBadges.length" class="flex flex-wrap gap-2">
          <span
            *ngFor="let badge of metaBadges"
            class="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
          >
            {{ badge }}
          </span>
        </div>

        <ng-container [ngSwitch]="inputKind">
          <input
            *ngSwitchCase="'text'"
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            [attr.type]="inputType"
            [attr.placeholder]="schema.title || label"
            [formControl]="control"
          />

          <textarea
            *ngSwitchCase="'textarea'"
            rows="4"
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            [attr.placeholder]="schema.title || label"
            [formControl]="control"
          ></textarea>

          <select
            *ngSwitchCase="'select'"
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            [formControl]="control"
          >
            <option *ngFor="let option of effectiveSchema.enum" [ngValue]="option">{{ option }}</option>
          </select>

          <label *ngSwitchCase="'checkbox'" class="inline-flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" class="h-4 w-4 rounded border-slate-300 text-slate-900" [formControl]="control" />
            <span>
              {{ schema.title || label }}
              <span *ngIf="required" class="text-rose-500">*</span>
            </span>
          </label>
        </ng-container>

        <p *ngIf="inputKind === 'checkbox' && schema.description" class="text-xs text-slate-500">
          {{ schema.description }}
        </p>

        <div *ngIf="effectiveSchema.examples?.length" class="text-xs text-slate-400">
          Example: {{ effectiveSchema.examples[0] }}
        </div>

        <div *ngIf="effectiveSchema.contentMediaType" class="text-xs text-slate-400">
          Content type: {{ effectiveSchema.contentMediaType }}
          <span *ngIf="effectiveSchema.contentEncoding">({{ effectiveSchema.contentEncoding }})</span>
        </div>

        <div *ngIf="errorsForPath.length" class="text-xs text-rose-600 space-y-1">
          <div *ngFor="let error of errorsForPath">{{ error }}</div>
        </div>
      </div>
    </ng-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonSchemaNodeComponent implements OnInit {
  @Input({ required: true }) schema!: JsonSchema;
  @Input({ required: true }) control!: AbstractControl;
  @Input() label = '';
  @Input() required = false;
  @Input() path = '';
  @Input() errorsMap = new Map<string, string[]>();
  @Input() parent?: FormGroup | FormArray;
  @Input() controlKey?: string | number;

  @Output() controlReplaced = new EventEmitter<AbstractControl>();

  selectedOneOf = 0;
  selectedAnyOf = new Set<number>();
  newPropertyKey = '';
  propertyError = '';

  constructor(
    private readonly schemaService: JsonSchemaFormService,
    private readonly validation: JsonSchemaValidationService
  ) {}

  ngOnInit(): void {
    if (this.schema.anyOf?.length) {
      this.selectedAnyOf.add(0);
    }
  }

  get nodeKind(): 'oneOf' | 'anyOf' | 'allOf' | 'object' | 'array' | 'primitive' {
    if (this.schema.oneOf?.length) {
      return 'oneOf';
    }
    if (this.schema.anyOf?.length) {
      return 'anyOf';
    }
    if (this.schema.allOf?.length) {
      return 'allOf';
    }
    const resolved = this.resolvedType;
    if (resolved === 'object') {
      return 'object';
    }
    if (resolved === 'array') {
      return 'array';
    }
    return 'primitive';
  }

  get resolvedType(): JsonSchema['type'] | 'enum' {
    return this.schemaService.resolveType(this.effectiveSchema) ?? 'string';
  }

  get inputKind(): 'text' | 'textarea' | 'select' | 'checkbox' {
    if (this.effectiveSchema.enum) {
      return 'select';
    }

    if (this.resolvedType === 'boolean') {
      return 'checkbox';
    }

    if (this.effectiveSchema.format === 'textarea' || (this.effectiveSchema.maxLength ?? 0) > 200) {
      return 'textarea';
    }

    return 'text';
  }

  get inputType(): string {
    if (this.effectiveSchema.format === 'email') {
      return 'email';
    }
    if (this.effectiveSchema.format === 'date') {
      return 'date';
    }
    if (this.effectiveSchema.format === 'time') {
      return 'time';
    }
    if (this.effectiveSchema.format === 'date-time') {
      return 'datetime-local';
    }
    if (this.resolvedType === 'number' || this.resolvedType === 'integer') {
      return 'number';
    }
    if (this.effectiveSchema.format === 'password') {
      return 'password';
    }
    return 'text';
  }

  get controlAsGroup(): FormGroup {
    return this.control as FormGroup;
  }

  get controlAsArray(): FormArray {
    return this.control as FormArray;
  }

  get arrayControls(): AbstractControl[] {
    return this.controlAsArray.controls;
  }

  get objectKeys(): string[] {
    return Object.keys(this.controlAsGroup.controls);
  }

  get canAddProperty(): boolean {
    return this.effectiveSchema.additionalProperties !== false || !!this.effectiveSchema.patternProperties;
  }

  get errorsForPath(): string[] {
    return this.errorsMap.get(this.path) ?? [];
  }

  get metaBadges(): string[] {
    const badges: string[] = [];
    if (this.effectiveSchema.deprecated) {
      badges.push('Deprecated');
    }
    if (this.effectiveSchema.readOnly) {
      badges.push('Read-only');
    }
    if (this.effectiveSchema.writeOnly) {
      badges.push('Write-only');
    }
    if (this.effectiveSchema.nullable) {
      badges.push('Nullable');
    }
    if (this.effectiveSchema.not) {
      badges.push('Not constraint');
    }
    return badges;
  }

  get activeVariant(): JsonSchema | null {
    if (this.schema.oneOf?.length) {
      return this.schema.oneOf[this.selectedOneOf] ?? null;
    }
    if (this.schema.anyOf?.length) {
      const selections = Array.from(this.selectedAnyOf).map((index) => this.schema.anyOf![index]);
      return selections.length ? this.mergeSchemas(selections) : this.schema.anyOf[0] ?? null;
    }
    if (this.schema.allOf?.length) {
      return this.mergeSchemas([this.schema, ...this.schema.allOf]);
    }
    return this.effectiveSchema;
  }

  get mergedAllOf(): JsonSchema[] {
    return this.schema.allOf?.length ? [this.schema, ...this.schema.allOf] : [this.schema];
  }

  isRequired(key: string): boolean {
    return this.effectiveSchema.required?.includes(key) ?? false;
  }

  schemaForKey(key: string): JsonSchema {
    return (
      this.effectiveSchema.properties?.[key] ??
      this.schemaService.resolveDynamicSchema(this.effectiveSchema, key) ??
      {}
    );
  }

  isDynamicKey(key: string): boolean {
    return !this.effectiveSchema.properties?.[key];
  }

  pathForChild(key: string | number): string {
    if (this.path === '') {
      return `/${key}`;
    }
    return `${this.path}/${key}`;
  }

  addDynamicProperty(): void {
    this.propertyError = '';
    const key = this.newPropertyKey.trim();
    if (!key) {
      this.propertyError = 'Property name is required.';
      return;
    }
    if (this.effectiveSchema.propertyNames) {
      const nameErrors = this.validation.validate(this.effectiveSchema.propertyNames, key);
      if (nameErrors.length) {
        this.propertyError = 'Property name does not match schema constraints.';
        return;
      }
    }
    if (this.controlAsGroup.contains(key)) {
      this.propertyError = 'Property already exists.';
      return;
    }
    const schemaForKey = this.schemaService.resolveDynamicSchema(this.effectiveSchema, key);
    if (!schemaForKey) {
      this.propertyError = 'This property is not allowed by the schema.';
      return;
    }
    const control = this.schemaService.buildControl(schemaForKey, undefined, false);
    this.controlAsGroup.addControl(key, control);
    this.newPropertyKey = '';
  }

  removeDynamicKey(key: string): void {
    this.controlAsGroup.removeControl(key);
  }

  schemaForIndex(index: number): JsonSchema {
    const prefixItems = this.effectiveSchema.prefixItems ?? [];
    if (prefixItems[index]) {
      return prefixItems[index];
    }
    if (this.effectiveSchema.items && this.effectiveSchema.items !== true) {
      return this.effectiveSchema.items as JsonSchema;
    }
    if (this.effectiveSchema.additionalItems && this.effectiveSchema.additionalItems !== true) {
      return this.effectiveSchema.additionalItems as JsonSchema;
    }
    if (this.effectiveSchema.unevaluatedItems && this.effectiveSchema.unevaluatedItems !== true) {
      return this.effectiveSchema.unevaluatedItems as JsonSchema;
    }
    return {};
  }

  get canAddArrayItem(): boolean {
    if (
      this.effectiveSchema.items === false ||
      this.effectiveSchema.additionalItems === false ||
      this.effectiveSchema.unevaluatedItems === false
    ) {
      return false;
    }
    return true;
  }

  addArrayItem(): void {
    if (!this.canAddArrayItem) {
      return;
    }
    const formArray = this.controlAsArray;
    const index = formArray.length;
    const schemaForItem = this.schemaForIndex(index);
    formArray.push(this.schemaService.buildControl(schemaForItem, undefined, false));
    formArray.markAsDirty();
  }

  removeArrayItem(index: number): void {
    const formArray = this.controlAsArray;
    formArray.removeAt(index);
    formArray.markAsDirty();
  }

  onOneOfChange(): void {
    if (!this.activeVariant) {
      return;
    }
    this.replaceControl(this.schemaService.buildControl(this.activeVariant, this.control.value, this.required));
  }

  toggleAnyOf(index: number): void {
    if (this.selectedAnyOf.has(index)) {
      this.selectedAnyOf.delete(index);
    } else {
      this.selectedAnyOf.add(index);
    }
    const variant = this.activeVariant;
    if (variant) {
      this.replaceControl(this.schemaService.buildControl(variant, this.control.value, this.required));
    }
  }

  private replaceControl(control: AbstractControl): void {
    if (this.parent) {
      if (this.parent instanceof FormGroup && typeof this.controlKey === 'string') {
        this.parent.setControl(this.controlKey, control);
      }
      if (this.parent instanceof FormArray && typeof this.controlKey === 'number') {
        this.parent.setControl(this.controlKey, control);
      }
      this.control = control;
      return;
    }

    this.control = control;
    this.controlReplaced.emit(control);
  }

  private get effectiveSchema(): JsonSchema {
    let schema = this.schema;

    if (schema.allOf?.length) {
      schema = this.mergeSchemas([schema, ...schema.allOf]);
    }

    schema = this.applyConditional(schema);
    schema = this.applyDependencies(schema);
    return schema;
  }

  private applyConditional(schema: JsonSchema): JsonSchema {
    if (!schema.if) {
      return schema;
    }

    const errors = this.validation.validate(schema.if, this.control.value);
    const branch = errors.length === 0 ? schema.then : schema.else;
    if (!branch) {
      return schema;
    }

    return this.mergeSchemas([schema, branch]);
  }

  private applyDependencies(schema: JsonSchema): JsonSchema {
    const value = this.control.value;
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return schema;
    }

    let merged = { ...schema } as JsonSchema;
    const valueKeys = Object.keys(value as Record<string, unknown>);

    if (schema.dependentRequired) {
      for (const key of valueKeys) {
        const required = schema.dependentRequired[key];
        if (required?.length) {
          merged = this.mergeSchemas([merged, { required }]);
        }
      }
    }

    if (schema.dependentSchemas) {
      for (const key of valueKeys) {
        const depSchema = schema.dependentSchemas[key];
        if (depSchema) {
          merged = this.mergeSchemas([merged, depSchema]);
        }
      }
    }

    if (schema.dependencies) {
      for (const key of valueKeys) {
        const dep = schema.dependencies[key];
        if (Array.isArray(dep)) {
          merged = this.mergeSchemas([merged, { required: dep }]);
        } else if (dep) {
          merged = this.mergeSchemas([merged, dep]);
        }
      }
    }

    return merged;
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

      if (acc.type && schema.type) {
        const accTypes = Array.isArray(acc.type) ? acc.type : [acc.type];
        const schemaTypes = Array.isArray(schema.type) ? schema.type : [schema.type];
        merged.type = Array.from(new Set([...accTypes, ...schemaTypes])) as JsonSchemaType[];
      }

      return merged;
    }, {} as JsonSchema);
  }
}



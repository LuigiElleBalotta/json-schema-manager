import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { JsonSchemaFormService } from './json-schema-form.service';
import { JsonSchema } from './types';

@Component({
  selector: 'jsm-schema-node',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <ng-container [ngSwitch]="resolvedType">
      <fieldset *ngSwitchCase="'object'" class="border border-slate-200 rounded-xl p-4 bg-white/70">
        <legend class="px-2 text-sm font-semibold text-slate-700">{{ schema.title || label }}</legend>
        <p *ngIf="schema.description" class="text-xs text-slate-500 mb-4">{{ schema.description }}</p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4" [formGroup]="controlAsGroup">
          <ng-container *ngFor="let key of objectKeys">
            <div class="flex flex-col gap-2">
              <jsm-schema-node
                [schema]="schema.properties?.[key] || {}"
                [control]="controlAsGroup.get(key)"
                [label]="key"
                [required]="isRequired(key)"
              ></jsm-schema-node>
            </div>
          </ng-container>
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
          >
            Add
          </button>
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
              [schema]="schema.items || {}"
              [control]="item"
              [label]="label + ' item'"
            ></jsm-schema-node>
          </div>
        </div>

        <ng-template #emptyArray>
          <div class="text-xs text-slate-400 italic">No items yet.</div>
        </ng-template>
      </div>

      <div *ngSwitchDefault class="space-y-2">
        <ng-container *ngIf="inputKind !== 'checkbox'">
          <label class="text-sm font-medium text-slate-700">
            {{ schema.title || label }}
            <span *ngIf="required" class="text-rose-500">*</span>
          </label>
          <p *ngIf="schema.description" class="text-xs text-slate-500">{{ schema.description }}</p>
        </ng-container>

        <ng-container [ngSwitch]="inputKind">
          <input
            *ngSwitchCase="'text'"
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            [attr.type]="resolvedType === 'number' || resolvedType === 'integer' ? 'number' : 'text'"
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
            <option *ngFor="let option of schema.enum" [ngValue]="option">{{ option }}</option>
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

        <div *ngIf="showErrors" class="text-xs text-rose-600 space-y-1">
          <div *ngIf="control.hasError('required')">This field is required.</div>
          <div *ngIf="control.hasError('minlength')">Minimum length is {{ schema.minLength }}.</div>
          <div *ngIf="control.hasError('maxlength')">Maximum length is {{ schema.maxLength }}.</div>
          <div *ngIf="control.hasError('min')">Minimum value is {{ schema.minimum }}.</div>
          <div *ngIf="control.hasError('max')">Maximum value is {{ schema.maximum }}.</div>
          <div *ngIf="control.hasError('pattern')">Value does not match required pattern.</div>
          <div *ngIf="control.hasError('email')">Enter a valid email address.</div>
          <div *ngIf="control.hasError('integer')">Value must be an integer.</div>
        </div>
      </div>
    </ng-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonSchemaNodeComponent {
  @Input({ required: true }) schema!: JsonSchema;
  @Input({ required: true }) control!: AbstractControl;
  @Input() label = '';
  @Input() required = false;

  constructor(private readonly schemaService: JsonSchemaFormService) {}

  get resolvedType(): JsonSchema['type'] | 'enum' {
    return this.schemaService.resolveType(this.schema) ?? 'string';
  }

  get inputKind(): 'text' | 'textarea' | 'select' | 'checkbox' {
    if (this.schema.enum) {
      return 'select';
    }

    if (this.resolvedType === 'boolean') {
      return 'checkbox';
    }

    if (this.schema.format === 'textarea' || (this.schema.maxLength ?? 0) > 200) {
      return 'textarea';
    }

    return 'text';
  }

  get controlAsGroup(): FormGroup {
    return this.control as FormGroup;
  }

  get arrayControls(): AbstractControl[] {
    return (this.control as FormArray).controls;
  }

  get objectKeys(): string[] {
    return Object.keys(this.schema.properties ?? {});
  }

  get showErrors(): boolean {
    return this.control.invalid && (this.control.dirty || this.control.touched);
  }

  isRequired(key: string): boolean {
    return this.schema.required?.includes(key) ?? false;
  }

  addArrayItem(): void {
    const formArray = this.control as FormArray;
    formArray.push(this.schemaService.buildControl(this.schema.items ?? {}, undefined, false));
    formArray.markAsDirty();
  }

  removeArrayItem(index: number): void {
    const formArray = this.control as FormArray;
    formArray.removeAt(index);
    formArray.markAsDirty();
  }
}

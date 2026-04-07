import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { JsonSchemaFormService } from './json-schema-form.service';
import { JsonSchema, SchemaError } from './types';
import { JsonSchemaNodeComponent } from './json-schema-node.component';
import { JsonSchemaResolverService } from './json-schema-resolver.service';
import { JsonSchemaValidationService } from './json-schema-validation.service';
import { JsonSchemaStylesService } from './json-schema-styles.service';

@Component({
  selector: 'jsm-json-schema-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, JsonSchemaNodeComponent],
  encapsulation: ViewEncapsulation.None,
  styles: [`
    .jsm-root *, .jsm-root *::before, .jsm-root *::after { box-sizing: border-box; }
    .jsm-root input, .jsm-root textarea, .jsm-root select, .jsm-root button {
      font-family: inherit;
      font-size: inherit;
      line-height: inherit;
    }
    .jsm-root input[type="number"]::-webkit-inner-spin-button,
    .jsm-root input[type="number"]::-webkit-outer-spin-button { opacity: 1; }
    /* Force border visibility against host resets */
    .jsm-root input:not([type="checkbox"]):not([type="radio"]):not(.sr-only),
    .jsm-root textarea,
    .jsm-root select {
      border-width: 1.5px !important;
      border-style: solid !important;
    }
  `],
  template: `
    <div class="jsm-root">
    <form class="w-full space-y-5">
      <div *ngIf="resolvedSchema?.title || resolvedSchema?.description" class="space-y-0.5">
        <h2 class="text-lg font-bold tracking-tight text-slate-900 dark:text-white">{{ resolvedSchema?.title || 'Form' }}</h2>
        <p *ngIf="resolvedSchema?.description" class="text-sm text-slate-500 dark:text-slate-400">{{ resolvedSchema?.description }}</p>
      </div>

      <div *ngIf="loading" class="flex items-center gap-2 py-6 text-sm text-slate-500 dark:text-slate-400" aria-live="polite">
        <svg class="h-4 w-4 animate-spin text-indigo-500 dark:text-indigo-400" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
        </svg>
        Resolving schema&hellip;
      </div>

      <!-- schema structural errors panel -->
      <div *ngIf="schemaErrorList.length > 0 && !loading"
        class="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-4 space-y-3"
        role="alert">
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" viewBox="0 0 16 16" fill="none">
            <path d="M8 2L1.5 13.5h13L8 2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
            <path d="M8 6v3.5M8 11.5v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <span class="text-sm font-semibold text-amber-800 dark:text-amber-300">
            Schema errors ({{ schemaErrorList.length }})
          </span>
        </div>
        <p class="text-xs text-amber-700 dark:text-amber-400">
          The schema has structural issues. Fix them to get a valid form.
        </p>
        <div class="space-y-2">
          <div *ngFor="let err of schemaErrorList"
            class="rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 px-3 py-2 space-y-0.5">
            <p class="font-mono text-[11px] font-semibold text-amber-700 dark:text-amber-400">{{ err.path }}</p>
            <p class="text-xs text-slate-700 dark:text-slate-300">{{ err.message }}</p>
            <p class="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">keyword: {{ err.keyword }}</p>
          </div>
        </div>
      </div>

      <div *ngIf="form && resolvedSchema && !loading" class="space-y-5" [formGroup]="form">
        <jsm-schema-node
          [schema]="resolvedSchema"
          [control]="rootControl"
          [path]="''"
          [errorsMap]="errorsMap"
          [allowAdditionalProperties]="allowAdditionalProperties"
          label="Root"
          (controlReplaced)="onRootReplaced($event)"
        ></jsm-schema-node>
      </div>
    </form>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonSchemaFormComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) schema!: JsonSchema;
  @Input() value?: unknown;
  @Input() data?: unknown;
  @Input() allowAdditionalProperties = false;

  @Output() formReady = new EventEmitter<FormGroup>();
  @Output() valueChange = new EventEmitter<unknown>();
  @Output() schemaReady = new EventEmitter<JsonSchema>();
  @Output() schemaErrors = new EventEmitter<SchemaError[]>();

  form!: FormGroup;
  rootControl!: AbstractControl;
  resolvedSchema?: JsonSchema;
  errorsMap = new Map<string, string[]>();
  schemaErrorList: SchemaError[] = [];
  loading = false;

  private valueSub?: Subscription;

  constructor(
    private readonly schemaService: JsonSchemaFormService,
    private readonly resolver: JsonSchemaResolverService,
    private readonly validation: JsonSchemaValidationService,
    stylesService: JsonSchemaStylesService,
  ) {
    stylesService.inject();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['schema'] || changes['value'] || changes['data']) {
      void this.buildForm();
    }
  }

  ngOnDestroy(): void {
    this.valueSub?.unsubscribe();
  }

  private async buildForm(): Promise<void> {
    this.valueSub?.unsubscribe();
    this.loading = true;
    this.resolvedSchema = await this.resolver.resolve(this.schema, this.schema?.$id);

    // Validate the schema itself and emit any structural errors
    const schemaErrs = this.validation.validateSchema(this.resolvedSchema);
    this.schemaErrorList = schemaErrs;
    this.schemaErrors.emit(schemaErrs);

    this.schemaReady.emit(this.resolvedSchema);

    // If the schema has structural errors, stop here — don't try to build the form
    if (schemaErrs.length > 0) {
      this.form = undefined!;
      this.loading = false;
      return;
    }
    const initialData = this.value !== undefined ? this.value : this.data;
    this.rootControl = this.schemaService.buildControl(this.resolvedSchema, initialData);
    this.form = this.rootControl instanceof FormGroup ? this.rootControl : new FormGroup({ value: this.rootControl });
    this.formReady.emit(this.form);
    this.loading = false;

    this.attachValueSub();
  }

  private updateErrors(): void {
    if (!this.resolvedSchema) {
      this.errorsMap = new Map();
      return;
    }

    const errors = this.validation.validate(this.resolvedSchema, this.rootControl.value);
    const map = new Map<string, string[]>();

    for (const error of errors) {
      const path = error.instancePath ?? '';
      const messages = map.get(path) ?? [];
      messages.push(error.message ?? error.keyword);
      map.set(path, messages);
    }

    this.errorsMap = map;
  }

  onRootReplaced(control: AbstractControl): void {
    this.rootControl = control;
    if (control instanceof FormGroup) {
      this.form = control;
    } else {
      if (!(this.form instanceof FormGroup) || !this.form.contains('value')) {
        this.form = new FormGroup({ value: control });
      } else {
        this.form.setControl('value', control);
      }
    }
    this.attachValueSub();
  }

  private attachValueSub(): void {
    this.valueSub?.unsubscribe();
    this.updateErrors();
    this.valueSub = this.form.valueChanges.subscribe(() => {
      this.updateErrors();
      this.valueChange.emit(this.rootControl.value);
    });
  }
}

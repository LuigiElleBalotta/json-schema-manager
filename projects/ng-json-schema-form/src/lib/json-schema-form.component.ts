import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { JsonSchemaFormService } from './json-schema-form.service';
import { JsonSchema } from './types';
import { JsonSchemaNodeComponent } from './json-schema-node.component';
import { JsonSchemaResolverService } from './json-schema-resolver.service';
import { JsonSchemaValidationService } from './json-schema-validation.service';

@Component({
  selector: 'jsm-json-schema-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, JsonSchemaNodeComponent],
  template: `
    <form class="w-full max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <div class="space-y-1">
        <h2 class="text-xl font-semibold text-slate-900">{{ resolvedSchema?.title || 'Generated Form' }}</h2>
        <p *ngIf="resolvedSchema?.description" class="text-sm text-slate-500">
          {{ resolvedSchema?.description }}
        </p>
      </div>

      <div *ngIf="loading" class="text-sm text-slate-500">Resolving schema...</div>

      <div *ngIf="form && resolvedSchema" class="space-y-6" [formGroup]="form">
        <jsm-schema-node
          [schema]="resolvedSchema"
          [control]="rootControl"
          [path]="''"
          [errorsMap]="errorsMap"
          label="Root"
          (controlReplaced)="onRootReplaced($event)"
        ></jsm-schema-node>
      </div>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonSchemaFormComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) schema!: JsonSchema;
  @Input() value?: unknown;

  @Output() formReady = new EventEmitter<FormGroup>();
  @Output() valueChange = new EventEmitter<unknown>();

  form!: FormGroup;
  rootControl!: AbstractControl;
  resolvedSchema?: JsonSchema;
  errorsMap = new Map<string, string[]>();
  loading = false;

  private valueSub?: Subscription;

  constructor(
    private readonly schemaService: JsonSchemaFormService,
    private readonly resolver: JsonSchemaResolverService,
    private readonly validation: JsonSchemaValidationService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['schema'] || changes['value']) {
      void this.buildForm();
    }
  }

  ngOnDestroy(): void {
    this.valueSub?.unsubscribe();
  }

  private async buildForm(): Promise<void> {
    this.valueSub?.unsubscribe();
    this.loading = true;
    this.resolvedSchema = await this.resolver.resolve(this.schema);
    this.rootControl = this.schemaService.buildControl(this.resolvedSchema, this.value);
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

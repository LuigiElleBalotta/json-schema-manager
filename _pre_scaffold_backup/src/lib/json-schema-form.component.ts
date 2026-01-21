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

@Component({
  selector: 'jsm-json-schema-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, JsonSchemaNodeComponent],
  template: `
    <form class="w-full max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      <div class="space-y-1">
        <h2 class="text-xl font-semibold text-slate-900">{{ schema?.title || 'Generated Form' }}</h2>
        <p *ngIf="schema?.description" class="text-sm text-slate-500">{{ schema.description }}</p>
      </div>

      <div *ngIf="form" class="space-y-6" [formGroup]="form">
        <jsm-schema-node [schema]="schema" [control]="rootControl" label="Root"></jsm-schema-node>
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

  private valueSub?: Subscription;

  constructor(private readonly schemaService: JsonSchemaFormService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['schema'] || changes['value']) {
      this.buildForm();
    }
  }

  ngOnDestroy(): void {
    this.valueSub?.unsubscribe();
  }

  private buildForm(): void {
    this.valueSub?.unsubscribe();
    this.rootControl = this.schemaService.buildControl(this.schema, this.value);
    this.form = this.rootControl instanceof FormGroup ? this.rootControl : new FormGroup({ value: this.rootControl });
    this.formReady.emit(this.form);

    this.valueSub = this.form.valueChanges.subscribe((value) => {
      this.valueChange.emit(value);
    });
  }
}

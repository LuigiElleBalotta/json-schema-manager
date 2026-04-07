import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  OnDestroy,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormArray, FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { JsonSchema, JsonSchemaType } from './types';
import { JsonSchemaFormService } from './json-schema-form.service';
import { JsonSchemaValidationService } from './json-schema-validation.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'jsm-schema-node',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  encapsulation: ViewEncapsulation.None,
  styles: [`
    /* ── Layout ── */
    .jsm-field        { display:flex; flex-direction:column; gap:.375rem; }
    .jsm-field-label  { display:block; font-size:.8125rem; font-weight:600; color:#374151; }
    .jsm-field-hint   { font-size:.75rem; color:#6b7280; margin:0; line-height:1.4; }
    .jsm-required     { color:#ef4444; margin-left:.125rem; }
    .jsm-example      { font-size:.6875rem; color:#9ca3af; }

    /* ── Inputs ── */
    .jsm-input, .jsm-textarea, .jsm-select {
      width:100%; border-radius:.5rem; border:1.5px solid #d1d5db;
      background:#fff; padding:.5rem .75rem; font-size:.875rem; color:#111827;
      outline:none; box-shadow:0 1px 2px rgba(0,0,0,.04);
      transition:border-color .15s, box-shadow .15s;
      font-family:inherit; box-sizing:border-box;
    }
    .jsm-input:hover, .jsm-textarea:hover, .jsm-select:hover { border-color:#9ca3af; }
    .jsm-input:focus, .jsm-textarea:focus, .jsm-select:focus {
      border-color:#6366f1; box-shadow:0 0 0 3px rgba(99,102,241,.15);
    }
    .jsm-input--error, .jsm-textarea--error, .jsm-select--error {
      border-color:#f87171 !important; background:#fff5f5;
    }
    .jsm-input--error:focus, .jsm-textarea--error:focus, .jsm-select--error:focus {
      box-shadow:0 0 0 3px rgba(248,113,113,.2) !important;
    }
    .jsm-textarea { resize:vertical; min-height:6rem; }

    /* ── Select wrapper ── */
    .jsm-select-wrap { position:relative; }
    .jsm-select { appearance:none; padding-right:2.25rem; cursor:pointer; }
    .jsm-select-chevron {
      position:absolute; right:.625rem; top:50%; transform:translateY(-50%);
      width:1rem; height:1rem; color:#9ca3af; pointer-events:none;
    }

    /* ── Toggle switch ── */
    .jsm-toggle-label { display:inline-flex; align-items:center; gap:.625rem; cursor:pointer; user-select:none; }
    .jsm-toggle-track {
      position:relative; display:inline-flex; align-items:center;
      width:2.25rem; height:1.25rem; border-radius:9999px; flex-shrink:0;
      background:#d1d5db; transition:background .2s;
    }
    .jsm-toggle-track.jsm-on { background:#4f46e5; }
    .jsm-toggle-thumb {
      display:inline-block; width:1rem; height:1rem; border-radius:9999px;
      background:#fff; box-shadow:0 1px 3px rgba(0,0,0,.2);
      transform:translateX(.125rem); transition:transform .2s;
    }
    .jsm-toggle-track.jsm-on .jsm-toggle-thumb { transform:translateX(1.125rem); }
    .jsm-toggle-text { font-size:.875rem; font-weight:500; color:#374151; }

    /* ── Buttons ── */
    .jsm-btn-primary {
      display:inline-flex; align-items:center; gap:.25rem;
      padding:.375rem .75rem; border-radius:.5rem; font-size:.8125rem;
      font-weight:600; background:#4f46e5; color:#fff; border:none;
      cursor:pointer; box-shadow:0 1px 2px rgba(79,70,229,.3);
      transition:background .15s, transform .1s, box-shadow .15s;
      white-space:nowrap; font-family:inherit;
    }
    .jsm-btn-primary:hover { background:#4338ca; transform:translateY(-1px); box-shadow:0 3px 8px rgba(79,70,229,.3); }
    .jsm-btn-primary:active { transform:translateY(0); }
    .jsm-btn-primary:disabled { opacity:.45; cursor:not-allowed; transform:none; }
    .jsm-btn-danger {
      display:inline-flex; align-items:center; gap:.25rem;
      padding:.25rem .5rem; border-radius:.375rem; font-size:.75rem;
      font-weight:600; background:transparent; color:#dc2626;
      border:1.5px solid #fca5a5; cursor:pointer;
      transition:background .15s, border-color .15s; font-family:inherit;
    }
    .jsm-btn-danger:hover { background:#fee2e2; border-color:#f87171; }

    /* ── Errors ── */
    .jsm-error-list { display:flex; flex-direction:column; gap:.25rem; margin-top:.25rem; }
    .jsm-error-msg  { display:flex; align-items:center; gap:.375rem; font-size:.75rem; color:#dc2626; font-weight:500; }
    .jsm-error-icon { width:.875rem; height:.875rem; flex-shrink:0; }

    /* ── Badges ── */
    .jsm-badge-row { display:flex; flex-wrap:wrap; gap:.375rem; }
    .jsm-badge {
      display:inline-flex; align-items:center; border-radius:9999px;
      padding:.125rem .5rem; font-size:.6875rem; font-weight:600;
      letter-spacing:.02em; text-transform:uppercase;
    }
    .jsm-badge--deprecated { background:#fef3c7; color:#92400e; }
    .jsm-badge--readonly   { background:#f1f5f9; color:#475569; }
    .jsm-badge--writeonly  { background:#dbeafe; color:#1e40af; }
    .jsm-badge--not        { background:#fee2e2; color:#991b1b; }
    .jsm-badge--nullable   { background:#f3f4f6; color:#6b7280; }

    /* ── Object fieldset ── */
    .jsm-fieldset {
      border:1.5px solid #e5e7eb; border-radius:.875rem; padding:1.25rem;
      background:#fff; box-shadow:0 1px 3px rgba(0,0,0,.06);
      transition:box-shadow .2s; box-sizing:border-box;
    }
    .jsm-fieldset:focus-within { border-color:#c7d2fe; box-shadow:0 0 0 3px rgba(99,102,241,.08),0 1px 3px rgba(0,0,0,.06); }
    .jsm-legend { display:inline-flex; align-items:center; gap:.375rem; padding:0 .5rem; font-size:.875rem; font-weight:700; color:#1f2937; }
    .jsm-obj-grid { display:grid; grid-template-columns:1fr; gap:1rem; }
    @media(min-width:640px){ .jsm-obj-grid { grid-template-columns:repeat(2,1fr); } }
    .jsm-obj-complex { display:flex; flex-direction:column; gap:1rem; margin-top:1rem; }
    .jsm-dynamic-key-header {
      display:flex; align-items:center; justify-content:space-between;
      padding:.25rem .5rem; background:#f9fafb; border-radius:.375rem;
      border:1px dashed #d1d5db; margin-bottom:.25rem;
    }
    .jsm-dynamic-key-label { font-size:.75rem; font-weight:600; color:#6b7280; font-family:monospace; }
    .jsm-add-prop {
      margin-top:1rem; padding:.875rem; background:#f9fafb;
      border-radius:.625rem; border:1.5px dashed #d1d5db;
      display:flex; flex-direction:column; gap:.5rem;
    }
    .jsm-add-prop-label { font-size:.75rem; font-weight:600; color:#6b7280; text-transform:uppercase; letter-spacing:.04em; }
    .jsm-add-prop-row { display:flex; gap:.5rem; align-items:center; }
    .jsm-input--sm { padding:.375rem .625rem; font-size:.8125rem; }

    /* ── Array ── */
    .jsm-array-block { display:flex; flex-direction:column; gap:.75rem; }
    .jsm-array-header { display:flex; align-items:flex-start; justify-content:space-between; gap:.5rem; }
    .jsm-array-title { font-size:.875rem; font-weight:700; color:#1f2937; display:flex; align-items:center; gap:.375rem; }
    .jsm-array-items { display:flex; flex-direction:column; gap:.75rem; }
    .jsm-array-item {
      border:1.5px solid #e5e7eb; border-radius:.75rem; padding:.875rem;
      background:#fff; box-shadow:0 1px 2px rgba(0,0,0,.04);
      transition:border-color .15s, box-shadow .15s;
    }
    .jsm-array-item:focus-within { border-color:#c7d2fe; box-shadow:0 0 0 3px rgba(99,102,241,.08); }
    .jsm-array-item-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:.75rem; }
    .jsm-array-index {
      display:inline-flex; align-items:center; justify-content:center;
      width:1.5rem; height:1.5rem; border-radius:9999px;
      background:#eef2ff; color:#4f46e5; font-size:.6875rem; font-weight:700;
    }
    .jsm-empty-array {
      display:flex; flex-direction:column; align-items:center; gap:.5rem;
      padding:2rem 1rem; border:1.5px dashed #e5e7eb; border-radius:.75rem;
      color:#9ca3af; font-size:.8125rem; text-align:center;
    }
    .jsm-contains-hint {
      display:flex; align-items:center; gap:.375rem; font-size:.75rem;
      color:#6366f1; background:#eef2ff; border-radius:.375rem; padding:.375rem .625rem;
    }

    /* ── Combinators ── */
    .jsm-combinator { border:1.5px solid #e5e7eb; border-radius:.875rem; overflow:hidden; background:#fff; box-shadow:0 1px 3px rgba(0,0,0,.06); }
    .jsm-combinator-header { display:flex; align-items:flex-start; justify-content:space-between; padding:.875rem 1rem; background:#f9fafb; border-bottom:1.5px solid #e5e7eb; }
    .jsm-combinator-title { font-size:.875rem; font-weight:700; color:#1f2937; }
    .jsm-combinator-body { padding:1rem; }
    .jsm-combinator-hint { font-size:.75rem; color:#6b7280; margin:.25rem 0 0; }
    .jsm-oneof-tabs { display:flex; overflow-x:auto; border-bottom:1.5px solid #e5e7eb; }
    .jsm-tab {
      padding:.5rem 1rem; font-size:.8125rem; font-weight:500; color:#6b7280;
      border:none; background:transparent; cursor:pointer;
      border-bottom:2px solid transparent; margin-bottom:-1.5px;
      transition:color .15s, border-color .15s; white-space:nowrap; font-family:inherit;
    }
    .jsm-tab:hover { color:#4f46e5; }
    .jsm-tab--active { color:#4f46e5; border-bottom-color:#4f46e5; font-weight:600; }
    .jsm-anyof-options { display:flex; flex-wrap:wrap; gap:.5rem; padding:.75rem 1rem; border-bottom:1.5px solid #e5e7eb; }
    .jsm-anyof-option {
      display:inline-flex; align-items:center; gap:.375rem; padding:.375rem .75rem;
      border-radius:9999px; border:1.5px solid #e5e7eb; font-size:.8125rem;
      font-weight:500; color:#6b7280; cursor:pointer; transition:all .15s; background:#fff;
    }
    .jsm-anyof-option:hover { border-color:#a5b4fc; color:#4f46e5; }
    .jsm-anyof-option--active { border-color:#6366f1; background:#eef2ff; color:#4f46e5; }
    .jsm-allof-section { border-left:3px solid #e0e7ff; padding-left:1rem; }
    .jsm-combinator-badge {
      display:inline-flex; align-items:center; border-radius:9999px;
      padding:.125rem .5rem; font-size:.6875rem; font-weight:700;
      text-transform:uppercase; letter-spacing:.04em; flex-shrink:0; margin-left:.75rem;
    }
    .jsm-badge--oneof  { background:#dbeafe; color:#1e40af; }
    .jsm-badge--anyof  { background:#ede9fe; color:#5b21b6; }
    .jsm-badge--allof  { background:#ccfbf1; color:#065f46; }

    /* ── Dark mode ── */
    .dark .jsm-field-label  { color:#d1d5db; }
    .dark .jsm-field-hint   { color:#9ca3af; }
    .dark .jsm-toggle-track { background:#475569; }
    .dark .jsm-toggle-track.jsm-on { background:#4f46e5; }
    .dark .jsm-toggle-text  { color:#d1d5db; }
    .dark .jsm-input, .dark .jsm-textarea, .dark .jsm-select {
      background:#1e293b; border-color:#475569; color:#f1f5f9;
    }
    .dark .jsm-input:focus, .dark .jsm-textarea:focus, .dark .jsm-select:focus {
      border-color:#6366f1; box-shadow:0 0 0 3px rgba(99,102,241,.2);
    }
    .dark .jsm-input--error, .dark .jsm-textarea--error, .dark .jsm-select--error {
      border-color:#f87171 !important; background:rgba(248,113,113,.1);
    }
    .dark .jsm-fieldset { background:#0f172a; border-color:#334155; }
    .dark .jsm-fieldset:focus-within { border-color:#6366f1; }
    .dark .jsm-legend { color:#f1f5f9; }
    .dark .jsm-combinator { background:#0f172a; border-color:#334155; }
    .dark .jsm-combinator-header { background:rgba(30,41,59,.6); border-color:#334155; }
    .dark .jsm-combinator-title { color:#f1f5f9; }
    .dark .jsm-oneof-tabs { border-color:#334155; }
    .dark .jsm-tab { color:#94a3b8; }
    .dark .jsm-tab--active { color:#818cf8; border-bottom-color:#818cf8; }
    .dark .jsm-anyof-options { border-color:#334155; }
    .dark .jsm-anyof-option { border-color:#334155; color:#94a3b8; background:#0f172a; }
    .dark .jsm-anyof-option--active { border-color:#6366f1; background:rgba(99,102,241,.15); color:#818cf8; }
    .dark .jsm-allof-section { border-left-color:#3730a3; }
    .dark .jsm-array-item { background:#0f172a; border-color:#334155; }
    .dark .jsm-array-item:focus-within { border-color:#6366f1; }
    .dark .jsm-array-index { background:rgba(99,102,241,.2); color:#818cf8; }
    .dark .jsm-empty-array { border-color:#334155; color:#64748b; }
    .dark .jsm-contains-hint { background:rgba(99,102,241,.15); color:#818cf8; }
    .dark .jsm-add-prop { background:rgba(30,41,59,.4); border-color:#475569; }
    .dark .jsm-add-prop-label { color:#64748b; }
    .dark .jsm-dynamic-key-header { background:rgba(30,41,59,.5); border-color:#475569; }
    .dark .jsm-dynamic-key-label { color:#94a3b8; }
    .dark .jsm-error-msg { color:#f87171; }
    .dark .jsm-array-title { color:#f1f5f9; }
    .dark .jsm-badge--deprecated { background:rgba(217,119,6,.2); color:#fbbf24; }
    .dark .jsm-badge--readonly   { background:#1e293b; color:#94a3b8; }
    .dark .jsm-badge--writeonly  { background:rgba(37,99,235,.2); color:#60a5fa; }
    .dark .jsm-badge--not        { background:rgba(220,38,38,.2); color:#f87171; }
    .dark .jsm-badge--nullable   { background:#1e293b; color:#94a3b8; }
    .dark .jsm-select-chevron    { color:#64748b; }
  `],
  template: `
    <ng-container [ngSwitch]="nodeKind">

      <!-- ═══ oneOf ═══ -->
      <div *ngSwitchCase="'oneOf'" class="jsm-combinator">
        <div class="jsm-combinator-header">
          <div>
            <p class="jsm-combinator-title">{{ schema.title || label }}</p>
            <p *ngIf="schema.description" class="jsm-combinator-hint">{{ schema.description }}</p>
          </div>
          <span class="jsm-combinator-badge jsm-badge--oneof">oneOf</span>
        </div>
        <div class="jsm-oneof-tabs">
          <button *ngFor="let option of schema.oneOf; let i = index" type="button"
            class="jsm-tab" [class.jsm-tab--active]="selectedOneOf === i"
            (click)="selectedOneOf = i; onOneOfChange()">
            {{ option.title || ('Option ' + (i + 1)) }}
          </button>
        </div>
        <div class="jsm-combinator-body" *ngIf="activeVariant">
          <jsm-schema-node [schema]="activeVariant" [control]="control" [parent]="parent" [controlKey]="controlKey"
            [path]="path" [errorsMap]="errorsMap" [label]="label" [required]="required"
            [allowAdditionalProperties]="allowAdditionalProperties"
            (controlReplaced)="controlReplaced.emit($event)"></jsm-schema-node>
        </div>
      </div>

      <!-- ═══ anyOf ═══ -->
      <div *ngSwitchCase="'anyOf'" class="jsm-combinator">
        <div class="jsm-combinator-header">
          <div>
            <p class="jsm-combinator-title">{{ schema.title || label }}</p>
            <p *ngIf="schema.description" class="jsm-combinator-hint">{{ schema.description }}</p>
          </div>
          <span class="jsm-combinator-badge jsm-badge--anyof">anyOf</span>
        </div>
        <div class="jsm-anyof-options">
          <label *ngFor="let option of schema.anyOf; let i = index"
            class="jsm-anyof-option" [class.jsm-anyof-option--active]="selectedAnyOf.has(i)">
            <input type="checkbox" class="sr-only" [checked]="selectedAnyOf.has(i)" (change)="toggleAnyOf(i)" />
            {{ option.title || ('Option ' + (i + 1)) }}
          </label>
        </div>
        <div class="jsm-combinator-body" *ngIf="activeVariant">
          <jsm-schema-node [schema]="activeVariant" [control]="control" [parent]="parent" [controlKey]="controlKey"
            [path]="path" [errorsMap]="errorsMap" [label]="label" [required]="required"
            [allowAdditionalProperties]="allowAdditionalProperties"
            (controlReplaced)="controlReplaced.emit($event)"></jsm-schema-node>
        </div>
      </div>

      <!-- ═══ allOf ═══ -->
      <div *ngSwitchCase="'allOf'" class="jsm-combinator">
        <div class="jsm-combinator-header">
          <div>
            <p class="jsm-combinator-title">{{ schema.title || label }}</p>
            <p *ngIf="schema.description" class="jsm-combinator-hint">{{ schema.description }}</p>
          </div>
          <span class="jsm-combinator-badge jsm-badge--allof">allOf</span>
        </div>
        <div class="jsm-combinator-body">
          <div *ngFor="let subSchema of mergedAllOf; let i = index" class="jsm-allof-section">
            <jsm-schema-node [schema]="subSchema" [control]="control" [parent]="parent" [controlKey]="controlKey"
              [path]="path" [errorsMap]="errorsMap" [label]="subSchema.title || ('Section ' + (i + 1))" [required]="required"
              [allowAdditionalProperties]="allowAdditionalProperties"
              (controlReplaced)="controlReplaced.emit($event)"></jsm-schema-node>
          </div>
        </div>
      </div>

      <!-- ═══ object ═══ -->
      <fieldset *ngSwitchCase="'object'" class="jsm-fieldset">
        <legend class="jsm-legend">{{ schema.title || label }}</legend>
        <p *ngIf="schema.description" class="jsm-field-hint" style="margin-bottom:.75rem;margin-top:.25rem;">{{ schema.description }}</p>

        <div *ngIf="metaBadges.length" class="jsm-badge-row" style="margin-bottom:.75rem;">
          <span *ngFor="let badge of metaBadges" class="jsm-badge" [ngClass]="badgeClass(badge)">{{ badge }}</span>
        </div>

        <div class="jsm-obj-grid" [formGroup]="controlAsGroup">
          <ng-container *ngFor="let key of simpleKeys">
            <div style="display:flex;flex-direction:column;gap:.25rem;">
              <div *ngIf="isDynamicKey(key)" class="jsm-dynamic-key-header">
                <span class="jsm-dynamic-key-label">{{ key }}</span>
                <button type="button" class="jsm-btn-danger" (click)="removeDynamicKey(key)">Remove</button>
              </div>
              <jsm-schema-node [schema]="schemaForKey(key)" [control]="childControl(key)" [parent]="controlAsGroup"
                [controlKey]="key" [path]="pathForChild(key)" [errorsMap]="errorsMap" [label]="key"
                [required]="isRequired(key)" [allowAdditionalProperties]="allowAdditionalProperties"
                (controlReplaced)="controlReplaced.emit($event)"></jsm-schema-node>
            </div>
          </ng-container>
        </div>

        <div class="jsm-obj-complex" *ngIf="complexKeys.length > 0" [formGroup]="controlAsGroup">
          <ng-container *ngFor="let key of complexKeys">
            <div style="display:flex;flex-direction:column;gap:.25rem;">
              <div *ngIf="isDynamicKey(key)" class="jsm-dynamic-key-header">
                <span class="jsm-dynamic-key-label">{{ key }}</span>
                <button type="button" class="jsm-btn-danger" (click)="removeDynamicKey(key)">Remove</button>
              </div>
              <jsm-schema-node [schema]="schemaForKey(key)" [control]="childControl(key)" [parent]="controlAsGroup"
                [controlKey]="key" [path]="pathForChild(key)" [errorsMap]="errorsMap" [label]="key"
                [required]="isRequired(key)" [allowAdditionalProperties]="allowAdditionalProperties"
                (controlReplaced)="controlReplaced.emit($event)"></jsm-schema-node>
            </div>
          </ng-container>
        </div>

        <div *ngIf="canAddProperty" class="jsm-add-prop">
          <p class="jsm-add-prop-label">Add property</p>
          <div class="jsm-add-prop-row">
            <input class="jsm-input jsm-input--sm" style="flex:1;" [(ngModel)]="newPropertyKey" placeholder="propertyName" />
            <button type="button" class="jsm-btn-primary" (click)="addDynamicProperty()">Add</button>
          </div>
          <p *ngIf="propertyError" class="jsm-error-msg">
            <svg class="jsm-error-icon" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.5"/><path d="M8 5v3.5M8 11v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            {{ propertyError }}
          </p>
        </div>

        <div *ngIf="errorsForPath.length" class="jsm-error-list" style="margin-top:.75rem;">
          <p *ngFor="let error of errorsForPath" class="jsm-error-msg">
            <svg class="jsm-error-icon" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.5"/><path d="M8 5v3.5M8 11v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            {{ error }}
          </p>
        </div>
      </fieldset>

      <!-- ═══ array ═══ -->
      <div *ngSwitchCase="'array'" class="jsm-array-block">
        <div class="jsm-array-header">
          <div>
            <p class="jsm-array-title">
              {{ schema.title || label }}<span *ngIf="required" style="color:#ef4444;margin-left:.125rem;">*</span>
            </p>
            <p *ngIf="schema.description" class="jsm-field-hint">{{ schema.description }}</p>
          </div>
          <button type="button" class="jsm-btn-primary" (click)="addArrayItem()" [disabled]="!canAddArrayItem">
            <svg style="width:.875rem;height:.875rem;flex-shrink:0;" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            Add item
          </button>
        </div>

        <div *ngIf="effectiveSchema.contains" class="jsm-contains-hint">
          Must contain matching item(s)
          <span *ngIf="effectiveSchema.minContains"> · min {{ effectiveSchema.minContains }}</span>
          <span *ngIf="effectiveSchema.maxContains"> · max {{ effectiveSchema.maxContains }}</span>
        </div>

        <div *ngIf="metaBadges.length" class="jsm-badge-row">
          <span *ngFor="let badge of metaBadges" class="jsm-badge" [ngClass]="badgeClass(badge)">{{ badge }}</span>
        </div>

        <div class="jsm-array-items" *ngIf="arrayControls.length > 0; else emptyArray">
          <div *ngFor="let item of arrayControls; let i = index" class="jsm-array-item">
            <div class="jsm-array-item-header">
              <span class="jsm-array-index">{{ i + 1 }}</span>
              <button type="button" class="jsm-btn-danger" (click)="removeArrayItem(i)">Remove</button>
            </div>
            <jsm-schema-node [schema]="schemaForIndex(i)" [control]="item" [parent]="controlAsArray"
              [controlKey]="i" [path]="pathForChild(i)" [errorsMap]="errorsMap" [label]="label + ' item'"
              [allowAdditionalProperties]="allowAdditionalProperties"
              (controlReplaced)="controlReplaced.emit($event)"></jsm-schema-node>
          </div>
        </div>

        <ng-template #emptyArray>
          <div class="jsm-empty-array">No items yet — click "Add item" to start.</div>
        </ng-template>

        <div *ngIf="errorsForPath.length" class="jsm-error-list">
          <p *ngFor="let error of errorsForPath" class="jsm-error-msg">
            <svg class="jsm-error-icon" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.5"/><path d="M8 5v3.5M8 11v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            {{ error }}
          </p>
        </div>
      </div>

      <!-- ═══ primitive ═══ -->
      <div *ngSwitchDefault class="jsm-field">
        <ng-container *ngIf="inputKind !== 'checkbox'">
          <label class="jsm-field-label">
            {{ schema.title || label }}<span *ngIf="required" class="jsm-required">*</span>
          </label>
          <p *ngIf="schema.description" class="jsm-field-hint">{{ schema.description }}</p>
        </ng-container>

        <div *ngIf="metaBadges.length" class="jsm-badge-row">
          <span *ngFor="let badge of metaBadges" class="jsm-badge" [ngClass]="badgeClass(badge)">{{ badge }}</span>
        </div>

        <ng-container [ngSwitch]="inputKind">
          <input *ngSwitchCase="'text'" class="jsm-input"
            [class.jsm-input--error]="errorsForPath.length && controlAsFormControl.dirty"
            [attr.type]="inputType" [attr.placeholder]="schema.title || label"
            [formControl]="controlAsFormControl" />

          <textarea *ngSwitchCase="'textarea'" rows="4" class="jsm-textarea"
            [class.jsm-textarea--error]="errorsForPath.length && controlAsFormControl.dirty"
            [attr.placeholder]="schema.title || label"
            [formControl]="controlAsFormControl"></textarea>

          <div *ngSwitchCase="'select'" class="jsm-select-wrap">
            <select class="jsm-select"
              [class.jsm-select--error]="errorsForPath.length && controlAsFormControl.dirty"
              [formControl]="controlAsFormControl">
              <option *ngFor="let option of effectiveSchema.enum" [ngValue]="option">{{ option }}</option>
            </select>
            <svg class="jsm-select-chevron" viewBox="0 0 16 16" fill="none">
              <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>

          <label *ngSwitchCase="'checkbox'" class="jsm-toggle-label">
            <span class="jsm-toggle-track" [class.jsm-on]="controlAsFormControl.value">
              <input type="checkbox" class="sr-only" [formControl]="controlAsFormControl" />
              <span class="jsm-toggle-thumb"></span>
            </span>
            <span class="jsm-toggle-text">
              {{ schema.title || label }}<span *ngIf="required" class="jsm-required">*</span>
            </span>
          </label>
        </ng-container>

        <p *ngIf="inputKind === 'checkbox' && schema.description" class="jsm-field-hint">{{ schema.description }}</p>
        <p *ngIf="effectiveSchema.examples?.length" class="jsm-example">e.g. {{ effectiveSchema.examples?.[0] }}</p>
        <p *ngIf="effectiveSchema.contentMediaType" class="jsm-example">
          {{ effectiveSchema.contentMediaType }}<span *ngIf="effectiveSchema.contentEncoding"> ({{ effectiveSchema.contentEncoding }})</span>
        </p>

        <div *ngIf="errorsForPath.length && controlAsFormControl.dirty" class="jsm-error-list">
          <p *ngFor="let error of errorsForPath" class="jsm-error-msg">
            <svg class="jsm-error-icon" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.5"/>
              <path d="M8 5v3.5M8 11v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            {{ error }}
          </p>
        </div>
      </div>

    </ng-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonSchemaNodeComponent implements OnInit, OnDestroy {
  @Input({ required: true }) schema!: JsonSchema;
  @Input({ required: true }) control!: AbstractControl;
  @Input() label = '';
  @Input() required = false;
  @Input() path = '';
  @Input() errorsMap = new Map<string, string[]>();
  @Input() parent?: FormGroup | FormArray;
  @Input() controlKey?: string | number;
  @Input() allowAdditionalProperties = false;

  @Output() controlReplaced = new EventEmitter<AbstractControl>();

  selectedOneOf = 0;
  selectedAnyOf = new Set<number>();
  newPropertyKey = '';
  propertyError = '';

  private valueSub?: Subscription;

  constructor(
    private readonly schemaService: JsonSchemaFormService,
    private readonly validation: JsonSchemaValidationService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    if (this.schema.anyOf?.length) this.selectedAnyOf.add(0);
    // Subscribe to value changes to trigger CD for OnPush (needed for toggle visual state)
    this.valueSub = this.control.valueChanges.subscribe(() => this.cdr.markForCheck());
  }

  ngOnDestroy(): void {
    this.valueSub?.unsubscribe();
  }

  isSimpleChild(key: string): boolean {
    const s = this.schemaForKey(key);
    if (s.oneOf?.length || s.anyOf?.length || s.allOf?.length) return false;
    const t = this.schemaService.resolveType(s);
    return t !== 'object' && t !== 'array';
  }

  badgeClass(badge: string): string {
    if (badge === 'Deprecated') return 'jsm-badge--deprecated';
    if (badge === 'Read-only' || badge === 'Nullable') return 'jsm-badge--readonly';
    if (badge === 'Write-only') return 'jsm-badge--writeonly';
    if (badge === 'Not constraint') return 'jsm-badge--not';
    return 'jsm-badge--nullable';
  }

  get nodeKind(): 'oneOf' | 'anyOf' | 'allOf' | 'object' | 'array' | 'primitive' {
    if (this.schema.oneOf?.length) return 'oneOf';
    if (this.schema.anyOf?.length) return 'anyOf';
    if (this.schema.allOf?.length) return 'allOf';
    const r = this.resolvedType;
    if (r === 'object') return 'object';
    if (r === 'array') return 'array';
    return 'primitive';
  }

  get resolvedType(): JsonSchema['type'] | 'enum' {
    return this.schemaService.resolveType(this.effectiveSchema) ?? 'string';
  }

  get inputKind(): 'text' | 'textarea' | 'select' | 'checkbox' {
    if (this.effectiveSchema.enum) return 'select';
    if (this.resolvedType === 'boolean') return 'checkbox';
    if (this.effectiveSchema.format === 'textarea' || (this.effectiveSchema.maxLength ?? 0) > 200) return 'textarea';
    return 'text';
  }

  get inputType(): string {
    if (this.effectiveSchema.format === 'email') return 'email';
    if (this.effectiveSchema.format === 'date') return 'date';
    if (this.effectiveSchema.format === 'time') return 'time';
    if (this.effectiveSchema.format === 'date-time') return 'datetime-local';
    if (this.resolvedType === 'number' || this.resolvedType === 'integer') return 'number';
    if (this.effectiveSchema.format === 'password') return 'password';
    return 'text';
  }

  get controlAsGroup(): FormGroup { return this.control as FormGroup; }
  get controlAsFormControl(): FormControl { return this.control as FormControl; }
  get controlAsArray(): FormArray { return this.control as FormArray; }
  get arrayControls(): AbstractControl[] { return this.controlAsArray.controls; }
  get objectKeys(): string[] { return Object.keys(this.controlAsGroup.controls); }
  get simpleKeys(): string[] { return this.objectKeys.filter(k => this.isSimpleChild(k)); }
  get complexKeys(): string[] { return this.objectKeys.filter(k => !this.isSimpleChild(k)); }
  get canAddProperty(): boolean {
    if (!this.allowAdditionalProperties) return false;
    return this.effectiveSchema.additionalProperties !== false || !!this.effectiveSchema.patternProperties;
  }
  get errorsForPath(): string[] { return this.errorsMap.get(this.path) ?? []; }
  get metaBadges(): string[] {
    const b: string[] = [];
    if (this.effectiveSchema.deprecated) b.push('Deprecated');
    if (this.effectiveSchema.readOnly) b.push('Read-only');
    if (this.effectiveSchema.writeOnly) b.push('Write-only');
    if (this.effectiveSchema.nullable) b.push('Nullable');
    if (this.effectiveSchema.not) b.push('Not constraint');
    return b;
  }

  get activeVariant(): JsonSchema | null {
    if (this.schema.oneOf?.length) return this.schema.oneOf[this.selectedOneOf] ?? null;
    if (this.schema.anyOf?.length) {
      const sel = Array.from(this.selectedAnyOf).map(i => this.schema.anyOf![i]);
      return sel.length ? this.mergeSchemas(sel) : this.schema.anyOf[0] ?? null;
    }
    if (this.schema.allOf?.length) return this.mergeSchemas([this.schema, ...this.schema.allOf]);
    return this.effectiveSchema;
  }

  get mergedAllOf(): JsonSchema[] {
    return this.schema.allOf?.length ? [this.schema, ...this.schema.allOf] : [this.schema];
  }

  isRequired(key: string): boolean { return this.effectiveSchema.required?.includes(key) ?? false; }

  schemaForKey(key: string): JsonSchema {
    return this.effectiveSchema.properties?.[key] ?? this.schemaService.resolveDynamicSchema(this.effectiveSchema, key) ?? {};
  }

  isDynamicKey(key: string): boolean { return !this.effectiveSchema.properties?.[key]; }

  pathForChild(key: string | number): string {
    return this.path === '' ? `/${key}` : `${this.path}/${key}`;
  }

  addDynamicProperty(): void {
    this.propertyError = '';
    const key = this.newPropertyKey.trim();
    if (!key) { this.propertyError = 'Property name is required.'; return; }
    if (this.effectiveSchema.propertyNames) {
      if (this.validation.validate(this.effectiveSchema.propertyNames, key).length) {
        this.propertyError = 'Property name does not match schema constraints.'; return;
      }
    }
    if (this.controlAsGroup.contains(key)) { this.propertyError = 'Property already exists.'; return; }
    const s = this.schemaService.resolveDynamicSchema(this.effectiveSchema, key);
    if (!s) { this.propertyError = 'This property is not allowed by the schema.'; return; }
    this.controlAsGroup.addControl(key, this.schemaService.buildControl(s, undefined, false));
    this.newPropertyKey = '';
  }

  removeDynamicKey(key: string): void { this.controlAsGroup.removeControl(key); }

  schemaForIndex(index: number): JsonSchema {
    const p = this.effectiveSchema.prefixItems ?? [];
    if (p[index]) return p[index];
    if (this.effectiveSchema.items && this.effectiveSchema.items !== true) return this.effectiveSchema.items as JsonSchema;
    if (this.effectiveSchema.additionalItems && this.effectiveSchema.additionalItems !== true) return this.effectiveSchema.additionalItems as JsonSchema;
    if (this.effectiveSchema.unevaluatedItems && this.effectiveSchema.unevaluatedItems !== true) return this.effectiveSchema.unevaluatedItems as JsonSchema;
    return {};
  }

  get canAddArrayItem(): boolean {
    return !(this.effectiveSchema.items === false || this.effectiveSchema.additionalItems === false || this.effectiveSchema.unevaluatedItems === false);
  }

  addArrayItem(): void {
    if (!this.canAddArrayItem) return;
    const fa = this.controlAsArray;
    fa.push(this.schemaService.buildControl(this.schemaForIndex(fa.length), undefined, false));
    fa.markAsDirty();
  }

  removeArrayItem(index: number): void {
    this.controlAsArray.removeAt(index);
    this.controlAsArray.markAsDirty();
  }

  onOneOfChange(): void {
    if (!this.activeVariant) return;
    this.replaceControl(this.schemaService.buildControl(this.activeVariant, this.control.value, this.required));
  }

  toggleAnyOf(index: number): void {
    if (this.selectedAnyOf.has(index)) this.selectedAnyOf.delete(index);
    else this.selectedAnyOf.add(index);
    const v = this.activeVariant;
    if (v) this.replaceControl(this.schemaService.buildControl(v, this.control.value, this.required));
  }

  private replaceControl(control: AbstractControl): void {
    if (this.parent) {
      if (this.parent instanceof FormGroup && typeof this.controlKey === 'string') this.parent.setControl(this.controlKey, control);
      if (this.parent instanceof FormArray && typeof this.controlKey === 'number') this.parent.setControl(this.controlKey, control);
      this.control = control; return;
    }
    this.control = control;
    this.controlReplaced.emit(control);
  }

  childControl(key: string): AbstractControl { return this.controlAsGroup.get(key) as AbstractControl; }

  get effectiveSchema(): JsonSchema {
    let s = this.schema;
    if (s.allOf?.length) s = this.mergeSchemas([s, ...s.allOf]);
    s = this.applyConditional(s);
    s = this.applyDependencies(s);
    return s;
  }

  private applyConditional(schema: JsonSchema): JsonSchema {
    if (!schema.if) return schema;
    const errors = this.validation.validate(schema.if, this.control.value);
    const branch = errors.length === 0 ? schema.then : schema.else;
    if (!branch) return schema;
    return this.mergeSchemas([schema, branch]);
  }

  private applyDependencies(schema: JsonSchema): JsonSchema {
    const value = this.control.value;
    if (!value || typeof value !== 'object' || Array.isArray(value)) return schema;
    let merged = { ...schema } as JsonSchema;
    const keys = Object.keys(value as Record<string, unknown>);
    if (schema.dependentRequired) {
      for (const k of keys) { const r = schema.dependentRequired[k]; if (r?.length) merged = this.mergeSchemas([merged, { required: r }]); }
    }
    if (schema.dependentSchemas) {
      for (const k of keys) { const d = schema.dependentSchemas[k]; if (d) merged = this.mergeSchemas([merged, d]); }
    }
    if (schema.dependencies) {
      for (const k of keys) {
        const d = schema.dependencies[k];
        if (Array.isArray(d)) merged = this.mergeSchemas([merged, { required: d }]);
        else if (d) merged = this.mergeSchemas([merged, d]);
      }
    }
    return merged;
  }

  private mergeSchemas(schemas: JsonSchema[]): JsonSchema {
    return schemas.reduce((acc, s) => ({
      ...acc, ...s,
      properties: { ...(acc.properties ?? {}), ...(s.properties ?? {}) },
      patternProperties: { ...(acc.patternProperties ?? {}), ...(s.patternProperties ?? {}) },
      required: Array.from(new Set([...(acc.required ?? []), ...(s.required ?? [])])),
      ...(acc.type && s.type ? {
        type: Array.from(new Set([
          ...(Array.isArray(acc.type) ? acc.type : [acc.type]),
          ...(Array.isArray(s.type) ? s.type : [s.type]),
        ])) as JsonSchemaType[]
      } : {}),
    }), {} as JsonSchema);
  }
}

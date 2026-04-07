import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormArray, FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { JsonSchema, JsonSchemaType } from './types';
import { JsonSchemaFormService } from './json-schema-form.service';
import { JsonSchemaValidationService } from './json-schema-validation.service';

@Component({
  selector: 'jsm-schema-node',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <ng-container [ngSwitch]="nodeKind">

      <!-- ═══════════════════════════════════════════════════════════
           oneOf — tab bar: ogni opzione è una tab, nessuna icona
           ═══════════════════════════════════════════════════════════ -->
      <div *ngSwitchCase="'oneOf'" class="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div class="flex items-start justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
          <div>
            <p class="text-sm font-semibold text-slate-800 dark:text-slate-200">{{ schema.title || label }}</p>
            <p *ngIf="schema.description" class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{{ schema.description }}</p>
          </div>
          <span class="ml-3 shrink-0 rounded-full bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700 dark:text-blue-400">oneOf</span>
        </div>
        <div class="flex overflow-x-auto border-b border-slate-200 dark:border-slate-700">
          <button
            *ngFor="let option of schema.oneOf; let i = index"
            type="button"
            class="px-4 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors"
            [class.border-indigo-500]="selectedOneOf === i"
            [class.text-indigo-600]="selectedOneOf === i"
            [class.dark:text-indigo-400]="selectedOneOf === i"
            [class.font-semibold]="selectedOneOf === i"
            [class.border-transparent]="selectedOneOf !== i"
            [class.text-slate-500]="selectedOneOf !== i"
            [class.dark:text-slate-400]="selectedOneOf !== i"
            (click)="selectedOneOf = i; onOneOfChange()"
          >{{ option.title || ('Option ' + (i + 1)) }}</button>
        </div>
        <div class="p-4" *ngIf="activeVariant">
          <jsm-schema-node [schema]="activeVariant" [control]="control" [parent]="parent" [controlKey]="controlKey"
            [path]="path" [errorsMap]="errorsMap" [label]="label" [required]="required"
            [allowAdditionalProperties]="allowAdditionalProperties"
            (controlReplaced)="controlReplaced.emit($event)"></jsm-schema-node>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════
           anyOf — pill toggle, nessuna icona
           ═══════════════════════════════════════════════════════════ -->
      <div *ngSwitchCase="'anyOf'" class="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div class="flex items-start justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
          <div>
            <p class="text-sm font-semibold text-slate-800 dark:text-slate-200">{{ schema.title || label }}</p>
            <p *ngIf="schema.description" class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{{ schema.description }}</p>
          </div>
          <span class="ml-3 shrink-0 rounded-full bg-violet-100 dark:bg-violet-900/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-700 dark:text-violet-400">anyOf</span>
        </div>
        <div class="flex flex-wrap gap-2 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <label
            *ngFor="let option of schema.anyOf; let i = index"
            class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium cursor-pointer transition-colors select-none"
            [class.border-indigo-400]="selectedAnyOf.has(i)"
            [class.bg-indigo-50]="selectedAnyOf.has(i)"
            [class.dark:bg-indigo-900/30]="selectedAnyOf.has(i)"
            [class.text-indigo-700]="selectedAnyOf.has(i)"
            [class.dark:text-indigo-400]="selectedAnyOf.has(i)"
            [class.border-slate-200]="!selectedAnyOf.has(i)"
            [class.dark:border-slate-600]="!selectedAnyOf.has(i)"
            [class.text-slate-600]="!selectedAnyOf.has(i)"
            [class.dark:text-slate-400]="!selectedAnyOf.has(i)"
          >
            <input type="checkbox" class="h-3.5 w-3.5 accent-indigo-600" [checked]="selectedAnyOf.has(i)" (change)="toggleAnyOf(i)" />
            {{ option.title || ('Option ' + (i + 1)) }}
          </label>
        </div>
        <div class="p-4" *ngIf="activeVariant">
          <jsm-schema-node [schema]="activeVariant" [control]="control" [parent]="parent" [controlKey]="controlKey"
            [path]="path" [errorsMap]="errorsMap" [label]="label" [required]="required"
            [allowAdditionalProperties]="allowAdditionalProperties"
            (controlReplaced)="controlReplaced.emit($event)"></jsm-schema-node>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════
           allOf — sezioni in colonna con bordo sinistro
           ═══════════════════════════════════════════════════════════ -->
      <div *ngSwitchCase="'allOf'" class="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div class="flex items-start justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
          <div>
            <p class="text-sm font-semibold text-slate-800 dark:text-slate-200">{{ schema.title || label }}</p>
            <p *ngIf="schema.description" class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{{ schema.description }}</p>
          </div>
          <span class="ml-3 shrink-0 rounded-full bg-teal-100 dark:bg-teal-900/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-teal-700 dark:text-teal-400">allOf</span>
        </div>
        <div class="p-4 space-y-4">
          <div *ngFor="let subSchema of mergedAllOf; let i = index" class="border-l-2 border-indigo-200 dark:border-indigo-700 pl-4">
            <jsm-schema-node [schema]="subSchema" [control]="control" [parent]="parent" [controlKey]="controlKey"
              [path]="path" [errorsMap]="errorsMap" [label]="subSchema.title || ('Section ' + (i + 1))" [required]="required"
              [allowAdditionalProperties]="allowAdditionalProperties"
              (controlReplaced)="controlReplaced.emit($event)"></jsm-schema-node>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════
           object — fieldset con griglia SOLO per campi primitivi.
           Logica layout:
           - I figli vengono classificati come "semplici" (primitive/enum/bool)
             o "complessi" (object/array/oneOf/anyOf/allOf).
           - I semplici vanno in griglia 2 colonne (sm:grid-cols-2).
           - I complessi vanno sempre in colonna piena (col-span-2).
           ═══════════════════════════════════════════════════════════ -->
      <fieldset *ngSwitchCase="'object'" class="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm p-4 transition-shadow focus-within:border-indigo-300 dark:focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-900/40">
        <legend class="px-2 text-sm font-bold text-slate-800 dark:text-slate-200">{{ schema.title || label }}</legend>

        <p *ngIf="schema.description" class="text-xs text-slate-500 dark:text-slate-400 mb-3 mt-1">{{ schema.description }}</p>

        <div *ngIf="metaBadges.length" class="flex flex-wrap gap-1.5 mb-3">
          <span *ngFor="let badge of metaBadges"
            class="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            [ngClass]="badgeClass(badge)">{{ badge }}</span>
        </div>

        <!-- campi semplici (string/number/bool/enum) → griglia 2 colonne -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4" [formGroup]="controlAsGroup">
          <ng-container *ngFor="let key of simpleKeys">
            <div class="flex flex-col gap-1">
              <div *ngIf="isDynamicKey(key)"
                class="flex items-center justify-between rounded-md border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 mb-1">
                <span class="font-mono text-xs text-slate-500 dark:text-slate-400">{{ key }}</span>
                <button type="button"
                  class="rounded px-1.5 py-0.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  (click)="removeDynamicKey(key)">Remove</button>
              </div>
              <jsm-schema-node
                [schema]="schemaForKey(key)"
                [control]="childControl(key)"
                [parent]="controlAsGroup"
                [controlKey]="key"
                [path]="pathForChild(key)"
                [errorsMap]="errorsMap"
                [label]="key"
                [required]="isRequired(key)"
                [allowAdditionalProperties]="allowAdditionalProperties"
                (controlReplaced)="controlReplaced.emit($event)">
              </jsm-schema-node>
            </div>
          </ng-container>
        </div>

        <!-- campi complessi (object/array/combinator) → colonna piena -->
        <div class="space-y-4 mt-4" *ngIf="complexKeys.length > 0" [formGroup]="controlAsGroup">
          <ng-container *ngFor="let key of complexKeys">
            <div class="flex flex-col gap-1">
              <div *ngIf="isDynamicKey(key)"
                class="flex items-center justify-between rounded-md border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 mb-1">
                <span class="font-mono text-xs text-slate-500 dark:text-slate-400">{{ key }}</span>
                <button type="button"
                  class="rounded px-1.5 py-0.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  (click)="removeDynamicKey(key)">Remove</button>
              </div>
              <jsm-schema-node
                [schema]="schemaForKey(key)"
                [control]="childControl(key)"
                [parent]="controlAsGroup"
                [controlKey]="key"
                [path]="pathForChild(key)"
                [errorsMap]="errorsMap"
                [label]="key"
                [required]="isRequired(key)"
                [allowAdditionalProperties]="allowAdditionalProperties"
                (controlReplaced)="controlReplaced.emit($event)">
              </jsm-schema-node>
            </div>
          </ng-container>
        </div>

        <!-- add dynamic property -->
        <div *ngIf="canAddProperty" class="mt-4 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/40 p-3 space-y-2">
          <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Add property</p>
          <div class="flex gap-2">
            <input
              class="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-3 py-1.5 text-sm shadow-sm outline-none transition hover:border-slate-400 dark:hover:border-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/40"
              [(ngModel)]="newPropertyKey" placeholder="propertyName" />
            <button type="button"
              class="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-95"
              (click)="addDynamicProperty()">Add</button>
          </div>
          <p *ngIf="propertyError" class="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
            <!-- icona errore: unico caso in cui ha senso, segnala un problema -->
            <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.5"/><path d="M8 5v3.5M8 11v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            {{ propertyError }}
          </p>
        </div>

        <div *ngIf="errorsForPath.length" class="mt-3 space-y-1">
          <p *ngFor="let error of errorsForPath" class="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
            <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.5"/><path d="M8 5v3.5M8 11v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            {{ error }}
          </p>
        </div>
      </fieldset>

      <!-- ═══════════════════════════════════════════════════════════
           array — sempre in colonna piena, items in colonna
           ═══════════════════════════════════════════════════════════ -->
      <div *ngSwitchCase="'array'" class="space-y-3">
        <div class="flex items-start justify-between gap-2">
          <div>
            <p class="text-sm font-semibold text-slate-800">
              {{ schema.title || label }}<span *ngIf="required" class="ml-0.5 text-red-500">*</span>
            </p>
            <p *ngIf="schema.description" class="text-xs text-slate-500 mt-0.5">{{ schema.description }}</p>
          </div>
          <!-- icona + nel bottone: indica l'azione "aggiungi", non decorativa -->
          <button type="button"
            class="shrink-0 flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            (click)="addArrayItem()" [disabled]="!canAddArrayItem">
            <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            Add item
          </button>
        </div>

        <div *ngIf="effectiveSchema.contains" class="rounded-md bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 text-xs text-indigo-700 dark:text-indigo-400">
          Must contain matching item(s)
          <span *ngIf="effectiveSchema.minContains"> · min {{ effectiveSchema.minContains }}</span>
          <span *ngIf="effectiveSchema.maxContains"> · max {{ effectiveSchema.maxContains }}</span>
        </div>

        <div *ngIf="metaBadges.length" class="flex flex-wrap gap-1.5">
          <span *ngFor="let badge of metaBadges"
            class="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            [ngClass]="badgeClass(badge)">{{ badge }}</span>
        </div>

        <div class="space-y-2" *ngIf="arrayControls.length > 0; else emptyArray">
          <div *ngFor="let item of arrayControls; let i = index"
            class="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-sm transition focus-within:border-indigo-300 dark:focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-900/40">
            <div class="flex items-center justify-between mb-3">
              <span class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">{{ i + 1 }}</span>
              <button type="button"
                class="rounded-md border border-red-200 dark:border-red-800 px-2 py-0.5 text-xs font-semibold text-red-600 dark:text-red-400 transition hover:bg-red-50 dark:hover:bg-red-900/20"
                (click)="removeArrayItem(i)">Remove</button>
            </div>
            <jsm-schema-node [schema]="schemaForIndex(i)" [control]="item" [parent]="controlAsArray"
              [controlKey]="i" [path]="pathForChild(i)" [errorsMap]="errorsMap" [label]="label + ' item'"
              [allowAdditionalProperties]="allowAdditionalProperties"
              (controlReplaced)="controlReplaced.emit($event)"></jsm-schema-node>
          </div>
        </div>

        <ng-template #emptyArray>
          <div class="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 py-8 text-slate-400 dark:text-slate-500 text-xs">
            No items yet — click "Add item" to start.
          </div>
        </ng-template>

        <div *ngIf="errorsForPath.length" class="space-y-1">
          <p *ngFor="let error of errorsForPath" class="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
            <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.5"/><path d="M8 5v3.5M8 11v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            {{ error }}
          </p>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════
           primitive — sempre in colonna, nessuna icona decorativa.
           Icona errore solo nei messaggi di validazione.
           Icona chevron nel select: funzionale (indica dropdown).
           ═══════════════════════════════════════════════════════════ -->
      <div *ngSwitchDefault class="space-y-1.5">
        <ng-container *ngIf="inputKind !== 'checkbox'">
          <label class="block text-[13px] font-semibold text-slate-700 dark:text-slate-300">
            {{ schema.title || label }}<span *ngIf="required" class="ml-0.5 text-red-500">*</span>
          </label>
          <p *ngIf="schema.description" class="text-xs text-slate-500 dark:text-slate-400 -mt-0.5">{{ schema.description }}</p>
        </ng-container>

        <div *ngIf="metaBadges.length" class="flex flex-wrap gap-1.5">
          <span *ngFor="let badge of metaBadges"
            class="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            [ngClass]="badgeClass(badge)">{{ badge }}</span>
        </div>

        <ng-container [ngSwitch]="inputKind">

          <input *ngSwitchCase="'text'"
            class="w-full rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-3 py-2 text-sm shadow-sm outline-none transition hover:border-slate-400 dark:hover:border-slate-500 focus:ring-2"
            [class.border-slate-300]="!(errorsForPath.length && controlAsFormControl.dirty)"
            [class.dark:border-slate-600]="!(errorsForPath.length && controlAsFormControl.dirty)"
            [class.focus:border-indigo-400]="!(errorsForPath.length && controlAsFormControl.dirty)"
            [class.focus:ring-indigo-100]="!(errorsForPath.length && controlAsFormControl.dirty)"
            [class.dark:focus:ring-indigo-900/40]="!(errorsForPath.length && controlAsFormControl.dirty)"
            [class.border-red-300]="errorsForPath.length && controlAsFormControl.dirty"
            [class.dark:border-red-700]="errorsForPath.length && controlAsFormControl.dirty"
            [class.bg-red-50]="errorsForPath.length && controlAsFormControl.dirty"
            [class.dark:bg-red-900/20]="errorsForPath.length && controlAsFormControl.dirty"
            [class.focus:border-red-400]="errorsForPath.length && controlAsFormControl.dirty"
            [class.focus:ring-red-100]="errorsForPath.length && controlAsFormControl.dirty"
            [attr.type]="inputType"
            [attr.placeholder]="schema.title || label"
            [formControl]="controlAsFormControl"
          />

          <textarea *ngSwitchCase="'textarea'" rows="4"
            class="w-full resize-y rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-3 py-2 text-sm shadow-sm outline-none transition hover:border-slate-400 dark:hover:border-slate-500 focus:ring-2"
            [class.border-slate-300]="!(errorsForPath.length && controlAsFormControl.dirty)"
            [class.dark:border-slate-600]="!(errorsForPath.length && controlAsFormControl.dirty)"
            [class.focus:border-indigo-400]="!(errorsForPath.length && controlAsFormControl.dirty)"
            [class.focus:ring-indigo-100]="!(errorsForPath.length && controlAsFormControl.dirty)"
            [class.dark:focus:ring-indigo-900/40]="!(errorsForPath.length && controlAsFormControl.dirty)"
            [class.border-red-300]="errorsForPath.length && controlAsFormControl.dirty"
            [class.dark:border-red-700]="errorsForPath.length && controlAsFormControl.dirty"
            [class.bg-red-50]="errorsForPath.length && controlAsFormControl.dirty"
            [class.dark:bg-red-900/20]="errorsForPath.length && controlAsFormControl.dirty"
            [class.focus:border-red-400]="errorsForPath.length && controlAsFormControl.dirty"
            [class.focus:ring-red-100]="errorsForPath.length && controlAsFormControl.dirty"
            [attr.placeholder]="schema.title || label"
            [formControl]="controlAsFormControl"
          ></textarea>

          <!-- select: il chevron SVG è funzionale, indica che è un dropdown -->
          <div *ngSwitchCase="'select'" class="relative">
            <select
              class="w-full appearance-none rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 pr-8 text-sm shadow-sm outline-none transition hover:border-slate-400 dark:hover:border-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/40"
              [class.border-red-300]="errorsForPath.length && controlAsFormControl.dirty"
              [class.dark:border-red-700]="errorsForPath.length && controlAsFormControl.dirty"
              [class.bg-red-50]="errorsForPath.length && controlAsFormControl.dirty"
              [class.dark:bg-red-900/20]="errorsForPath.length && controlAsFormControl.dirty"
              [formControl]="controlAsFormControl">
              <option *ngFor="let option of effectiveSchema.enum" [ngValue]="option">{{ option }}</option>
            </select>
            <svg class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500"
              viewBox="0 0 16 16" fill="none">
              <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>

          <!-- checkbox come toggle switch -->
          <label *ngSwitchCase="'checkbox'" class="inline-flex cursor-pointer items-center gap-2.5">
            <span class="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors"
              [class.bg-indigo-600]="controlAsFormControl.value"
              [class.bg-slate-300]="!controlAsFormControl.value"
              [class.dark:bg-slate-600]="!controlAsFormControl.value">
              <input type="checkbox" class="sr-only" [formControl]="controlAsFormControl" />
              <span class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
                [class.translate-x-4]="controlAsFormControl.value"
                [class.translate-x-0.5]="!controlAsFormControl.value"></span>
            </span>
            <span class="text-sm font-medium text-slate-700 dark:text-slate-300">
              {{ schema.title || label }}<span *ngIf="required" class="ml-0.5 text-red-500">*</span>
            </span>
          </label>

        </ng-container>

        <p *ngIf="inputKind === 'checkbox' && schema.description" class="text-xs text-slate-500 dark:text-slate-400">{{ schema.description }}</p>

        <p *ngIf="effectiveSchema.examples?.length" class="text-[11px] text-slate-400 dark:text-slate-500">
          e.g. {{ effectiveSchema.examples?.[0] }}
        </p>

        <p *ngIf="effectiveSchema.contentMediaType" class="text-[11px] text-slate-400 dark:text-slate-500">
          {{ effectiveSchema.contentMediaType }}<span *ngIf="effectiveSchema.contentEncoding"> ({{ effectiveSchema.contentEncoding }})</span>
        </p>

        <!-- icona errore: funzionale, segnala un problema di validazione -->
        <div *ngIf="errorsForPath.length && controlAsFormControl.dirty" class="space-y-1 pt-0.5">
          <p *ngFor="let error of errorsForPath" class="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
            <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none">
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
export class JsonSchemaNodeComponent implements OnInit {
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

  constructor(
    private readonly schemaService: JsonSchemaFormService,
    private readonly validation: JsonSchemaValidationService
  ) {}

  ngOnInit(): void {
    if (this.schema.anyOf?.length) {
      this.selectedAnyOf.add(0);
    }
  }

  /**
   * Determina se un figlio di un object è "semplice" (primitive/enum/bool),
   * quindi può stare in griglia 2-col, oppure "complesso" (object/array/combinator)
   * che deve occupare la larghezza piena.
   */
  isSimpleChild(key: string): boolean {
    const childSchema = this.schemaForKey(key);
    if (childSchema.oneOf?.length || childSchema.anyOf?.length || childSchema.allOf?.length) return false;
    const t = this.schemaService.resolveType(childSchema);
    return t !== 'object' && t !== 'array';
  }

  badgeClass(badge: string): Record<string, boolean> {
    return {
      'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400': badge === 'Deprecated',
      'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400':    badge === 'Read-only' || badge === 'Nullable',
      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400':     badge === 'Write-only',
      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400':         badge === 'Not constraint',
    };
  }

  get nodeKind(): 'oneOf' | 'anyOf' | 'allOf' | 'object' | 'array' | 'primitive' {
    if (this.schema.oneOf?.length) return 'oneOf';
    if (this.schema.anyOf?.length) return 'anyOf';
    if (this.schema.allOf?.length) return 'allOf';
    const resolved = this.resolvedType;
    if (resolved === 'object') return 'object';
    if (resolved === 'array') return 'array';
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

  get simpleKeys(): string[] {
    return this.objectKeys.filter(k => this.isSimpleChild(k));
  }

  get complexKeys(): string[] {
    return this.objectKeys.filter(k => !this.isSimpleChild(k));
  }

  get canAddProperty(): boolean {
    if (!this.allowAdditionalProperties) return false;
    return this.effectiveSchema.additionalProperties !== false || !!this.effectiveSchema.patternProperties;
  }

  get errorsForPath(): string[] { return this.errorsMap.get(this.path) ?? []; }

  get metaBadges(): string[] {
    const badges: string[] = [];
    if (this.effectiveSchema.deprecated) badges.push('Deprecated');
    if (this.effectiveSchema.readOnly) badges.push('Read-only');
    if (this.effectiveSchema.writeOnly) badges.push('Write-only');
    if (this.effectiveSchema.nullable) badges.push('Nullable');
    if (this.effectiveSchema.not) badges.push('Not constraint');
    return badges;
  }

  get activeVariant(): JsonSchema | null {
    if (this.schema.oneOf?.length) return this.schema.oneOf[this.selectedOneOf] ?? null;
    if (this.schema.anyOf?.length) {
      const selections = Array.from(this.selectedAnyOf).map((i) => this.schema.anyOf![i]);
      return selections.length ? this.mergeSchemas(selections) : this.schema.anyOf[0] ?? null;
    }
    if (this.schema.allOf?.length) return this.mergeSchemas([this.schema, ...this.schema.allOf]);
    return this.effectiveSchema;
  }

  get mergedAllOf(): JsonSchema[] {
    return this.schema.allOf?.length ? [this.schema, ...this.schema.allOf] : [this.schema];
  }

  isRequired(key: string): boolean { return this.effectiveSchema.required?.includes(key) ?? false; }

  schemaForKey(key: string): JsonSchema {
    return (
      this.effectiveSchema.properties?.[key] ??
      this.schemaService.resolveDynamicSchema(this.effectiveSchema, key) ??
      {}
    );
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
      const nameErrors = this.validation.validate(this.effectiveSchema.propertyNames, key);
      if (nameErrors.length) { this.propertyError = 'Property name does not match schema constraints.'; return; }
    }
    if (this.controlAsGroup.contains(key)) { this.propertyError = 'Property already exists.'; return; }
    const schemaForKey = this.schemaService.resolveDynamicSchema(this.effectiveSchema, key);
    if (!schemaForKey) { this.propertyError = 'This property is not allowed by the schema.'; return; }
    const control = this.schemaService.buildControl(schemaForKey, undefined, false);
    this.controlAsGroup.addControl(key, control);
    this.newPropertyKey = '';
  }

  removeDynamicKey(key: string): void { this.controlAsGroup.removeControl(key); }

  schemaForIndex(index: number): JsonSchema {
    const prefixItems = this.effectiveSchema.prefixItems ?? [];
    if (prefixItems[index]) return prefixItems[index];
    if (this.effectiveSchema.items && this.effectiveSchema.items !== true) return this.effectiveSchema.items as JsonSchema;
    if (this.effectiveSchema.additionalItems && this.effectiveSchema.additionalItems !== true) return this.effectiveSchema.additionalItems as JsonSchema;
    if (this.effectiveSchema.unevaluatedItems && this.effectiveSchema.unevaluatedItems !== true) return this.effectiveSchema.unevaluatedItems as JsonSchema;
    return {};
  }

  get canAddArrayItem(): boolean {
    return !(
      this.effectiveSchema.items === false ||
      this.effectiveSchema.additionalItems === false ||
      this.effectiveSchema.unevaluatedItems === false
    );
  }

  addArrayItem(): void {
    if (!this.canAddArrayItem) return;
    const formArray = this.controlAsArray;
    const index = formArray.length;
    formArray.push(this.schemaService.buildControl(this.schemaForIndex(index), undefined, false));
    formArray.markAsDirty();
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
    const variant = this.activeVariant;
    if (variant) this.replaceControl(this.schemaService.buildControl(variant, this.control.value, this.required));
  }

  private replaceControl(control: AbstractControl): void {
    if (this.parent) {
      if (this.parent instanceof FormGroup && typeof this.controlKey === 'string') this.parent.setControl(this.controlKey, control);
      if (this.parent instanceof FormArray && typeof this.controlKey === 'number') this.parent.setControl(this.controlKey, control);
      this.control = control;
      return;
    }
    this.control = control;
    this.controlReplaced.emit(control);
  }

  childControl(key: string): AbstractControl { return this.controlAsGroup.get(key) as AbstractControl; }

  get effectiveSchema(): JsonSchema {
    let schema = this.schema;
    if (schema.allOf?.length) schema = this.mergeSchemas([schema, ...schema.allOf]);
    schema = this.applyConditional(schema);
    schema = this.applyDependencies(schema);
    return schema;
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
    const valueKeys = Object.keys(value as Record<string, unknown>);
    if (schema.dependentRequired) {
      for (const key of valueKeys) {
        const required = schema.dependentRequired[key];
        if (required?.length) merged = this.mergeSchemas([merged, { required }]);
      }
    }
    if (schema.dependentSchemas) {
      for (const key of valueKeys) {
        const depSchema = schema.dependentSchemas[key];
        if (depSchema) merged = this.mergeSchemas([merged, depSchema]);
      }
    }
    if (schema.dependencies) {
      for (const key of valueKeys) {
        const dep = schema.dependencies[key];
        if (Array.isArray(dep)) merged = this.mergeSchemas([merged, { required: dep }]);
        else if (dep) merged = this.mergeSchemas([merged, dep]);
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

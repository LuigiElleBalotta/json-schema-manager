import { Directive, ElementRef, forwardRef, Injectable, Input, OnChanges, Renderer2, SimpleChanges } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/** Character shown between the integer and decimal part of a number. */
export type DecimalSeparator = '.' | ',';

/**
 * Options shared by every node of a form. Provided by `jsm-json-schema-form`, so each form instance has its own.
 */
@Injectable()
export class JsonSchemaFormOptions {
  decimalSeparator: DecimalSeparator = '.';
}

const COMPLETE_NUMBER = /^-?(\d+[.,]?\d*|[.,]\d+)$/;

/**
 * Keeps digits, a leading minus and a single decimal separator (written with `separator`);
 * `,` and `.` are both accepted as input.
 */
export function sanitizeNumericText(text: string, separator: DecimalSeparator): string {
  let result = '';
  let hasDecimal = false;
  for (const char of text) {
    if (char >= '0' && char <= '9') {
      result += char;
    } else if (char === '-' && result === '') {
      result += char;
    } else if ((char === ',' || char === '.') && !hasDecimal) {
      hasDecimal = true;
      result += separator;
    }
  }
  return result;
}

/** Text → model: empty → `null`, a complete number → number, anything else stays a string (validation reports it). */
export function parseNumericText(text: string): number | string | null {
  const trimmed = text.trim();
  if (trimmed === '') {
    return null;
  }
  if (COMPLETE_NUMBER.test(trimmed)) {
    return Number(trimmed.replace(',', '.'));
  }
  return trimmed;
}

/** Model → text shown in the input. */
export function formatNumeric(value: unknown, separator: DecimalSeparator): string {
  if (value === null || value === undefined) {
    return '';
  }
  return typeof value === 'number' ? String(value).replace('.', separator) : String(value);
}

/** Shows decimals with the configured separator inside messages ("must be >= 0.1" → "must be >= 0,1"). */
export function localizeNumbers(message: string, separator: DecimalSeparator): string {
  return separator === ',' ? message.replace(/(\d)\.(\d)/g, '$1,$2') : message;
}

const toParsed = (value: unknown): unknown => (typeof value === 'string' ? parseNumericText(value) : (value ?? null));

/**
 * `ControlValueAccessor` for `number`/`integer` fields. The input is a text field (`inputmode="decimal"`), so the
 * decimal comma is accepted, and the model always holds a JSON number once the text is a complete number.
 * It never writes to the control while rendering or when the text is unchanged.
 */
@Directive({
  selector: 'input[jsmNumeric]',
  standalone: true,
  host: { '(input)': 'onInput()', '(blur)': 'onBlur()' },
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => NumericInputDirective), multi: true }],
})
export class NumericInputDirective implements ControlValueAccessor, OnChanges {
  @Input() jsmDecimalSeparator: DecimalSeparator = '.';

  private _model: unknown = null;
  private _onChange: (value: unknown) => void = () => undefined;
  private _onTouched: () => void = () => undefined;

  constructor(
    private readonly _el: ElementRef<HTMLInputElement>,
    private readonly _renderer: Renderer2,
  ) {}

  private _show(text: string): void {
    this._renderer.setProperty(this._el.nativeElement, 'value', text);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['jsmDecimalSeparator'] && !changes['jsmDecimalSeparator'].firstChange && typeof this._model === 'number') {
      this._show(formatNumeric(this._model, this.jsmDecimalSeparator));
    }
  }

  writeValue(value: unknown): void {
    this._model = value ?? null;
    this._show(formatNumeric(value, this.jsmDecimalSeparator));
  }

  registerOnChange(fn: (value: unknown) => void): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this._renderer.setProperty(this._el.nativeElement, 'disabled', isDisabled);
  }

  onInput(): void {
    const input = this._el.nativeElement;
    const raw = input.value;
    const cleaned = sanitizeNumericText(raw, this.jsmDecimalSeparator);
    if (cleaned !== raw) {
      const caret = Math.max(0, (input.selectionStart ?? raw.length) - (raw.length - cleaned.length));
      input.value = cleaned;
      input.setSelectionRange(caret, caret);
    }
    this._model = parseNumericText(cleaned);
    this._onChange(this._model);
  }

  onBlur(): void {
    const input = this._el.nativeElement;
    let text = input.value.trim();
    if (text.endsWith(',') || text.endsWith('.')) {
      text = text.slice(0, -1);
    }
    if (text === '-') {
      text = '';
    }
    const parsed = parseNumericText(text);
    this._show(typeof parsed === 'number' ? formatNumeric(parsed, this.jsmDecimalSeparator) : text);
    // Update the model only when the value really changed ("13" and 13 are the same value).
    if (parsed !== toParsed(this._model)) {
      this._model = parsed;
      this._onChange(parsed);
    }
    this._onTouched();
  }
}

import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  DecimalSeparator,
  formatNumeric,
  localizeNumbers,
  NumericInputDirective,
  parseNumericText,
  sanitizeNumericText,
} from './numeric-input';

describe('numeric text helpers', () => {
  it('sanitizeNumericText keeps digits, a leading minus and one separator', () => {
    expect(sanitizeNumericText('12abc', ',')).toBe('12');
    expect(sanitizeNumericText('1-2', ',')).toBe('12');
    expect(sanitizeNumericText('-1,5', ',')).toBe('-1,5');
    expect(sanitizeNumericText('1.5', ',')).toBe('1,5');
    expect(sanitizeNumericText('1,5', '.')).toBe('1.5');
    expect(sanitizeNumericText('1,2.3', ',')).toBe('1,23');
  });

  it('sanitizeNumericText cleans pasted text like the old directive', () => {
    expect(sanitizeNumericText('€ 1.234,56', ',')).toBe('1,23456');
  });

  it('parseNumericText converts complete numbers and keeps the rest', () => {
    expect(parseNumericText('')).toBeNull();
    expect(parseNumericText('  ')).toBeNull();
    expect(parseNumericText('13')).toBe(13);
    expect(parseNumericText('0,5')).toBe(0.5);
    expect(parseNumericText('-3.25')).toBe(-3.25);
    expect(parseNumericText('3,')).toBe(3);
    expect(parseNumericText('-')).toBe('-');
  });

  it('formatNumeric shows numbers with the separator', () => {
    expect(formatNumeric(46.0707, ',')).toBe('46,0707');
    expect(formatNumeric(46.0707, '.')).toBe('46.0707');
    expect(formatNumeric(null, ',')).toBe('');
    expect(formatNumeric(undefined, ',')).toBe('');
    expect(formatNumeric('abc', ',')).toBe('abc');
  });

  it('localizeNumbers only changes decimals when the separator is a comma', () => {
    expect(localizeNumbers('must be >= 0.1', ',')).toBe('must be >= 0,1');
    expect(localizeNumbers('must be >= 0.1', '.')).toBe('must be >= 0.1');
  });
});

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, NumericInputDirective],
  template: `<input jsmNumeric type="text" [jsmDecimalSeparator]="separator" [formControl]="control" />`,
})
class HostComponent {
  separator: DecimalSeparator = ',';
  control = new FormControl<unknown>(null);
}

describe('NumericInputDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let input: HTMLInputElement;

  const render = (value: unknown, separator: DecimalSeparator = ',') => {
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    host.separator = separator;
    host.control.setValue(value);
    fixture.detectChanges();
    input = fixture.nativeElement.querySelector('input');
  };

  const type = (text: string) => {
    input.value = text;
    input.dispatchEvent(new Event('input'));
  };

  beforeEach(() => TestBed.configureTestingModule({ imports: [HostComponent] }));

  it('shows an existing number with the separator and leaves the control pristine', () => {
    render(46.0707);
    expect(input.value).toBe('46,0707');
    expect(host.control.value).toBe(46.0707);
    expect(host.control.dirty).toBeFalse();
    expect(host.control.touched).toBeFalse();
  });

  it('does not emit anything while rendering', () => {
    TestBed.configureTestingModule({});
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    host.control.setValue(13);
    const emitted: unknown[] = [];
    host.control.valueChanges.subscribe((value) => emitted.push(value));
    fixture.detectChanges();
    expect(emitted).toEqual([]);
  });

  it('writes a number to the control when a complete number is typed', () => {
    render(null);
    type('0,5');
    expect(host.control.value).toBe(0.5);
    expect(input.value).toBe('0,5');
  });

  it('accepts a dot and shows the configured separator', () => {
    render(null, ',');
    type('1.5');
    expect(host.control.value).toBe(1.5);
    expect(input.value).toBe('1,5');
  });

  it('removes characters that are not part of a number', () => {
    render(null);
    type('12a');
    expect(input.value).toBe('12');
    expect(host.control.value).toBe(12);
  });

  it('writes null when the text is emptied', () => {
    render(5);
    type('');
    expect(host.control.value).toBeNull();
  });

  it('keeps a lone minus as a string for validation', () => {
    render(null);
    type('-');
    expect(host.control.value).toBe('-');
  });

  it('removes a trailing separator on blur', () => {
    render(null);
    type('3,');
    input.dispatchEvent(new Event('blur'));
    expect(input.value).toBe('3');
    expect(host.control.value).toBe(3);
  });

  it('clears a lone minus on blur', () => {
    render(null);
    type('-');
    input.dispatchEvent(new Event('blur'));
    expect(input.value).toBe('');
    expect(host.control.value).toBeNull();
  });

  it('marks the control touched on blur without changing an unchanged value', () => {
    render(13);
    const emitted: unknown[] = [];
    host.control.valueChanges.subscribe((value) => emitted.push(value));
    input.dispatchEvent(new Event('focus'));
    input.dispatchEvent(new Event('blur'));
    expect(host.control.touched).toBeTrue();
    expect(host.control.dirty).toBeFalse();
    expect(emitted).toEqual([]);
    expect(host.control.value).toBe(13);
  });

  it('does not rewrite a legacy numeric string on blur', () => {
    render('13');
    const emitted: unknown[] = [];
    host.control.valueChanges.subscribe((value) => emitted.push(value));
    input.dispatchEvent(new Event('blur'));
    expect(emitted).toEqual([]);
  });

  it('uses a dot when configured', () => {
    render(46.0707, '.');
    expect(input.value).toBe('46.0707');
    type('2,5');
    expect(input.value).toBe('2.5');
    expect(host.control.value).toBe(2.5);
  });

  it('follows a separator change', () => {
    render(1.5, '.');
    host.separator = ',';
    fixture.detectChanges();
    expect(input.value).toBe('1,5');
  });

  it('disables the input with the control', () => {
    render(1);
    host.control.disable();
    expect(input.disabled).toBeTrue();
  });
});

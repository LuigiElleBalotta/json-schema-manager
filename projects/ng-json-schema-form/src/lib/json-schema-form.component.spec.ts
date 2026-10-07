import { ChangeDetectorRef, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JsonSchemaFormComponent } from './json-schema-form.component';
import { DecimalSeparator } from './numeric-input';
import { JsonSchema } from './types';

@Component({
  standalone: true,
  imports: [JsonSchemaFormComponent],
  template: `<jsm-json-schema-form [schema]="schema" [data]="data" [decimalSeparator]="separator"
    (valueChange)="onChange($event)"></jsm-json-schema-form>`,
})
class HostComponent {
  schema: JsonSchema = {};
  data: unknown = {};
  separator: DecimalSeparator = ',';
  emitted: Array<unknown> = [];
  /** Like the manager pages: the emitted value is fed back through `data`. */
  feedBack = false;

  onChange(value: unknown): void {
    this.emitted.push(value);
    if (this.feedBack) {
      this.data = value;
    }
  }
}

describe('JsonSchemaFormComponent numeric fields', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let form: JsonSchemaFormComponent;

  const schema: JsonSchema = {
    type: 'object',
    required: ['zoom'],
    properties: {
      zoom: { type: 'number' },
      minZoom: { type: 'number', minimum: 0.1 },
      level: { type: 'integer' },
      name: { type: 'string' },
    },
  };

  const setup = async (data: unknown, separator: DecimalSeparator = ',') => {
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    host.schema = schema;
    host.data = data;
    host.separator = separator;
    fixture.detectChanges();
    await fixture.whenStable();
    // The form is OnPush and builds asynchronously: mark it so the test renders the built form.
    fixture.debugElement.children[0].injector.get(ChangeDetectorRef).markForCheck();
    fixture.detectChanges();
    form = fixture.debugElement.children[0].componentInstance;
  };

  const inputOf = (label: string): HTMLInputElement => {
    const labels = Array.from(fixture.nativeElement.querySelectorAll('label')) as Array<HTMLLabelElement>;
    const field = labels.find((l) => l.textContent?.trim().startsWith(label))!.parentElement!;
    return field.querySelector('input') as HTMLInputElement;
  };

  const type = (label: string, text: string) => {
    const input = inputOf(label);
    input.value = text;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  beforeEach(() => TestBed.configureTestingModule({ imports: [HostComponent] }));

  it('shows numbers with the decimal comma and keeps the text type', async () => {
    await setup({ zoom: 13, minZoom: 0.5 });
    expect(inputOf('minZoom').value).toBe('0,5');
    expect(inputOf('minZoom').type).toBe('text');
    expect(inputOf('minZoom').getAttribute('inputmode')).toBe('decimal');
  });

  it('does not emit valueChange when the form is only rendered', async () => {
    await setup({ zoom: 13 });
    expect(host.emitted).toEqual([]);
  });

  it('emits numbers for typed values', async () => {
    await setup({ zoom: 13 });
    type('minZoom', '0,5');
    type('level', '4');
    expect(host.emitted[host.emitted.length - 1]).toEqual({ zoom: 13, minZoom: 0.5, level: 4, name: null });
  });

  it('emits numbers for existing string values once the form changes', async () => {
    await setup({ zoom: '13', minZoom: '5' });
    type('name', 'x');
    expect(host.emitted[host.emitted.length - 1]).toEqual({ zoom: 13, minZoom: 5, name: 'x' });
  });

  it('leaves the key out when an optional numeric field is emptied', async () => {
    await setup({ zoom: 13, minZoom: 2 });
    type('minZoom', '');
    expect(host.emitted[host.emitted.length - 1]).toEqual({ zoom: 13, name: null });
    expect(form.validate()).toBeTrue();
  });

  it('makes the form invalid when a required numeric field is emptied', async () => {
    await setup({ zoom: 13 });
    type('zoom', '');
    expect(form.validate()).toBeFalse();
    expect(fixture.nativeElement.textContent).toContain('required');
  });

  it('reports decimals typed in an integer field', async () => {
    await setup({ zoom: 13 });
    type('level', '3,5');
    expect(form.validate()).toBeFalse();
    expect(host.emitted[host.emitted.length - 1]).toEqual({ zoom: 13, level: 3.5, name: null });
  });

  it('shows decimals with a comma in validation messages', async () => {
    await setup({ zoom: 13 });
    type('minZoom', '0,05');
    form.validate();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('0,1');
    expect(fixture.nativeElement.textContent).not.toContain('0.1');
  });

  it('keeps what is typed when the parent feeds the emitted value back through data', async () => {
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    host.schema = schema;
    host.data = { zoom: 13 };
    host.feedBack = true;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.debugElement.children[0].injector.get(ChangeDetectorRef).markForCheck();
    fixture.detectChanges();
    form = fixture.debugElement.children[0].componentInstance;

    type('minZoom', '45,');
    fixture.detectChanges();
    expect(inputOf('minZoom').value).toBe('45,');
    type('minZoom', '45,5');
    fixture.detectChanges();
    expect(inputOf('minZoom').value).toBe('45,5');
    expect(host.emitted[host.emitted.length - 1]).toEqual(jasmine.objectContaining({ minZoom: 45.5 }));
  });

  it('keeps the dot with the default separator', async () => {
    await setup({ zoom: 13, minZoom: 0.5 }, '.');
    expect(inputOf('minZoom').value).toBe('0.5');
  });
});

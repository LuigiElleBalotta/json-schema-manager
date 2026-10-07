import { ChangeDetectorRef, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import * as axe from 'axe-core';
import { JsonSchemaFormComponent } from './json-schema-form.component';
import { JsonSchemaFormLabels } from './labels';
import { JsonSchema } from './types';

@Component({
  standalone: true,
  imports: [JsonSchemaFormComponent],
  template: `<jsm-json-schema-form [schema]="schema" [data]="data" [labels]="labels" [allowAdditionalProperties]="true"></jsm-json-schema-form>`,
})
class HostComponent {
  schema: JsonSchema = {};
  data: unknown = {};
  labels: Partial<JsonSchemaFormLabels> = {};
}

const schema: JsonSchema = {
  type: 'object',
  title: 'Everything',
  required: ['name', 'count'],
  properties: {
    name: { type: 'string', title: 'Name', description: 'Your full name', examples: ['Ada Lovelace'] },
    email: { type: 'string', format: 'email', title: 'Email' },
    bio: { type: 'string', format: 'textarea', title: 'Bio' },
    count: { type: 'integer', title: 'Count', minimum: 1 },
    ratio: { type: 'number', title: 'Ratio' },
    color: { type: 'string', enum: ['red', 'green'], title: 'Color' },
    active: { type: 'boolean', title: 'Active', description: 'Turns the feature on' },
    tags: { type: 'array', title: 'Tags', items: { type: 'string', title: 'Tag' } },
    address: { type: 'object', title: 'Address', properties: { street: { type: 'string', title: 'Street' } } },
    choice: {
      title: 'Choice',
      oneOf: [
        { title: 'Text', type: 'string' },
        { title: 'Number', type: 'number' },
      ],
    },
    both: {
      title: 'Both',
      allOf: [
        { type: 'object', title: 'Part one', properties: { a: { type: 'string', title: 'A' } } },
        { type: 'object', title: 'Part two', properties: { b: { type: 'string', title: 'B' } } },
      ],
    },
    multi: {
      title: 'Multi',
      anyOf: [
        { title: 'First', type: 'object', properties: { x: { type: 'string', title: 'X' } } },
        { title: 'Second', type: 'object', properties: { y: { type: 'string', title: 'Y' } } },
      ],
    },
  },
};

describe('Accessibility of the rendered form', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let form: JsonSchemaFormComponent;
  let root: HTMLElement;

  const render = async (data: unknown = { tags: ['a', 'b'] }, labels: Partial<JsonSchemaFormLabels> = {}) => {
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    host.schema = schema;
    host.data = data;
    host.labels = labels;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.debugElement.children[0].injector.get(ChangeDetectorRef).markForCheck();
    fixture.detectChanges();
    form = fixture.debugElement.children[0].componentInstance;
    root = fixture.nativeElement;
    document.body.appendChild(root);
  };

  const showErrors = () => {
    form.validate();
    fixture.detectChanges();
  };

  const labelFor = (text: string): HTMLLabelElement =>
    (Array.from(root.querySelectorAll('label.jsm-field-label')) as Array<HTMLLabelElement>).find((l) => l.textContent?.trim().startsWith(text))!;

  const accessibleName = (el: HTMLElement): string => {
    const ids = el.getAttribute('aria-labelledby');
    if (ids) {
      return ids
        .split(' ')
        .map((id) => document.getElementById(id)?.textContent?.trim() ?? '')
        .join(' ');
    }
    return el.getAttribute('aria-label') ?? el.textContent?.trim() ?? '';
  };

  beforeEach(() => TestBed.configureTestingModule({ imports: [HostComponent] }));
  afterEach(() => root?.remove());

  it('has no WCAG 2.2 A/AA violations when everything is rendered', async () => {
    await render();
    const results = await axe.run(root, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } });
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
  });

  it('has no WCAG 2.2 A/AA violations when the errors are shown', async () => {
    await render({ tags: ['a', 'b'] });
    showErrors();
    expect(root.querySelectorAll('[role="alert"]').length).toBeGreaterThan(0);
    const results = await axe.run(root, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } });
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
  });

  it('renders the entries of an allOf without recursing forever', async () => {
    await render();
    expect(labelFor('A')).toBeDefined();
    expect(labelFor('B')).toBeDefined();
  });

  it('associates every field label with its control', async () => {
    await render();
    for (const text of ['Name', 'Email', 'Bio', 'Count', 'Ratio', 'Color']) {
      const label = labelFor(text);
      const control = root.querySelector(`#${label.getAttribute('for')}`);
      expect(control).withContext(text).not.toBeNull();
      expect(label.getAttribute('for')).withContext(text).toBeTruthy();
    }
  });

  it('gives every control a unique id', async () => {
    await render();
    const ids = Array.from(root.querySelectorAll('[id]')).map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('does not repeat the label as a placeholder', async () => {
    await render();
    const controls = Array.from(root.querySelectorAll('input, textarea')) as Array<HTMLInputElement>;
    expect(controls.filter((c) => c.getAttribute('placeholder') === 'Name' || c.getAttribute('placeholder') === 'Email').length).toBe(0);
  });

  it('marks required fields with aria-required and hides the asterisk from screen readers', async () => {
    await render();
    const name = root.querySelector(`#${labelFor('Name').getAttribute('for')}`)!;
    expect(name.getAttribute('aria-required')).toBe('true');
    expect(labelFor('Name').querySelector('.jsm-required')!.getAttribute('aria-hidden')).toBe('true');
    const email = root.querySelector(`#${labelFor('Email').getAttribute('for')}`)!;
    expect(email.getAttribute('aria-required')).toBeNull();
  });

  it('links hint and example text with aria-describedby', async () => {
    await render();
    const name = root.querySelector(`#${labelFor('Name').getAttribute('for')}`)!;
    const described = name.getAttribute('aria-describedby')!.split(' ').map((id) => document.getElementById(id)?.textContent?.trim());
    expect(described[0]).toBe('Your full name');
    expect(described[1]).toContain('Ada Lovelace');
  });

  it('flags invalid fields and announces their errors', async () => {
    await render();
    const count = root.querySelector(`#${labelFor('Count').getAttribute('for')}`)!;
    expect(count.getAttribute('aria-invalid')).toBeNull();
    showErrors();
    expect(count.getAttribute('aria-invalid')).toBe('true');
    const errorId = count.getAttribute('aria-describedby')!.split(' ').pop()!;
    const error = document.getElementById(errorId)!;
    expect(error.getAttribute('role')).toBe('alert');
    expect(error.textContent).toContain('required');
  });

  it('hides decorative icons from screen readers', async () => {
    await render();
    showErrors();
    const icons = Array.from(root.querySelectorAll('svg'));
    expect(icons.length).toBeGreaterThan(0);
    expect(icons.every((svg) => svg.getAttribute('aria-hidden') === 'true')).toBeTrue();
  });

  it('exposes the oneOf options as tabs and moves between them with the arrow keys', async () => {
    await render();
    const tablist = root.querySelector('[role="tablist"]') as HTMLElement;
    const tabs = Array.from(tablist.querySelectorAll('[role="tab"]')) as Array<HTMLElement>;
    expect(tabs.map((t) => t.getAttribute('aria-selected'))).toEqual(['true', 'false']);
    expect(tabs.map((t) => t.getAttribute('tabindex'))).toEqual(['0', '-1']);
    const panel = root.querySelector('[role="tabpanel"]')!;
    expect(panel.getAttribute('aria-labelledby')).toBe(tabs[0].id);

    tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(tabs.map((t) => t.getAttribute('aria-selected'))).toEqual(['false', 'true']);

    tabs[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    fixture.detectChanges();
    expect(tabs.map((t) => t.getAttribute('aria-selected'))).toEqual(['true', 'false']);
  });

  it('names the add and remove buttons with their context', async () => {
    await render();
    const add = Array.from(root.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Add item')!;
    expect(accessibleName(add)).toBe('Add item Tags');
    const remove = Array.from(root.querySelectorAll('button')).filter((b) => /-remove-\d+$/.test(b.id));
    expect(remove.map(accessibleName)).toEqual(['Remove Item 1', 'Remove Item 2']);
    const removeKey = Array.from(root.querySelectorAll('button')).filter((b) => /-key-.*-remove$/.test(b.id));
    expect(removeKey.map(accessibleName)).toEqual(['Remove b', 'Remove a']);
  });

  it('groups the array items and the anyOf options', async () => {
    await render();
    const items = Array.from(root.querySelectorAll('.jsm-array-item')) as Array<HTMLElement>;
    expect(items.map((i) => i.getAttribute('role'))).toEqual(['group', 'group']);
    expect(document.getElementById(items[0].getAttribute('aria-labelledby')!)!.textContent).toBe('Item 1');
    expect(root.querySelector('.jsm-anyof-options')!.getAttribute('role')).toBe('group');
  });

  it('keeps targets at least 24px high', async () => {
    await render();
    const small = (Array.from(root.querySelectorAll('.jsm-btn-primary, .jsm-btn-danger, .jsm-toggle-label')) as Array<HTMLElement>).filter(
      (el) => el.getBoundingClientRect().height < 24,
    );
    expect(small.map((el) => el.className)).toEqual([]);
  });

  it('shows a visible focus indicator on controls and on the visible part of hidden checkboxes', async () => {
    await render();
    const input = root.querySelector('input.jsm-input') as HTMLInputElement;
    input.focus();
    expect(getComputedStyle(input).outlineStyle).not.toBe('none');
    const toggleInput = root.querySelector('.jsm-toggle-label input') as HTMLInputElement;
    toggleInput.focus();
    const track = root.querySelector('.jsm-toggle-track') as HTMLElement;
    expect(getComputedStyle(track).outlineStyle).not.toBe('none');
  });

  it('uses the provided labels instead of the English defaults', async () => {
    await render(
      { tags: ['a'] },
      { addItem: 'Aggiungi elemento', remove: 'Rimuovi', arrayItem: 'Elemento {n}', noItems: 'Nessun elemento', errorRequired: 'Campo obbligatorio', option: 'Opzione {n}' },
    );
    const add = Array.from(root.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Aggiungi elemento')!;
    expect(accessibleName(add)).toBe('Aggiungi elemento Tags');
    expect(Array.from(root.querySelectorAll('button')).some((b) => b.textContent?.trim() === 'Rimuovi')).toBeTrue();
    showErrors();
    expect(root.textContent).toContain('Campo obbligatorio');
    expect(root.textContent).not.toContain('Add item');
  });
});

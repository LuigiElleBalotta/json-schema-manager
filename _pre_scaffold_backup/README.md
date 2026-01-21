# Json Schema Manager (Angular 20)

A lightweight Angular 20 library to render JSON Schema as a reactive form.

## Features
- Angular 20 + Reactive Forms
- Tailwind 3/4 friendly (no CSS framework dependencies)
- Mobile-friendly layout
- Supports common JSON Schema keywords (type, properties, items, enum, required, min/max, pattern, format)

## Install
```bash
npm install @json-schema-manager/ng-json-schema-form
```

## Tailwind setup
This library only uses Tailwind utility classes. Make sure Tailwind is configured in your app (v3 or v4). Add the library to Tailwind content scanning if needed:

```js
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{html,ts}',
    './node_modules/@json-schema-manager/ng-json-schema-form/**/*.{js,mjs}',
  ],
};
```

## Usage (standalone)
```ts
import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { JsonSchemaFormComponent, JsonSchema } from '@json-schema-manager/ng-json-schema-form';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ReactiveFormsModule, JsonSchemaFormComponent],
  template: `
    <jsm-json-schema-form
      [schema]="schema"
      (formReady)="onFormReady($event)"
      (valueChange)="onValueChange($event)"
    ></jsm-json-schema-form>
  `,
})
export class AppComponent {
  schema: JsonSchema = {
    title: 'Profile',
    type: 'object',
    required: ['firstName', 'age'],
    properties: {
      firstName: { type: 'string', minLength: 2 },
      lastName: { type: 'string' },
      age: { type: 'integer', minimum: 1 },
      newsletter: { type: 'boolean', default: true },
      role: { type: 'string', enum: ['Admin', 'User'] },
    },
  };

  onFormReady(form: any) {
    // Use form in your component.
    console.log(form);
  }

  onValueChange(value: unknown) {
    console.log(value);
  }
}
```

## Usage (NgModule)
```ts
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { JsonSchemaFormModule } from '@json-schema-manager/ng-json-schema-form';

@NgModule({
  imports: [ReactiveFormsModule, JsonSchemaFormModule],
})
export class AppModule {}
```

## Supported schema keywords
- `type` (string, number, integer, boolean, object, array)
- `properties`, `required`
- `items`
- `enum`
- `minLength`, `maxLength`, `minimum`, `maximum`, `pattern`
- `format: 'email'` or `format: 'textarea'`
- `default`, `const`

## npm publish (package owner)
1) `npm login`
2) `npm version patch`
3) `npm publish --access public`

## Local build (library only)
```bash
npm install
npx ng-packagr -p ng-package.json
```

## Notes
- This library intentionally has no runtime CSS dependencies.
- Extend the schema renderer by adding keywords in `src/lib/json-schema-form.service.ts` and UI changes in `src/lib/json-schema-node.component.ts`.

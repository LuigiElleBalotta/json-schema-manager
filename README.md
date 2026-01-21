# JSON Schema Manager (Angular 20)

![CI](https://github.com/LuigiElleBalotta/json-schema-manager/actions/workflows/ci.yml/badge.svg)
![Deploy Demo](https://github.com/LuigiElleBalotta/json-schema-manager/actions/workflows/deploy-demo.yml/badge.svg)
![Release](https://github.com/LuigiElleBalotta/json-schema-manager/actions/workflows/release.yml/badge.svg)
![npm](https://img.shields.io/npm/v/@elle96/ng-json-schema-manager)


An Angular 20 library that renders JSON Schema into a reactive form, plus a demo app for testing schemas. The renderer supports legacy drafts (draft‑04/06/07) and modern drafts (2019‑09/2020‑12). If a `$schema` is missing, the library infers a best‑effort draft.

## Packages
- **Library**: `@elle96/ng-json-schema-manager`
- **Demo app**: `projects/demo`

## Features
- Reactive forms built from JSON Schema
- Best‑effort UI rendering for all JSON Schema keywords
- `$ref` resolution (local and external references)
- Draft detection for old and new schema versions
- Tailwind 3 / Tailwind 4 compatible utilities only

## Install (library only)
```bash
npm install @elle96/ng-json-schema-manager
```

## Tailwind setup (v3 or v4)
This library relies only on Tailwind utility classes. Ensure Tailwind is configured in your app and include the library in Tailwind content scanning:

```js
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{html,ts}',
    './node_modules/@elle96/ng-json-schema-manager/**/*.{js,mjs}',
  ],
};
```

For Tailwind v4 + PostCSS, Angular expects a JSON PostCSS config:
```json
// postcss.config.json
{
  "plugins": {
    "@tailwindcss/postcss": {},
    "autoprefixer": {}
  }
}
```

## Usage (standalone)
```ts
import { Component } from '@angular/core';
import { JsonSchemaFormComponent, JsonSchema } from '@elle96/ng-json-schema-manager';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [JsonSchemaFormComponent],
  template: `
    <jsm-json-schema-form
      [schema]="schema"
      [data]="initialData"
      (formReady)="form = $event"
      (schemaReady)="onSchemaReady($event)"
      (valueChange)="value = $event"
    ></jsm-json-schema-form>
  `,
})
export class AppComponent {
  form: any;
  value: unknown;
  resolvedSchema?: JsonSchema;
  initialData = { firstName: 'Sara', age: 31 };

  schema: JsonSchema = {
    title: 'Profile',
    type: 'object',
    required: ['firstName'],
    properties: {
      firstName: { type: 'string', minLength: 2 },
      age: { type: 'integer', minimum: 1 },
      role: { type: 'string', enum: ['Admin', 'User'] },
    },
  };
  onSchemaReady(schema: JsonSchema) {
    this.resolvedSchema = schema;
  }
}
```

## Usage (NgModule)
```ts
import { NgModule } from '@angular/core';
import { JsonSchemaFormModule } from '@elle96/ng-json-schema-manager';

@NgModule({
  imports: [JsonSchemaFormModule],
})
export class AppModule {}
```

## Supported keywords (UI + validation)
This renderer supports **all** core JSON Schema keywords across drafts, including:
- Types, enums, const, defaults
- Object keywords: `properties`, `patternProperties`, `additionalProperties`, `required`, `propertyNames`, `dependentSchemas`, `dependentRequired`, `dependencies`
- Array keywords: `items`, `prefixItems`, `additionalItems`, `contains`, `minItems`, `maxItems`, `uniqueItems`, `minContains`, `maxContains`
- Numeric/string constraints: `minLength`, `maxLength`, `pattern`, `minimum`, `maximum`, `exclusiveMinimum`, `exclusiveMaximum`, `multipleOf`
- Composition: `allOf`, `anyOf`, `oneOf`, `not`
- Conditional: `if` / `then` / `else`
- Metadata: `title`, `description`, `examples`, `readOnly`, `writeOnly`, `deprecated`
- Schema defs: `$ref`, `$defs`, `definitions`

External `$ref` notes:
- External refs are fetched in the browser using `fetch()`.
- The remote server must allow CORS for the demo/app origin.
- Use `$id` on the root schema to establish the base URL for relative refs.

## Loading state hook
The form emits `schemaReady` once all local/external `$ref` are resolved and the UI can be rendered. Use it to show loaders.

UI behavior notes:
- `oneOf`/`anyOf` render a selector and rebuild the subtree when you switch selections.
- `allOf` merges schemas for rendering and shows each section in order.
- `if/then/else` is evaluated on the current node value to update the rendered schema.
- `patternProperties` / `additionalProperties` allow adding dynamic keys.

## Demo app
The demo app lets you:
- Select prebuilt schemas
- Paste a custom schema
- Paste custom initial data

Run the demo (after `npm install`):
```bash
npm run start -- --project demo
```

## GitHub Pages demo
This repo ships with a GitHub Actions workflow that builds and deploys the demo to GitHub Pages.
1) Push to `main`
2) Go to repo **Settings → Pages** and select the `gh-pages` branch
3) Your demo will be available at: `https://<org>.github.io/<repo>/`

## Build the library
```bash
npm install
npm run build -- --project ng-json-schema-form
```

## Tests
```bash
npm test -- --project ng-json-schema-form
npm test -- --project demo
```

## Publish to npm
1) Update `projects/ng-json-schema-form/package.json` with:
   - `version`
   - `repository`, `bugs`, `homepage` (optional)
2) For auto-publish on release merges, add `NPM_TOKEN` in repo Secrets.
2) Login:
```bash
npm login
```
3) Build:
```bash
npm run build -- --project ng-json-schema-form
```
4) Publish from the dist output:
```bash
npm publish dist/ng-json-schema-form --access public
```

## Release workflow
Tag a version in the format `x.y.z` to trigger:
- GitHub Release creation
- Attached artifacts (library + demo)
- Optional npm publish if `NPM_TOKEN` is present

## Development notes
- Schema resolver: `projects/ng-json-schema-form/src/lib/json-schema-resolver.service.ts`
- Validation (draft detection + Ajv): `projects/ng-json-schema-form/src/lib/json-schema-validation.service.ts`
- Renderer UI: `projects/ng-json-schema-form/src/lib/json-schema-node.component.ts`
- Form builder: `projects/ng-json-schema-form/src/lib/json-schema-form.service.ts`




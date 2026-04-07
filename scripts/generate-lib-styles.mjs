/**
 * Generates bundled Tailwind CSS for the ng-json-schema-form library
 * and writes it as a TypeScript constant that gets tree-shaken into the bundle.
 *
 * Run: node scripts/generate-lib-styles.mjs
 * Called automatically before build:lib
 */
import postcss from 'postcss';
import tailwindcss from '@tailwindcss/postcss';
import { writeFileSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const inputCss = `
@import "tailwindcss";

/* Force class-based dark mode — never use prefers-color-scheme media query.
   The host app controls dark mode by adding/removing the 'dark' class on <html>. */
@custom-variant dark (&:where(.dark, .dark *));

@source "../ng-json-schema-form/src/lib/json-schema-form.component.ts";
@source "../ng-json-schema-form/src/lib/json-schema-node.component.ts";
`;

async function generate() {
  const result = await postcss([tailwindcss]).process(inputCss, {
    from: resolve(root, 'projects/virtual-input.css'),
  });

  const css = result.css;

  // Write raw CSS (for reference / debugging)
  writeFileSync(
    resolve(root, 'projects/ng-json-schema-form/src/lib/jsm-styles.css'),
    css
  );

  // Write TypeScript file with CSS as a named export
  const ts = `// AUTO-GENERATED — do not edit manually. Run: node scripts/generate-lib-styles.mjs
export const JSM_CSS: string = ${JSON.stringify(css)};
`;

  writeFileSync(
    resolve(root, 'projects/ng-json-schema-form/src/lib/jsm-styles.generated.ts'),
    ts
  );

  console.log(`✓ jsm-styles.css + jsm-styles.generated.ts (${(css.length / 1024).toFixed(1)} kB)`);
}

generate().catch(e => { console.error(e); process.exit(1); });

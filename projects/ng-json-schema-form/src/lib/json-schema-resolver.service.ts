import { Injectable } from '@angular/core';
import { JsonSchema } from './types';

@Injectable({
  providedIn: 'root',
})
export class JsonSchemaResolverService {
  async resolve(schema: JsonSchema, baseUri?: string): Promise<JsonSchema> {
    const rootBase = baseUri ?? schema.$id ?? '';
    const localCache = new Map<string, JsonSchema>();
    const externalCache = new Map<string, JsonSchema>();
    return this.resolveRefs(schema, schema, rootBase, localCache, externalCache);
  }

  private async resolveRefs(
    current: JsonSchema,
    root: JsonSchema,
    baseUri: string,
    localCache: Map<string, JsonSchema>,
    externalCache: Map<string, JsonSchema>
  ): Promise<JsonSchema> {
    if (!current || typeof current !== 'object') {
      return current;
    }

    if (current.$ref) {
      const ref = current.$ref;
      if (ref.startsWith('#/')) {
        if (localCache.has(ref)) {
          return localCache.get(ref)!;
        }
        const resolved = this.resolvePointer(root, ref);
        if (resolved) {
          localCache.set(ref, resolved);
          return this.resolveRefs(resolved, root, baseUri, localCache, externalCache);
        }
      } else {
        const resolved = await this.resolveExternalRef(ref, baseUri, externalCache, localCache);
        if (resolved) {
          return resolved;
        }
      }
    }

    const next: JsonSchema = { ...current };

    if (next.properties) {
      const entries = await Promise.all(
        Object.entries(next.properties).map(async ([key, value]) => [
          key,
          await this.resolveRefs(value, root, baseUri, localCache, externalCache),
        ])
      );
      next.properties = Object.fromEntries(entries);
    }

    if (next.patternProperties) {
      const entries = await Promise.all(
        Object.entries(next.patternProperties).map(async ([key, value]) => [
          key,
          await this.resolveRefs(value, root, baseUri, localCache, externalCache),
        ])
      );
      next.patternProperties = Object.fromEntries(entries);
    }

    if (next.items && typeof next.items === 'object') {
      next.items = await this.resolveRefs(next.items as JsonSchema, root, baseUri, localCache, externalCache);
    }

    if (next.prefixItems) {
      next.prefixItems = await Promise.all(
        next.prefixItems.map((item) => this.resolveRefs(item, root, baseUri, localCache, externalCache))
      );
    }

    if (next.additionalProperties && typeof next.additionalProperties === 'object') {
      next.additionalProperties = await this.resolveRefs(
        next.additionalProperties,
        root,
        baseUri,
        localCache,
        externalCache
      );
    }

    if (next.additionalItems && typeof next.additionalItems === 'object') {
      next.additionalItems = await this.resolveRefs(
        next.additionalItems,
        root,
        baseUri,
        localCache,
        externalCache
      );
    }

    if (next.unevaluatedProperties && typeof next.unevaluatedProperties === 'object') {
      next.unevaluatedProperties = await this.resolveRefs(
        next.unevaluatedProperties,
        root,
        baseUri,
        localCache,
        externalCache
      );
    }

    if (next.unevaluatedItems && typeof next.unevaluatedItems === 'object') {
      next.unevaluatedItems = await this.resolveRefs(next.unevaluatedItems, root, baseUri, localCache, externalCache);
    }

    if (next.contains) {
      next.contains = await this.resolveRefs(next.contains, root, baseUri, localCache, externalCache);
    }

    if (next.oneOf) {
      next.oneOf = await Promise.all(
        next.oneOf.map((item) => this.resolveRefs(item, root, baseUri, localCache, externalCache))
      );
    }

    if (next.anyOf) {
      next.anyOf = await Promise.all(
        next.anyOf.map((item) => this.resolveRefs(item, root, baseUri, localCache, externalCache))
      );
    }

    if (next.allOf) {
      next.allOf = await Promise.all(
        next.allOf.map((item) => this.resolveRefs(item, root, baseUri, localCache, externalCache))
      );
    }

    if (next.not) {
      next.not = await this.resolveRefs(next.not, root, baseUri, localCache, externalCache);
    }

    if (next.if) {
      next.if = await this.resolveRefs(next.if, root, baseUri, localCache, externalCache);
    }

    if (next.then) {
      next.then = await this.resolveRefs(next.then, root, baseUri, localCache, externalCache);
    }

    if (next.else) {
      next.else = await this.resolveRefs(next.else, root, baseUri, localCache, externalCache);
    }

    if (next.dependencies) {
      const entries = await Promise.all(
        Object.entries(next.dependencies).map(async ([key, value]) => {
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            return [key, await this.resolveRefs(value as JsonSchema, root, baseUri, localCache, externalCache)];
          }
          return [key, value];
        })
      );
      next.dependencies = Object.fromEntries(entries);
    }

    if (next.dependentSchemas) {
      const entries = await Promise.all(
        Object.entries(next.dependentSchemas).map(async ([key, value]) => [
          key,
          await this.resolveRefs(value, root, baseUri, localCache, externalCache),
        ])
      );
      next.dependentSchemas = Object.fromEntries(entries);
    }

    if (next.$defs) {
      const entries = await Promise.all(
        Object.entries(next.$defs).map(async ([key, value]) => [
          key,
          await this.resolveRefs(value, root, baseUri, localCache, externalCache),
        ])
      );
      next.$defs = Object.fromEntries(entries);
    }

    if (next.definitions) {
      const entries = await Promise.all(
        Object.entries(next.definitions).map(async ([key, value]) => [
          key,
          await this.resolveRefs(value, root, baseUri, localCache, externalCache),
        ])
      );
      next.definitions = Object.fromEntries(entries);
    }

    return next;
  }

  private async resolveExternalRef(
    ref: string,
    baseUri: string,
    externalCache: Map<string, JsonSchema>,
    localCache: Map<string, JsonSchema>
  ): Promise<JsonSchema | null> {
    try {
      const url = new URL(ref, baseUri || window.location.href).toString();
      if (externalCache.has(url)) {
        return externalCache.get(url)!;
      }

      const { schema, fragment } = await this.fetchSchema(url);
      if (!schema) {
        return null;
      }

      const target = fragment ? this.resolvePointer(schema, fragment) : schema;
      if (!target) {
        return null;
      }

      const resolved = await this.resolveRefs(target, schema, schema.$id ?? url, localCache, externalCache);
      externalCache.set(url, resolved);
      return resolved;
    } catch {
      return null;
    }
  }

  private async fetchSchema(url: string): Promise<{ schema: JsonSchema | null; fragment: string | null }> {
    const [base, hash] = url.split('#');
    const fragment = hash ? `#/${hash.replace(/^\//, '')}` : null;
    const response = await fetch(base, { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      return { schema: null, fragment: null };
    }
    const schema = (await response.json()) as JsonSchema;
    return { schema, fragment };
  }

  private resolvePointer(root: JsonSchema, ref: string): JsonSchema | null {
    const pointer = ref.replace(/^#\//, '');
    const parts = pointer.split('/').map((part) => part.replace(/~1/g, '/').replace(/~0/g, '~'));
    let current: any = root;
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return null;
      }
    }
    return current as JsonSchema;
  }
}

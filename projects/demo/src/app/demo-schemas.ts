import { JsonSchema } from '@elle96/ng-json-schema-manager';

export interface DemoSchema {
  id: string;
  name: string;
  description: string;
  schema: JsonSchema;
  data: unknown;
}

export const DEMO_SCHEMAS: DemoSchema[] = [
  {
    id: 'profile',
    name: 'Profile (Draft 2020-12)',
    description: 'Common fields, arrays, enums, and formats.',
    schema: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      title: 'Profile',
      type: 'object',
      required: ['firstName', 'age', 'contact'],
      properties: {
        firstName: { type: 'string', minLength: 2 },
        lastName: { type: 'string' },
        age: { type: 'integer', minimum: 1 },
        role: { type: 'string', enum: ['Admin', 'User', 'Guest'] },
        contact: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
          },
        },
        tags: {
          type: 'array',
          minItems: 1,
          items: { type: 'string' },
        },
      },
    },
    data: {
      firstName: 'Mina',
      lastName: 'Okafor',
      age: 32,
      role: 'Admin',
      contact: { email: 'mina@example.com' },
      tags: ['engineering', 'lead'],
    },
  },
  {
    id: 'conditional',
    name: 'Conditional Schema (Draft 2019-09)',
    description: 'if/then/else with dependentRequired.',
    schema: {
      $schema: 'https://json-schema.org/draft/2019-09/schema',
      title: 'Shipping',
      type: 'object',
      properties: {
        deliveryMethod: { type: 'string', enum: ['pickup', 'ship'] },
        address: { type: 'string' },
        pickupCode: { type: 'string' },
      },
      if: {
        properties: { deliveryMethod: { const: 'ship' } },
        required: ['deliveryMethod'],
      },
      then: {
        required: ['address'],
      },
      else: {
        required: ['pickupCode'],
      },
      dependentRequired: {
        address: ['deliveryMethod'],
      },
    },
    data: {
      deliveryMethod: 'ship',
      address: '221B Baker Street',
    },
  },
  {
    id: 'catalog',
    name: 'Catalog (Draft-07 with definitions)',
    description: 'oneOf + definitions + patternProperties.',
    schema: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      title: 'Catalog',
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            oneOf: [
              { $ref: '#/definitions/book' },
              { $ref: '#/definitions/movie' },
            ],
          },
        },
        metadata: {
          type: 'object',
          patternProperties: {
            '^x-': { type: 'string' },
          },
          additionalProperties: false,
        },
      },
      definitions: {
        book: {
          title: 'Book',
          type: 'object',
          required: ['title', 'author'],
          properties: {
            title: { type: 'string' },
            author: { type: 'string' },
            pages: { type: 'integer', minimum: 1 },
          },
        },
        movie: {
          title: 'Movie',
          type: 'object',
          required: ['title', 'director'],
          properties: {
            title: { type: 'string' },
            director: { type: 'string' },
            duration: { type: 'integer', minimum: 30 },
          },
        },
      },
    },
    data: {
      items: [{ title: 'Dune', author: 'Frank Herbert', pages: 412 }],
      metadata: { 'x-shelf': 'A3' },
    },
  },
  {
    id: 'dependent',
    name: 'Dependencies (Draft-04)',
    description: 'Old draft with dependencies array + schema.',
    schema: {
      $schema: 'http://json-schema.org/draft-04/schema#',
      title: 'Legacy Dependencies',
      type: 'object',
      properties: {
        creditCard: { type: 'string' },
        billingAddress: { type: 'string' },
        company: { type: 'string' },
        vatId: { type: 'string' },
      },
      dependencies: {
        creditCard: ['billingAddress'],
        company: {
          properties: {
            vatId: { type: 'string', minLength: 6 },
          },
          required: ['vatId'],
        },
      },
    },
    data: {
      creditCard: '4111 1111 1111 1111',
      billingAddress: '123 Main St',
      company: 'Acme Inc',
      vatId: 'VAT12345',
    },
  },
  {
    id: 'anyof',
    name: 'AnyOf (No $schema)',
    description: 'Schema without $schema using anyOf across multiple types.',
    schema: {
      title: 'Flexible Contact',
      anyOf: [
        {
          title: 'Email',
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email' },
          },
        },
        {
          title: 'Phone',
          type: 'object',
          required: ['phone'],
          properties: {
            phone: { type: 'string', minLength: 8 },
          },
        },
      ],
    },
    data: {
      email: 'team@example.com',
    },
  },
];


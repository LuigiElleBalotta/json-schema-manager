/**
 * Texts shown by the form. Every value can be overridden through the `labels` input of `jsm-json-schema-form`
 * (e.g. to translate them); omitted keys keep the English default.
 * `{n}` and `{name}` placeholders are replaced with the item number / field name.
 */
export interface JsonSchemaFormLabels {
  /** Title used when the schema has none. */
  formTitle: string;
  resolving: string;
  schemaErrorsTitle: string;
  schemaErrorsHint: string;

  addItem: string;
  /** Hidden name of an array item, announced by screen readers ("Item {n}"). */
  arrayItem: string;
  remove: string;
  add: string;
  addProperty: string;
  propertyName: string;
  noItems: string;
  mustContain: string;
  min: string;
  max: string;
  /** "Option {n}" for oneOf/anyOf entries without a title. */
  option: string;
  /** "Section {n}" for allOf entries without a title. */
  section: string;
  example: string;

  propertyNameRequired: string;
  propertyNameInvalid: string;
  propertyExists: string;
  propertyNotAllowed: string;

  errorRequired: string;
  errorMinLength: string;
  errorMaxLength: string;
  errorMin: string;
  errorMax: string;
  errorEmail: string;
  errorPattern: string;
  errorInteger: string;
  errorExclusiveMin: string;
  errorExclusiveMax: string;
  errorMultipleOf: string;
  errorMinItems: string;
  errorMaxItems: string;
  errorUniqueItems: string;
}

export const DEFAULT_LABELS: JsonSchemaFormLabels = {
  formTitle: 'Form',
  resolving: 'Resolving schema…',
  schemaErrorsTitle: 'Schema errors',
  schemaErrorsHint: 'The schema has structural issues. Fix them to get a valid form.',

  addItem: 'Add item',
  arrayItem: 'Item {n}',
  remove: 'Remove',
  add: 'Add',
  addProperty: 'Add property',
  propertyName: 'Property name',
  noItems: 'No items yet — click "Add item" to start.',
  mustContain: 'Must contain matching item(s)',
  min: 'min {n}',
  max: 'max {n}',
  option: 'Option {n}',
  section: 'Section {n}',
  example: 'e.g.',

  propertyNameRequired: 'Property name is required.',
  propertyNameInvalid: 'Property name does not match schema constraints.',
  propertyExists: 'Property already exists.',
  propertyNotAllowed: 'This property is not allowed by the schema.',

  errorRequired: 'This field is required',
  errorMinLength: 'Minimum length is {n}',
  errorMaxLength: 'Maximum length is {n}',
  errorMin: 'Minimum value is {n}',
  errorMax: 'Maximum value is {n}',
  errorEmail: 'Invalid email address',
  errorPattern: 'Value does not match the required pattern',
  errorInteger: 'Value must be an integer',
  errorExclusiveMin: 'Value must be greater than the minimum',
  errorExclusiveMax: 'Value must be less than the maximum',
  errorMultipleOf: 'Value must be a multiple of the required number',
  errorMinItems: 'Minimum {n} items required',
  errorMaxItems: 'Maximum {n} items allowed',
  errorUniqueItems: 'Items must be unique',
};

/** Replaces `{key}` placeholders in a label template. */
export function formatLabel(template: string, values: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}

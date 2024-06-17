import { describe, expect, it } from 'vitest';
import { normalizeDescriptions, SchemaTranslations, translateRelation, tsType } from '../src/translations';
import { CollectionDescription, ExtendedSchemaField } from '../src/types';

function mockField(type: string, options = {}) {
  return {
    type,
    options,
    id: 'test',
    system: false,
    required: false,
    presentable: false,
    name: 'test',
  };
}

function mockExtendedField(type: string, options = {}): ExtendedSchemaField {
  const field = mockField(type, options);

  return {
    ...field,
    tsType: tsType(field),
  };
}

const schema: CollectionDescription = {
  id: 'sauce11234',
  name: 'sauces',
  type: 'collection',
  schema: [
    {
      id: 'abc123',
      name: 'flavor',
      type: 'relation',
      tsType: '%%relation:flavors',
      required: false,
      system: false,
      presentable: false,
      options: {},
    },
  ],
};

describe('translations', () => {
  describe('tsType', () => {
    it('should translate types', async () => {
      expect(tsType(mockField('text'))).toBe('string');
      expect(tsType(mockField('date'))).toBe('Date');
      expect(tsType(mockField('select'))).toBe('unknown');
      expect(tsType(mockField('not a type'))).toBe('unknown');

      expect(tsType(mockField('select', { values: ['optionA', 'optionB'] }))).toBe("'optionA' | 'optionB'");
      expect(tsType(mockField('relation', { collectionId: 'test' }))).toBe('%%relation:test');
    });
  });

  describe('normalizeDescriptions', () => {
    it('should return an empty object for an empty array', async () => {
      expect(normalizeDescriptions([])).toEqual([]);
    });

    it('should return an empty object for a non-array argument', async () => {
      // @ts-expect-error - testing invalid input
      expect(normalizeDescriptions('asdf')).toEqual([]);
    });
  });

  describe('translateRelation', () => {
    it('should translate a relation', async () => {
      const field = mockExtendedField('relation', { collectionId: 'sauce11234' });
      const ts = tsType(field);
      expect(ts).toBe('%%relation:sauce11234');
      const schemas: SchemaTranslations = {
        sauce11234: { name: 'sauces', schema: schema.schema },
      };

      const translated = translateRelation(field, schemas);
      expect(translated.tsType).toBe('SaucesCollection');
    });

    it('should substitute unknown when relation not found', async () => {
      const field = mockExtendedField('relation', { collectionId: 'no sauce' });
      const ts = tsType(field);
      expect(ts).toBe('%%relation:no sauce');
      const schemas: SchemaTranslations = {
        sauce11234: { name: 'sauces', schema: schema.schema },
      };

      const translated = translateRelation(field, schemas);
      expect(translated.tsType).toBe('unknown');
    });
  });
});

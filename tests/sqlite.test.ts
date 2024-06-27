import { describe, expect, it } from 'vitest';
import { readCollections } from '../src/sqlite';

describe('sqlite', () => {
  it('should throw when file does not exist', async () => {
    expect(() => readCollections('asdf')).rejects.toThrowError('File not found: asdf');
  });

  it('should error when not a valid db', async () => {
    expect(() => readCollections('tests/fixtures/not-a-db.db')).rejects.toThrowError(/SQLITE_NOTADB/);
  });

  it('should read collections from db', async () => {
    const collections = await readCollections('tests/fixtures/data.db');
    expect(collections).toMatchSnapshot();
  });
});

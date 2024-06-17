import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ADMIN_IDENTITY, ERROR_IDENTITY, NOT_EMAIL_IDENTITY, setupServer } from './fixtures/mockApi';
import { connectDatabase } from '../src/api';

describe('sqlite', () => {
  const server = setupServer();
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterAll(() => server.close());

  describe('connectDatabase', () => {
    it('should connect to the database', async () => {
      const client = await connectDatabase('http://127.0.0.1:8090', ADMIN_IDENTITY, 'some nonsense');
      expect(client).toBeDefined();
    });

    it('should not connect to the database with wrong password', async () => {
      const auth = () => connectDatabase('http://127.0.0.1:8090/', 'scary hacker', 'nope');
      expect(auth).rejects.toThrowError('Failed to authenticate admin user');
    });

    it('should handle server errors', async () => {
      const auth = () => connectDatabase('http://127.0.0.1:8090/', ERROR_IDENTITY, 'nope');
      expect(auth).rejects.toThrowError(/Something went wrong/);
    });

    it('should handle invalid email', async () => {
      const auth = () => connectDatabase('http://127.0.0.1:8090/', NOT_EMAIL_IDENTITY, 'nope');
      expect(auth).rejects.toThrowError(/Something went wrong/);
    });
  });
});

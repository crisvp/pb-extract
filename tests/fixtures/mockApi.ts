import { setupServer as mswSetupServer } from 'msw/node';
import { http, HttpResponse, bypass } from 'msw';

export const ADMIN_IDENTITY = 'test@example.com';
export const ERROR_IDENTITY = '_ERROR';
export const NOT_EMAIL_IDENTITY = 'not-an-email';

import util from 'util';

function fauxthenticate(identity: string) {
  const successful = {
    admin: {
      id: 'vmbkk4rlpo1no9s',
      created: '2024-06-17 17:33:52.029Z',
      updated: '2024-06-17 17:33:52.029Z',
      avatar: 0,
      email: identity,
    },
    token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MTk4NTg5NTAsImlkIjoidm1ia2s0cmxwbzFubzlzIiwidHlwZSI6ImFkbWluIn0.kbWV_9ERISl6GZ6xjYnURUwz5EKJGHxQ4ST70cvEpgA',
  };

  if (identity === ADMIN_IDENTITY) {
    return [successful, { status: 200 }];
  } else if (identity === ERROR_IDENTITY) {
    return [{}, { status: 500 }];
  } else if (identity === NOT_EMAIL_IDENTITY) {
    return [invalidEmailResponse, { status: 400 }];
  } else {
    return [{}, { status: 401 }];
  }
}

const invalidEmailResponse = {
  code: 400,
  message: 'Something went wrong while processing your request.',
  data: {
    identity: {
      code: 'validation_is_email',
      message: 'Must be a valid email address.',
    },
  },
};

const restHandlers = [
  http.post('http://*:8090/api/admins/auth-with-password', async ({ request }) => {
    const requestBody = (await request.json()) as {
      identity: string;
      password: string;
    };
    const { identity } = requestBody;
    const response = fauxthenticate(identity);
    return HttpResponse.json(...response);
  }),
  http.get('http://*:8090/api/collections', async ({ request }) => {
    const collections = (await import('./collections.response.ts')).default;
    return HttpResponse.json(collections);
  }),
];

export function setupServer() {
  return mswSetupServer(...restHandlers);
}

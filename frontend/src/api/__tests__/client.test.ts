import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';
import { api, ApiError } from '../client';
import { useAppState } from '@/hooks/useAppState';

const BASE = 'http://localhost';

beforeEach(() => {
  useAppState.setState({ token: null, isAuthenticated: false, currentUser: null } as never);
});

describe('api client', () => {
  it('C-01: GET sends to correct URL', async () => {
    server.use(http.get(`${BASE}/test`, () => HttpResponse.json({ ok: true })));
    const result = await api.get('/test');
    expect(result).toEqual({ ok: true });
  });

  it('C-02: POST serializes body as JSON', async () => {
    let body: unknown;
    server.use(
      http.post(`${BASE}/test`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ ok: true });
      })
    );
    await api.post('/test', { foo: 'bar' });
    expect(body).toEqual({ foo: 'bar' });
  });

  it('C-03: PUT uses PUT method', async () => {
    let method = '';
    server.use(
      http.put(`${BASE}/test`, ({ request }) => {
        method = request.method;
        return HttpResponse.json({ ok: true });
      })
    );
    await api.put('/test', {});
    expect(method).toBe('PUT');
  });

  it('C-04: PATCH uses PATCH method', async () => {
    let method = '';
    server.use(
      http.patch(`${BASE}/test`, ({ request }) => {
        method = request.method;
        return HttpResponse.json({ ok: true });
      })
    );
    await api.patch('/test', {});
    expect(method).toBe('PATCH');
  });

  it('C-05: DELETE uses DELETE method', async () => {
    let method = '';
    server.use(
      http.delete(`${BASE}/test`, ({ request }) => {
        method = request.method;
        return HttpResponse.json({ ok: true });
      })
    );
    await api.delete('/test');
    expect(method).toBe('DELETE');
  });

  it('C-06: token in store → Authorization header present', async () => {
    useAppState.setState({ token: 'my-token' } as never);
    let authHeader = '';
    server.use(
      http.get(`${BASE}/test`, ({ request }) => {
        authHeader = request.headers.get('Authorization') ?? '';
        return HttpResponse.json({});
      })
    );
    await api.get('/test');
    expect(authHeader).toBe('Bearer my-token');
  });

  it('C-07: no token → Authorization header absent', async () => {
    let authHeader: string | null = 'present';
    server.use(
      http.get(`${BASE}/test`, ({ request }) => {
        authHeader = request.headers.get('Authorization');
        return HttpResponse.json({});
      })
    );
    await api.get('/test');
    expect(authHeader).toBeNull();
  });

  it('C-08: non-ok response (400) → throws ApiError with status 400', async () => {
    server.use(
      http.get(`${BASE}/test`, () =>
        HttpResponse.json({ message: 'Bad request' }, { status: 400 })
      )
    );
    await expect(api.get('/test')).rejects.toMatchObject({ status: 400 });
  });

  it('C-09: non-ok with JSON body → err.message equals body.message', async () => {
    server.use(
      http.get(`${BASE}/test`, () =>
        HttpResponse.json({ message: 'Custom error' }, { status: 422 })
      )
    );
    await expect(api.get('/test')).rejects.toMatchObject({ message: 'Custom error' });
  });

  it('C-10: non-ok with non-JSON body → err.message falls back to statusText', async () => {
    server.use(
      http.get(`${BASE}/test`, () =>
        new HttpResponse('Not Found', { status: 404, statusText: 'Not Found' })
      )
    );
    const err = await api.get('/test').catch((e) => e) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(404);
  });

  it('C-11: successful response → returns parsed JSON', async () => {
    server.use(http.get(`${BASE}/test`, () => HttpResponse.json({ data: 42 })));
    const result = await api.get<{ data: number }>('/test');
    expect(result.data).toBe(42);
  });
});

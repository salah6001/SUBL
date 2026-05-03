import { http, HttpResponse } from 'msw';

const BASE = 'http://localhost';

export const handlers = [
  // Auth
  http.post(`${BASE}/auth/login`, () =>
    HttpResponse.json({ token: 'test-token', user: { id: '1', name: 'John Doe', email: 'john@test.com', phone: '123', avatar: '' } })
  ),
  http.post(`${BASE}/auth/register`, () =>
    HttpResponse.json({ token: 'test-token', user: { id: '1', name: 'John Doe', email: 'john@test.com', phone: '123', avatar: '' } })
  ),
  http.post(`${BASE}/auth/forgot-password`, () =>
    HttpResponse.json({ message: 'Code sent' })
  ),
  http.post(`${BASE}/auth/verify-code`, () =>
    HttpResponse.json({ message: 'Verified' })
  ),
  http.post(`${BASE}/auth/reset-password`, () =>
    HttpResponse.json({ message: 'Password reset' })
  ),

  // User
  http.put(`${BASE}/user/profile`, () =>
    HttpResponse.json({ id: '1', name: 'John Doe', email: 'john@test.com', phone: '123', avatar: '' })
  ),
  http.patch(`${BASE}/user/notifications`, () =>
    HttpResponse.json({ message: 'Updated' })
  ),

  // Assessment
  http.post(`${BASE}/assessment/submit`, () =>
    HttpResponse.json({
      score: 45,
      label: 'Normal',
      emotional_state: 'Calm',
      response_time: 'Normal',
      typing_pattern: 'Consistent',
      break_frequency: 'Adequate',
      recommendations: [{ title: 'Take breaks', description: 'Rest every hour' }],
    })
  ),

  // Dashboard
  http.get(`${BASE}/dashboard/stats`, () =>
    HttpResponse.json({
      emotional_state: 'Normal',
      stress_score: 40,
      stress_label: 'Normal',
      session_data: [{ name: 'Mon', value: 30, color: '#3578FF' }],
      typing_data: [{ name: 'Mon', speed: 60 }],
    })
  ),

  // Articles
  http.get(`${BASE}/articles`, () =>
    HttpResponse.json([
      {
        id: 1,
        title: 'Test Article',
        excerpt: 'Test excerpt',
        image: '/article-1.jpg',
        tag: 'Health',
        read_time: '5 min',
        author: { name: 'Author', avatar: '', date: '2024-01-01' },
        content: 'Full content here',
      },
    ])
  ),
  http.get(`${BASE}/articles/:id`, () =>
    HttpResponse.json({
      id: 1,
      title: 'Test Article',
      excerpt: 'Test excerpt',
      image: '/article-1.jpg',
      tag: 'Health',
      read_time: '5 min',
      author: { name: 'Author', avatar: '', date: '2024-01-01' },
      content: 'Full content here',
    })
  ),

  // Chat
  http.post(`${BASE}/chat`, () =>
    HttpResponse.json({ reply: 'Hello from AI' })
  ),
];

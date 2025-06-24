// Mocks no topo
const mockPost = jest.fn(() => {
  console.log('api.post mock chamado');
  return Promise.resolve({ data: { access_token: 'token123', user: { id: 1, email: 'user@email.com', is_active: true } } });
});
jest.mock('@/lib/api', () => ({
  post: mockPost,
  __esModule: true,
}));

const mockLogin = jest.fn(() => {
  console.log('mockLogin chamado');
});
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
  __esModule: true,
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from './page';
import { test, expect, jest, beforeEach } from '@jest/globals';
import '@testing-library/jest-dom';

beforeEach(() => {
  jest.clearAllMocks();
});

test('realiza login com sucesso e chama login do contexto', async () => {
  render(<LoginPage />);

  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@email.com' } });
  fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: '123456' } });
  fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

  await waitFor(() => {
    expect(mockLogin).toHaveBeenCalledWith('token123', { id: 1, email: 'user@email.com', is_active: true });
  });
}); 
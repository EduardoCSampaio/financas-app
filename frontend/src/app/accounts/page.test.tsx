import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AccountsPage from './page';
import { test, expect, jest } from '@jest/globals';
import '@testing-library/jest-dom';

// Mock do useRouter do next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock do contexto de autenticação
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'user@email.com', is_active: true },
    accounts: [
      { id: 1, name: 'Conta Corrente', initial_balance: 500, owner_id: 1 },
      { id: 2, name: 'Poupança', initial_balance: 1000, owner_id: 1 },
    ],
    fetchAccounts: jest.fn(),
  }),
}));

test('renderiza página de contas, exibe contas e abre modal de adicionar conta', () => {
  render(<AccountsPage />);

  // Verifica se as contas aparecem
  expect(screen.getByText('Conta Corrente')).toBeInTheDocument();
  expect(screen.getByText('Poupança')).toBeInTheDocument();
  expect(screen.getByText(/gerenciar contas/i)).toBeInTheDocument();

  // Abre o modal de adicionar conta
  fireEvent.click(screen.getByText(/criar nova conta/i));
  // O modal deve aparecer (buscando pelo título do modal)
  expect(screen.getByRole('heading', { name: /criar nova conta/i })).toBeInTheDocument();
}); 
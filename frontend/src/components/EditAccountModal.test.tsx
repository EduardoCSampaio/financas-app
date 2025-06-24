// Mock do useRouter do next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
}));

// Mock do api para evitar chamadas reais
jest.mock('@/lib/api', () => ({
  put: jest.fn(() => Promise.resolve({ data: {} })),
}));

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EditAccountModal from './EditAccountModal';
import { AuthProvider } from '@/contexts/AuthContext';
import { Account } from '@/types';
import { test, expect } from '@jest/globals';
import '@testing-library/jest-dom';

test('renderiza modal de edição de conta com dados corretos e fecha ao clicar no botão', () => {
  const mockAccount: Account = {
    id: 1,
    name: 'Conta Teste',
    initial_balance: 100,
    owner_id: 1,
  };
  const onClose = jest.fn();

  render(
    <AuthProvider>
      <EditAccountModal isOpen={true} onClose={onClose} account={mockAccount} />
    </AuthProvider>
  );

  expect(screen.getByDisplayValue('Conta Teste')).toBeInTheDocument();
  expect(screen.getByDisplayValue('100')).toBeInTheDocument();
  expect(screen.getByText(/editar conta/i)).toBeInTheDocument();

  // Simula clique no botão de fechar
  fireEvent.click(screen.getByText('×'));
  expect(onClose).toHaveBeenCalled();
}); 
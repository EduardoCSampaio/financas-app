import React from 'react';
import { render, screen } from '@testing-library/react';
import AddAccountModal from './AddAccountModal';
import { AuthProvider } from '@/contexts/AuthContext';
import '@testing-library/jest-dom';
import { test, expect, jest } from '@jest/globals';

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

test('renderiza modal de adicionar conta', () => {
  render(
    <AuthProvider>
      <AddAccountModal isOpen={true} onClose={() => {}} />
    </AuthProvider>
  );
  expect(screen.getByText(/criar nova conta/i)).toBeInTheDocument();
});
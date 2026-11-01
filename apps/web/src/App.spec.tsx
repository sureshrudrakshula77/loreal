import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('submits the brief and displays a structured result', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ claimId: 'c1', assessmentId: 'a1', justified: true, confidence: 0.91, reasoning: 'The controlled result supports the claim.', reviewRequired: false, assessedAt: new Date().toISOString() }),
    }));
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: /assess claim/i }));
    expect(await screen.findByText('91%')).toBeInTheDocument();
    expect(screen.getByText('The controlled result supports the claim.')).toBeInTheDocument();
  });
});

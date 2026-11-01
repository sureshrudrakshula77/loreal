export type AssessmentRequest = { claim: string; productFormula: string; evidence: string };
export type AssessmentResponse = {
  claimId: string;
  assessmentId: string;
  justified: boolean;
  confidence: number;
  reasoning: string;
  reviewRequired: boolean;
  assessedAt: string;
};

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export async function assessClaim(input: AssessmentRequest): Promise<AssessmentResponse> {
  const response = await fetch(`${API_URL}/claims/assess`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = Array.isArray(payload?.message) ? payload.message.join(' ') : payload?.message;
    throw new Error(message || 'Assessment could not be completed.');
  }
  return payload as AssessmentResponse;
}

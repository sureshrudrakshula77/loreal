import { Test } from '@nestjs/testing';
import { AssessmentDecision, ClaimStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ASSESSMENT_ENGINE } from './assessment-engine';
import { ClaimsService } from './claims.service';

describe('ClaimsService', () => {
  it('persists the claim and a structured assessment', async () => {
    const createdAt = new Date('2026-11-01T10:00:00.000Z');
    const tx = {
      assessment: { create: jest.fn().mockResolvedValue({ id: 'a1', justified: true, confidence: 0.91, reasoning: 'The endpoint and timeframe match.', createdAt }) },
      claim: { update: jest.fn().mockResolvedValue({}) },
    };
    const prisma = {
      claim: { create: jest.fn().mockResolvedValue({ id: 'c1' }) },
      $transaction: jest.fn((work: (client: typeof tx) => unknown) => work(tx)),
    };
    const engine = { model: 'test-model', assess: jest.fn().mockResolvedValue({ justified: true, confidence: 0.91, reasoning: 'The endpoint and timeframe match.' }) };
    const module = await Test.createTestingModule({
      providers: [ClaimsService, { provide: PrismaService, useValue: prisma }, { provide: ASSESSMENT_ENGINE, useValue: engine }],
    }).compile();

    const result = await module.get(ClaimsService).assess({ claim: 'Reduces wrinkles by 20% in 4 weeks', productFormula: 'Test formula details', evidence: 'Controlled evidence with matching outcome and timeframe.' });

    expect(result).toMatchObject({ claimId: 'c1', assessmentId: 'a1', justified: true, confidence: 0.91, reviewRequired: false });
    expect(tx.assessment.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ decision: AssessmentDecision.JUSTIFIED, model: 'test-model' }) }));
    expect(tx.claim.update).toHaveBeenCalledWith({ where: { id: 'c1' }, data: { status: ClaimStatus.ASSESSED } });
  });

  it('routes low-confidence results to human review', async () => {
    const createdAt = new Date();
    const tx = {
      assessment: { create: jest.fn().mockResolvedValue({ id: 'a2', justified: false, confidence: 0.55, reasoning: 'Sample details are missing.', createdAt }) },
      claim: { update: jest.fn().mockResolvedValue({}) },
    };
    const prisma = { claim: { create: jest.fn().mockResolvedValue({ id: 'c2' }) }, $transaction: jest.fn((work: (client: typeof tx) => unknown) => work(tx)) };
    const engine = { model: 'test-model', assess: jest.fn().mockResolvedValue({ justified: false, confidence: 0.55, reasoning: 'Sample details are missing.' }) };
    const module = await Test.createTestingModule({ providers: [ClaimsService, { provide: PrismaService, useValue: prisma }, { provide: ASSESSMENT_ENGINE, useValue: engine }] }).compile();

    const result = await module.get(ClaimsService).assess({ claim: 'Improves hydration for 24 hours', productFormula: 'Test formula details', evidence: 'A brief study summary without a sample size or comparator.' });

    expect(result.reviewRequired).toBe(true);
    expect(tx.claim.update).toHaveBeenCalledWith({ where: { id: 'c2' }, data: { status: ClaimStatus.REVIEW_REQUIRED } });
  });
});

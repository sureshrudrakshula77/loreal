import { Test } from '@nestjs/testing';
import { ClaimsController } from './claims.controller';
import { ClaimsService } from './claims.service';

describe('ClaimsController', () => {
  it('passes a valid assessment request to the service', async () => {
    const input = {
      claim: 'Reduces wrinkles by 20% in 4 weeks',
      productFormula: 'Retinol emulsion at the tested concentration',
      evidence: 'Randomized controlled study with 120 adults reported a 21% mean reduction after 4 weeks.'
    };
    const expected = { claimId: 'claim-1', justified: true, confidence: 0.91 };
    const service = { assess: jest.fn().mockResolvedValue(expected) };
    const module = await Test.createTestingModule({
      controllers: [ClaimsController],
      providers: [{ provide: ClaimsService, useValue: service }],
    }).compile();

    await expect(module.get(ClaimsController).assess(input)).resolves.toEqual(expected);
    expect(service.assess).toHaveBeenCalledWith(input);
  });
});

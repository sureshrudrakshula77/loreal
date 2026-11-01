import { Inject, Injectable } from '@nestjs/common';
import { AssessmentDecision, ClaimStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ASSESSMENT_ENGINE, AssessmentEngine } from './assessment-engine';
import { AssessClaimDto } from './dto/assess-claim.dto';

@Injectable()
export class ClaimsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(ASSESSMENT_ENGINE) private readonly engine: AssessmentEngine,
  ) {}

  async assess(input: AssessClaimDto) {
    const claim = await this.prisma.claim.create({
      data: {
        claimText: input.claim,
        productFormula: input.productFormula,
        evidence: input.evidence,
      },
    });

    const result = await this.engine.assess(input);
    const status = result.confidence < 0.7 ? ClaimStatus.REVIEW_REQUIRED : ClaimStatus.ASSESSED;

    const assessment = await this.prisma.$transaction(async (tx) => {
      const saved = await tx.assessment.create({
        data: {
          claimId: claim.id,
          decision: result.justified
            ? AssessmentDecision.JUSTIFIED
            : AssessmentDecision.NOT_JUSTIFIED,
          justified: result.justified,
          confidence: new Prisma.Decimal(result.confidence),
          reasoning: result.reasoning,
          model: this.engine.model,
          rawResponse: result as Prisma.InputJsonValue,
        },
      });
      await tx.claim.update({ where: { id: claim.id }, data: { status } });
      return saved;
    });

    return {
      claimId: claim.id,
      assessmentId: assessment.id,
      justified: assessment.justified,
      confidence: Number(assessment.confidence),
      reasoning: assessment.reasoning,
      reviewRequired: status === ClaimStatus.REVIEW_REQUIRED,
      assessedAt: assessment.createdAt.toISOString(),
    };
  }
}

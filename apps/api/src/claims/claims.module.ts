import { Module } from '@nestjs/common';
import { ASSESSMENT_ENGINE, OpenAiAssessmentEngine } from './assessment-engine';
import { ClaimsController } from './claims.controller';
import { ClaimsService } from './claims.service';

@Module({
  controllers: [ClaimsController],
  providers: [
    ClaimsService,
    OpenAiAssessmentEngine,
    { provide: ASSESSMENT_ENGINE, useExisting: OpenAiAssessmentEngine },
  ],
})
export class ClaimsModule {}

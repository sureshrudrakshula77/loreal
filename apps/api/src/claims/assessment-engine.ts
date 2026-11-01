import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { AssessClaimDto } from './dto/assess-claim.dto';

export const ASSESSMENT_ENGINE = Symbol('ASSESSMENT_ENGINE');

export type AssessmentResult = {
  justified: boolean;
  confidence: number;
  reasoning: string;
};

export interface AssessmentEngine {
  readonly model: string;
  assess(input: AssessClaimDto): Promise<AssessmentResult>;
}

@Injectable()
export class OpenAiAssessmentEngine implements AssessmentEngine {
  readonly model: string;
  private readonly client: OpenAI;

  constructor(config: ConfigService) {
    const apiKey = config.get<string>('OPENAI_API_KEY');
    this.model = config.get<string>('OPENAI_MODEL', 'gpt-4o-mini');
    this.client = new OpenAI({ apiKey: apiKey || 'missing-key' });
  }

  async assess(input: AssessClaimDto): Promise<AssessmentResult> {
    if (this.client.apiKey === 'missing-key') {
      throw new ServiceUnavailableException('OPENAI_API_KEY is not configured');
    }

    const response = await this.client.responses.create({
      model: this.model,
      instructions: [
        'You are a conservative scientific claims evaluator for cosmetic products.',
        'Assess only whether the supplied evidence supports the exact wording, magnitude, population and timeframe of the claim.',
        'Do not infer missing controls, statistical significance, sample characteristics, methods or results.',
        'Set justified=false when material information is missing or contradictory.',
        'Confidence reflects confidence in this assessment, not effect size.',
        'Give concise, audit-friendly reasoning and identify the decisive evidence gap or support.'
      ].join(' '),
      input: `CLAIM:\n${input.claim}\n\nPRODUCT FORMULA:\n${input.productFormula}\n\nSTUDY EVIDENCE:\n${input.evidence}`,
      text: {
        format: {
          type: 'json_schema',
          name: 'claim_assessment',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              justified: { type: 'boolean' },
              confidence: { type: 'number', minimum: 0, maximum: 1 },
              reasoning: { type: 'string' }
            },
            required: ['justified', 'confidence', 'reasoning'],
            additionalProperties: false
          }
        }
      }
    });

    if (!response.output_text) {
      throw new ServiceUnavailableException('The assessment model returned no usable output');
    }

    const result = JSON.parse(response.output_text) as AssessmentResult;
    if (typeof result.justified !== 'boolean' || !Number.isFinite(result.confidence) || !result.reasoning) {
      throw new ServiceUnavailableException('The assessment model returned an invalid result');
    }

    return { ...result, confidence: Math.max(0, Math.min(1, result.confidence)) };
  }
}

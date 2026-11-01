import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { AssessClaimDto } from './dto/assess-claim.dto';

@Controller('claims')
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @Post('assess')
  @HttpCode(201)
  assess(@Body() input: AssessClaimDto) {
    return this.claimsService.assess(input);
  }
}

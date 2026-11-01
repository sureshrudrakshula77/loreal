import { IsString, MaxLength, MinLength } from 'class-validator';

export class AssessClaimDto {
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  claim!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(10_000)
  productFormula!: string;

  @IsString()
  @MinLength(30)
  @MaxLength(30_000)
  evidence!: string;
}

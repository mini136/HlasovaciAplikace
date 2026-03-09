import { IsInt, Min } from 'class-validator';

export class VoteDto {
  @IsInt()
  @Min(1)
  optionId!: number;
}

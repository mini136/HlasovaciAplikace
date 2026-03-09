import { Body, Controller, Get, Post } from '@nestjs/common';
import { ResetDto } from './dto/reset.dto';
import { VoteDto } from './dto/vote.dto';
import { PollService } from './poll.service';

@Controller('poll')
export class PollController {
  constructor(private readonly pollService: PollService) {}

  @Get()
  async getPoll() {
    return this.pollService.getPollResults();
  }

  @Post('vote')
  async vote(@Body() voteDto: VoteDto) {
    return this.pollService.vote(voteDto.optionId);
  }

  @Post('reset')
  async reset(@Body() resetDto: ResetDto) {
    return this.pollService.reset(resetDto.token);
  }
}

import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { ResetDto } from './dto/reset.dto';
import { VoteDto } from './dto/vote.dto';
import { PollService } from './poll.service';

@Controller('poll')
export class PollController {
  constructor(private readonly pollService: PollService) {}

  private getVoterId(req: Request) {
    const forwardedFor = req.headers['x-forwarded-for'];
    const forwardedIp = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor?.split(',')[0]?.trim();

    const ip = forwardedIp || req.ip || 'unknown-ip';
    return `ip:${ip}`;
  }

  @Get()
  async getPoll(@Req() req: Request) {
    return this.pollService.getPollResults(this.getVoterId(req));
  }

  @Post('vote')
  async vote(@Body() voteDto: VoteDto, @Req() req: Request) {
    return this.pollService.vote(voteDto.optionId, this.getVoterId(req));
  }

  @Post('reset')
  async reset(@Body() resetDto: ResetDto) {
    return this.pollService.reset(resetDto.token);
  }
}

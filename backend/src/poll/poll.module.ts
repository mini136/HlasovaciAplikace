import { Module } from '@nestjs/common';
import { PollController } from './poll.controller';
import { PollService } from './poll.service';
import { PrismaService } from './prisma.service';

@Module({
  controllers: [PollController],
  providers: [PollService, PrismaService],
})
export class PollModule {}

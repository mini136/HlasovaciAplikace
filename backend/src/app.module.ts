import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PollModule } from './poll/poll.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PollModule],
})
export class AppModule {}

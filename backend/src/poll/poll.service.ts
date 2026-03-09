import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PollOption, Prisma } from '@prisma/client';
import { createHash } from 'crypto';
import { PrismaService } from './prisma.service';

const QUESTION = 'Kolik otevřených záložek je ještě normální?';

const DEFAULT_OPTIONS: Array<Pick<PollOption, 'code' | 'label'>> = [
  { code: 'a', label: '1–5 záložek, jsem minimalista' },
  { code: 'b', label: '6–15 záložek, pořád v pohodě' },
  { code: 'c', label: '16+ záložek, chaos je moje workflow' },
];

@Injectable()
export class PollService {
  constructor(private readonly prisma: PrismaService) {}

  private buildVoterKey(rawVoterId: string) {
    return createHash('sha256').update(rawVoterId).digest('hex');
  }

  private async ensureSeedData() {
    const existing = await this.prisma.pollOption.count();
    if (existing > 0) {
      return;
    }

    for (const option of DEFAULT_OPTIONS) {
      const created = await this.prisma.pollOption.create({ data: option });
      await this.prisma.pollVote.create({
        data: {
          optionId: created.id,
          count: 0,
        },
      });
    }
  }

  async getPollResults(rawVoterId?: string) {
    await this.ensureSeedData();

    const options = await this.prisma.pollOption.findMany({
      orderBy: { id: 'asc' },
      include: { vote: true },
    });

    const formatted = options.map((option) => ({
      id: option.id,
      code: option.code,
      label: option.label,
      votes: option.vote?.count ?? 0,
    }));

    const totalVotes = formatted.reduce((sum, item) => sum + item.votes, 0);

    const hasVoted = rawVoterId
      ? Boolean(
          await this.prisma.pollBallot.findUnique({
            where: { voterKey: this.buildVoterKey(rawVoterId) },
            select: { id: true },
          }),
        )
      : false;

    return {
      question: QUESTION,
      options: formatted,
      totalVotes,
      hasVoted,
    };
  }

  async vote(optionId: number, rawVoterId: string) {
    await this.ensureSeedData();

    const option = await this.prisma.pollOption.findUnique({ where: { id: optionId } });
    if (!option) {
      throw new BadRequestException('Neplatná volba.');
    }

    const voterKey = this.buildVoterKey(rawVoterId);
    const existingBallot = await this.prisma.pollBallot.findUnique({ where: { voterKey } });
    if (existingBallot) {
      throw new ConflictException('Už jsi hlasoval(a). Každý uživatel může hlasovat jen jednou.');
    }

    try {
      await this.prisma.$transaction([
        this.prisma.pollVote.update({
          where: { optionId },
          data: { count: { increment: 1 } },
        }),
        this.prisma.pollBallot.create({
          data: {
            voterKey,
            optionId,
          },
        }),
      ]);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Už jsi hlasoval(a). Každý uživatel může hlasovat jen jednou.');
      }
      throw error;
    }

    return this.getPollResults(rawVoterId);
  }

  async reset(token: string) {
    const expectedToken = process.env.RESET_TOKEN;
    if (!expectedToken || token !== expectedToken) {
      throw new UnauthorizedException('Neplatný reset token.');
    }

    await this.ensureSeedData();

    await this.prisma.$transaction([
      this.prisma.pollVote.updateMany({ data: { count: 0 } }),
      this.prisma.pollBallot.deleteMany(),
    ]);

    return {
      ok: true,
      message: 'Hlasy byly resetovány.',
      results: await this.getPollResults(),
    };
  }
}

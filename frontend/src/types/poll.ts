export type PollOption = {
  id: number;
  code: string;
  label: string;
  votes: number;
};

export type PollResponse = {
  question: string;
  options: PollOption[];
  totalVotes: number;
  hasVoted: boolean;
};

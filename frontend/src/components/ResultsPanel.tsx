import type { PollOption } from "../types/poll";

type ResultsPanelProps = {
  options: PollOption[];
  totalVotes: number;
};

export function ResultsPanel({ options, totalVotes }: ResultsPanelProps) {
  return (
    <section className="card">
      <h2>Výsledky</h2>
      <ul className="results">
        {options.map((option) => (
          <li key={option.id}>
            <span>
              {option.code}) {option.label}
            </span>
            <strong>{option.votes} hlasů</strong>
          </li>
        ))}
      </ul>
      <p className="total">Celkem hlasů: {totalVotes}</p>
    </section>
  );
}

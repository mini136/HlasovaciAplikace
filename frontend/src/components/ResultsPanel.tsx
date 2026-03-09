import type { PollOption } from "../types/poll";

type ResultsPanelProps = {
  options: PollOption[];
  totalVotes: number;
};

export function ResultsPanel({ options, totalVotes }: ResultsPanelProps) {
  return (
    <section className="card">
      <h2>📊 Výsledky</h2>
      <ul className="results">
        {options.map((option) => {
          const pct = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
          return (
            <li key={option.id} className="result-item">
              <div className="result-label">
                <span>
                  {option.code}) {option.label}
                </span>
                <strong>
                  {option.votes} ({pct.toFixed(0)}%)
                </strong>
              </div>
              <div className="result-bar-bg">
                <div
                  className="result-bar-fill"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <p className="total">Celkem hlasů: {totalVotes}</p>
    </section>
  );
}

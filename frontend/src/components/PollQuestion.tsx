import type { PollOption } from "../types/poll";

type PollQuestionProps = {
  question: string;
  options: PollOption[];
  hasVoted: boolean;
  selectedOptionId: number | null;
  onSelect: (optionId: number) => void;
  onVote: () => void;
  onShowResults: () => void;
  loading: boolean;
};

export function PollQuestion(props: PollQuestionProps) {
  const {
    question,
    options,
    hasVoted,
    selectedOptionId,
    onSelect,
    onVote,
    onShowResults,
    loading,
  } = props;

  return (
    <section className="card">
      <h2>🗳️ Hlasování</h2>
      <p className="question">{question}</p>

      <div className="options">
        {options.map((option) => (
          <label key={option.id} className="option">
            <input
              type="radio"
              name="poll-option"
              checked={selectedOptionId === option.id}
              onChange={() => onSelect(option.id)}
              disabled={loading || hasVoted}
            />
            <span>
              {option.code}) {option.label}
            </span>
          </label>
        ))}
      </div>

      <div className="actions">
        <button
          className="btn-primary"
          onClick={onVote}
          disabled={loading || hasVoted || selectedOptionId === null}
        >
          Odeslat hlas
        </button>
        <button className="btn-secondary" onClick={onShowResults} disabled={loading}>
          Obnovit výsledky
        </button>
      </div>

      {hasVoted ? (
        <div className="voted-badge">✅ Už jsi hlasoval(a). Další hlas není povolen.</div>
      ) : null}
    </section>
  );
}

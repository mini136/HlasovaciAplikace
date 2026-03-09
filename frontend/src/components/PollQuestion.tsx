import type { PollOption } from "../types/poll";

type PollQuestionProps = {
  question: string;
  options: PollOption[];
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
    selectedOptionId,
    onSelect,
    onVote,
    onShowResults,
    loading,
  } = props;

  return (
    <section className="card">
      <h1>Anketa dne</h1>
      <p className="question">{question}</p>

      <div className="options">
        {options.map((option) => (
          <label key={option.id} className="option">
            <input
              type="radio"
              name="poll-option"
              checked={selectedOptionId === option.id}
              onChange={() => onSelect(option.id)}
              disabled={loading}
            />
            <span>
              {option.code}) {option.label}
            </span>
          </label>
        ))}
      </div>

      <div className="actions">
        <button
          onClick={onVote}
          disabled={loading || selectedOptionId === null}
        >
          Odeslat hlas
        </button>
        <button onClick={onShowResults} disabled={loading}>
          Zobrazit výsledky
        </button>
      </div>
    </section>
  );
}

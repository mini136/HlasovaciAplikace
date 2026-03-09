type ResetPanelProps = {
  token: string;
  onTokenChange: (value: string) => void;
  onReset: () => void;
  loading: boolean;
};

export function ResetPanel({
  token,
  onTokenChange,
  onReset,
  loading,
}: ResetPanelProps) {
  return (
    <section className="card reset-panel">
      <h2>⚠️ Reset hlasování</h2>
      <p className="question">Reset je povolen pouze při zadání správného tokenu.</p>
      <div className="reset-row">
        <input
          type="password"
          value={token}
          placeholder="Zadej reset token"
          onChange={(event) => onTokenChange(event.target.value)}
          disabled={loading}
        />
        <button
          className="btn-danger"
          onClick={onReset}
          disabled={loading || token.trim().length === 0}
        >
          Resetovat
        </button>
      </div>
    </section>
  );
}

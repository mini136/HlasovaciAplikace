import { useEffect, useState } from "react";
import { getPoll, resetVotes, vote } from "./api/pollApi";
import { PollQuestion } from "./components/PollQuestion";
import { ResetPanel } from "./components/ResetPanel";
import { ResultsPanel } from "./components/ResultsPanel";
import type { PollResponse } from "./types/poll";

function App() {
  const [poll, setPoll] = useState<PollResponse | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);

  const loadPoll = async () => {
    setLoading(true);
    try {
      const data = await getPoll();
      setPoll(data);
      setMessage("Výsledky byly načteny.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Nepodařilo se načíst data.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPoll();
  }, []);

  const handleVote = async () => {
    if (loading || poll?.hasVoted) {
      setMessage("Už jsi hlasoval(a). Další hlas není povolen.");
      return;
    }

    if (selectedOptionId === null) {
      setMessage("Vyber nejdřív jednu možnost.");
      return;
    }

    setLoading(true);
    try {
      const data = await vote(selectedOptionId);
      setPoll(data);
      setMessage("Hlas byl uložen.");
      setSelectedOptionId(null);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Nepodařilo se odeslat hlas.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      const result = await resetVotes(token);
      if (result.results) {
        setPoll(result.results);
      }
      setMessage(result.message);
      setToken("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Reset selhal.");
    } finally {
      setLoading(false);
    }
  };

  if (!poll) {
    return (
      <main className="layout">
        <div className="header">
          <h1>Anketa dne</h1>
        </div>
        <section className="card">
          {loading ? (
            <div className="loading-screen">
              <div className="spinner" />
              <p className="question">Načítám anketu…</p>
            </div>
          ) : (
            <>
              <p className="message">
                {message || "Nepodařilo se načíst data."}
              </p>
              <button className="btn-primary" onClick={() => void loadPoll()}>
                Zkusit znovu
              </button>
            </>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="layout">
      <div className="header">
        <h1>Anketa dne</h1>
        <p>Vyber odpověď a hlasuj</p>
      </div>

      <PollQuestion
        question={poll.question}
        options={poll.options}
        hasVoted={poll.hasVoted}
        selectedOptionId={selectedOptionId}
        onSelect={setSelectedOptionId}
        onVote={handleVote}
        onShowResults={() => {
          void loadPoll();
        }}
        loading={loading}
      />

      <ResultsPanel options={poll.options} totalVotes={poll.totalVotes} />

      {message ? <p className="message">{message}</p> : null}

      <div className="admin-toggle">
        <button
          className="btn-ghost"
          onClick={() => setShowReset((v: boolean) => !v)}
        >
          {showReset ? "Skrýt administraci" : "⚙ Administrace"}
        </button>
      </div>

      {showReset && (
        <ResetPanel
          token={token}
          onTokenChange={setToken}
          onReset={handleReset}
          loading={loading}
        />
      )}

      <footer className="footer">
        <a
          href="https://github.com/mini136/HlasovaciAplikace/issues"
          target="_blank"
          rel="noopener noreferrer"
        >
          Nahlásit problém nebo navrhnout vylepšení
        </a>
      </footer>
    </main>
  );
}

export default App;

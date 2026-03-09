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
    return <main className="layout">Načítám...</main>;
  }

  return (
    <main className="layout">
      <PollQuestion
        question={poll.question}
        options={poll.options}
        selectedOptionId={selectedOptionId}
        onSelect={setSelectedOptionId}
        onVote={handleVote}
        onShowResults={() => {
          void loadPoll();
        }}
        loading={loading}
      />
      <ResultsPanel options={poll.options} totalVotes={poll.totalVotes} />
      <ResetPanel
        token={token}
        onTokenChange={setToken}
        onReset={handleReset}
        loading={loading}
      />
      {message ? <p className="message">{message}</p> : null}
    </main>
  );
}

export default App;

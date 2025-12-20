"use client";

import { useState } from "react";
import { ChatOllama } from "@langchain/community/chat_models/ollama";

const CHAT_MODEL = "llama3.2:1b";

export default function QuizSection({ onResult }: { onResult: (answer: string) => void }) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState("");

  const askQuestion = async () => {
    setLoading(true);
    const chat = new ChatOllama({ baseUrl: "http://localhost:11434", model: CHAT_MODEL, temperature: 0 });
    const prompt = `You are a quizmaster. Ask a true/false question about South African law, and then provide the correct answer.`;
    const result = await chat.invoke([{ role: "user", content: prompt }]);
    setQuestion(result.content as string);
    setLoading(false);
  };

  return (
    <div className="p-4 bg-white dark:bg-neutral-800 rounded shadow">
      <h3 className="font-semibold mb-2">Mini Quiz</h3>
      <button
        onClick={askQuestion}
        className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        disabled={loading}
      >
        {loading ? "Loading…" : "Start Quiz"}
      </button>
      {question && (
        <div className="mt-4">
          <p>{question}</p>
          <button
            className="mt-2 px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700"
            onClick={() => {
              setAnswer(question);
              onResult(question);
            }}
          >
            Mark as answered
          </button>
        </div>
      )}
    </div>
  );
}

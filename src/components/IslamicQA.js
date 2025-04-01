import React, { useState } from "react";
import axios from "axios";
import API_URL from "../config";
import "./IslamicQA.css";

const IslamicQA = () => {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) {
      setError("Please enter a question");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.post(`${API_URL}/api/ask`, {
        question,
      });
      setResult(response.data);
    } catch (err) {
      console.error("Error:", err);
      setError("Error processing your question. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key submission
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Prevents a new line in textarea
      handleSubmit(e);
    }
  };

  return (
    <div className="islamic-qa">
      <h2>Ask Me About Islam</h2>
      <p className="description">
        Ask any question about Islam, and I'll provide you with an answer based
        on the Quran, Hadith, and scholarly opinions.
      </p>

      <form onSubmit={handleSubmit} className="question-form">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter your question about Islam..."
          rows="4"
          className="question-input"
        />
        <button type="submit" className="submit-button" disabled={isLoading}>
          {isLoading ? "Getting Answer..." : "Ask Question"}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}

      {result && (
        <div className="result">
          <div className="answer-section">
            <h3>Answer</h3>
            <div className="answer-text">
              {result.summary.split("\n").map((line, index) => {
                // Remove ** markers from the line
                const cleanLine = line.replace(/\*\*/g, "");

                // Check if line starts with a bullet point or number
                if (
                  cleanLine.trim().startsWith("•") ||
                  cleanLine.trim().startsWith("-") ||
                  /^\d+\./.test(cleanLine.trim())
                ) {
                  return (
                    <p key={index} className="bullet-point">
                      {cleanLine}
                    </p>
                  );
                }
                // Check if line is a heading (no bullet points and shorter)
                else if (
                  cleanLine.trim().length < 50 &&
                  !cleanLine.includes("•")
                ) {
                  return (
                    <h4 key={index} className="section-heading">
                      {cleanLine}
                    </h4>
                  );
                }
                // Regular paragraph
                else {
                  return <p key={index}>{cleanLine}</p>;
                }
              })}
            </div>
          </div>

          {result.videos && result.videos.length > 0 && (
            <div className="videos-section">
              <h3>Related Videos</h3>
              <div className="videos-grid">
                {result.videos.map((video, index) => (
                  <a
                    key={index}
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="video-card"
                  >
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="video-thumbnail"
                    />
                    <div className="video-info">
                      <h4>{video.title}</h4>
                      <p>{video.channelTitle}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IslamicQA;

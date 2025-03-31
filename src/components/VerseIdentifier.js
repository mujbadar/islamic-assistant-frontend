import React, { useState, useRef } from "react";
import axios from "axios";
import API_URL from "../config";
import "./VerseIdentifier.css";

const VerseIdentifier = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        await sendAudioToServer(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      setError(null);
      setResult(null);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prevTime) => {
          if (prevTime >= 15) {
            stopRecording();
            return 15;
          }
          return prevTime + 1;
        });
      }, 1000);
    } catch (err) {
      setError(
        "Error accessing microphone. Please ensure you have granted microphone permissions."
      );
      console.error("Error:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const sendAudioToServer = async (audioBlob) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");

    try {
      const response = await axios.post(
        `${API_URL}/api/identify-verse`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setResult(response.data);
    } catch (err) {
      console.error("Error details:", err.response?.data || err.message);
      setError(
        err.response?.data?.error ||
          "Error processing audio. Please try again. Make sure the audio is clear and contains Quranic recitation."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="verse-identifier">
      <h2>Quranic Verse Identifier</h2>
      <p className="description">
        Record up to 15 seconds of Quranic recitation to identify the verse.
      </p>

      <div className="recording-controls">
        <button
          className={`record-button ${isRecording ? "recording" : ""}`}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isLoading}
        >
          {isRecording ? "Stop Recording" : "Start Recording"}
        </button>
        {isRecording && (
          <div className="timer">Recording: {recordingTime}s / 15s</div>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {isLoading && (
        <div className="loading">Processing audio... Please wait.</div>
      )}

      {result && (
        <div className="result">
          <h3>Identified Verse</h3>
          <div className="verse-details">
            <p className="arabic-text">{result.transcribedText}</p>
            <div className="identification">{result.verseIdentification}</div>
          </div>

          {result.videos && result.videos.length > 0 && (
            <div className="videos-section">
              <h3>Kabah Recitation</h3>
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

export default VerseIdentifier;

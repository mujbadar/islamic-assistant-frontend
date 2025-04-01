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
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);

  const checkAudioLevel = (audioBlob) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const arrayBuffer = e.target.result;
        const audioContext = new (window.AudioContext ||
          window.webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        // Get the raw audio data
        const channelData = audioBuffer.getChannelData(0);

        // Calculate RMS (Root Mean Square) value
        let sum = 0;
        for (let i = 0; i < channelData.length; i++) {
          sum += channelData[i] * channelData[i];
        }
        const rms = Math.sqrt(sum / channelData.length);

        // If RMS is very low (close to 0), the audio is likely silent
        resolve(rms > 0.01); // Threshold of 0.01
      };
      reader.readAsArrayBuffer(audioBlob);
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });
      audioChunksRef.current = [];

      // Create audio context for pre-recording buffer
      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      // Start recording after a small delay
      setTimeout(() => {
        mediaRecorderRef.current.start(1000); // Collect data every second
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
      }, 500); // 500ms delay before starting

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        // Clean up audio context
        if (audioContextRef.current) {
          await audioContextRef.current.close();
          audioContextRef.current = null;
        }

        // Check if audio contains sound
        const hasSound = await checkAudioLevel(audioBlob);
        if (!hasSound) {
          setError(
            "No audio detected. Please make sure you are speaking or reciting clearly."
          );
          return;
        }

        await sendAudioToServer(audioBlob);
      };
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

  const formatVerseIdentification = (text) => {
    return text.split("\n").map((line, index) => {
      // Remove ** markers and bullet points from the line
      const cleanLine = line.replace(/\*\*/g, "").replace(/^[•-]\s*/, ""); // Remove bullet points

      // Skip empty lines
      if (!cleanLine.trim()) {
        return null;
      }

      // Check if line starts with ### (header)
      if (cleanLine.trim().startsWith("###")) {
        return (
          <h4 key={index} className="section-heading">
            {cleanLine.replace(/^###\s*/, "").trim()}
          </h4>
        );
      }
      // Regular paragraph
      else {
        return <p key={index}>{cleanLine}</p>;
      }
    });
  };

  return (
    <div className="verse-identifier">
      <h2>Quranic Verse Identifier</h2>
      <p className="description">
        Record 15 seconds of Quranic recitation to identify the verse.
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
        <div className="loading">
          <div className="loading-spinner"></div>
          <div className="loading-text">Processing Your Recitation</div>
          <div className="loading-subtext">
            We're analyzing your audio and identifying the verse. This may take
            a few moments.
          </div>
        </div>
      )}

      {result && (
        <div className="result">
          <div className="answer-section">
            <h3>Identified Verse</h3>
            <div className="answer-text">
              {formatVerseIdentification(result.verseIdentification)}
            </div>
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

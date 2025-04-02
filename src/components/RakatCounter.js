import React, { useEffect, useRef, useState } from "react";
import "./RakatCounter.css";

const RakatCounter = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCounting, setIsCounting] = useState(false);
  const [currentRakat, setCurrentRakat] = useState(0);
  const [prayerState, setPrayerState] = useState("standing");
  const [deviceType, setDeviceType] = useState("desktop"); // 'desktop' or 'mobile'
  const [error, setError] = useState(null);

  // Detect device type
  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setDeviceType(isMobile ? "mobile" : "desktop");
  }, []);

  // Start camera
  useEffect(() => {
    let currentVideo = videoRef.current; // Store ref value

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
        });
        if (currentVideo) {
          currentVideo.srcObject = stream;
        }
      } catch (err) {
        setError("Failed to access camera: " + err.message);
      }
    };

    startCamera();

    // Cleanup function
    return () => {
      if (currentVideo && currentVideo.srcObject) {
        const tracks = currentVideo.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []); // Empty dependency array since we're capturing ref value

  // Motion detection loop
  useEffect(() => {
    let animationFrameId;
    let lastFrame;
    let motionHistory = [];
    const HISTORY_LENGTH = 10;
    let lastPositionChange = Date.now();
    const POSITION_COOLDOWN = 1000;

    const detectMotion = () => {
      if (!videoRef.current || !canvasRef.current) return;

      const ctx = canvasRef.current.getContext("2d");
      const width = canvasRef.current.width;
      const height = canvasRef.current.height;

      ctx.drawImage(videoRef.current, 0, 0, width, height);
      const currentFrame = ctx.getImageData(0, 0, width, height);

      if (lastFrame) {
        let motionAmount = 0;
        const data1 = currentFrame.data;
        const data2 = lastFrame.data;

        // For mobile (flat position), focus on the center of the frame
        if (deviceType === "mobile") {
          // Calculate center region (middle 50% of frame)
          const centerStart = Math.floor((width * height * 2) / 5) * 4; // 40% from top
          const centerEnd = Math.floor((width * height * 3) / 5) * 4; // 60% from top

          for (let i = centerStart; i < centerEnd; i += 40) {
            const diff = Math.abs(data1[i] - data2[i]);
            motionAmount += diff;
          }
          motionAmount = motionAmount / ((centerEnd - centerStart) / 40);
        } else {
          // For desktop, check the entire frame
          for (let i = 0; i < data1.length; i += 40) {
            const diff = Math.abs(data1[i] - data2[i]);
            motionAmount += diff;
          }
          motionAmount = motionAmount / (data1.length / 40);
        }

        motionHistory.push(motionAmount);

        if (motionHistory.length > HISTORY_LENGTH) {
          motionHistory.shift();

          const maxMotion = Math.max(...motionHistory);
          const currentTime = Date.now();

          // Different thresholds for mobile and desktop
          const motionThreshold = deviceType === "mobile" ? 10 : 7;

          if (
            currentTime - lastPositionChange > POSITION_COOLDOWN &&
            maxMotion > motionThreshold
          ) {
            lastPositionChange = currentTime;

            switch (prayerState) {
              case "standing":
                setPrayerState("ruku");
                break;
              case "ruku":
                setPrayerState("postRuku");
                break;
              case "postRuku":
                setPrayerState("firstSajda");
                break;
              case "firstSajda":
                setPrayerState("sitting");
                break;
              case "sitting":
                setPrayerState("secondSajda");
                break;
              case "secondSajda":
                if (currentRakat % 2 === 0) {
                  setPrayerState("finalSitting");
                } else {
                  setPrayerState("standing");
                  setCurrentRakat((prev) => prev + 1);
                }
                break;
              case "finalSitting":
                setPrayerState("standing");
                setCurrentRakat((prev) => prev + 1);
                break;
            }
          }
        }
      }

      lastFrame = currentFrame;
      animationFrameId = requestAnimationFrame(detectMotion);
    };

    if (isCounting) {
      detectMotion();
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isCounting, prayerState, deviceType, currentRakat]);

  const toggleCounting = () => {
    setIsCounting(!isCounting);
    if (!isCounting) {
      setCurrentRakat(0);
      setPrayerState("standing");
    }
  };

  // Update the display text based on the prayer sequence
  const getPositionDisplay = () => {
    switch (prayerState) {
      case "standing":
        return "Standing";
      case "ruku":
        return "Ruku";
      case "postRuku":
        return "Standing after Ruku";
      case "firstSajda":
        return "First Sajda";
      case "sitting":
        return "Sitting";
      case "secondSajda":
        return "Second Sajda";
      case "finalSitting":
        return "Final Sitting";
      default:
        return prayerState;
    }
  };

  return (
    <div className="rakat-counter">
      <div className="camera-container">
        <video
          ref={videoRef}
          className="camera-feed"
          autoPlay
          playsInline
          muted
          width="640"
          height="480"
        />
        <canvas
          ref={canvasRef}
          className="motion-canvas"
          width="640"
          height="480"
        />
      </div>

      <div className="status">
        <div className="device-type">
          Mode:{" "}
          {deviceType === "mobile" ? "Phone (lay flat)" : "Laptop/Desktop"}
        </div>
        <div className="current-position">
          Position: {getCurrentPositionDisplay()}
          {currentPosition === "sajda" && ` (${sajdaCount}/2)`}
        </div>
        <div className="rakat-count">Rakats Completed: {currentRakat}</div>
      </div>

      <div className="controls">
        <button
          className={`toggle-button ${isCounting ? "counting" : ""}`}
          onClick={toggleCounting}
        >
          {isCounting ? "Stop Counting" : "Start Counting"}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="instructions">
        <h3>Setup Instructions:</h3>
        {deviceType === "mobile" ? (
          <ol>
            <li>Place your phone flat on the prayer mat</li>
            <li>Position it where your head will be during sajda</li>
            <li>Make sure the camera is pointing upward</li>
            <li>Press Start Counting before beginning prayer</li>
          </ol>
        ) : (
          <ol>
            <li>Position your laptop to capture your full prayer movement</li>
            <li>Ensure you're visible from standing to sajda</li>
            <li>Make sure there's good lighting</li>
            <li>Press Start Counting before beginning prayer</li>
          </ol>
        )}
      </div>
    </div>
  );
};

export default RakatCounter;

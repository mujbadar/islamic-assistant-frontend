const API_URL =
  process.env.NODE_ENV === "production"
    ? "https://islamic-assistant-backend-production.up.railway.app"
    : "http://localhost:3001";

export default API_URL;

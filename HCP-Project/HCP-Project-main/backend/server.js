require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

app.use(cors());
app.use(express.json());

// Initialize Google Gemini API
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "YOUR_GEMINI_API_KEY_HERE";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Helper: sleep for ms milliseconds
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

app.get("/", (req, res) => res.json({ status: "AI Chat Server running on port 5001 (Google Gemini)" }));

app.post("/chat", async (req, res) => {
    const userMessage = req.body.message;

    if (!userMessage) {
        return res.status(400).json({ reply: "No message provided." });
    }

    if (GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
        return res.status(500).json({
            reply: "❌ API key not configured. Please add GEMINI_API_KEY to your .env file.",
        });
    }

    // Retry up to 3 times on failure
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            // "gemini-2.5-flash" is the latest model accessible with this key
            const model = genAI.getGenerativeModel({
                model: "gemini-2.5-flash",
                systemInstruction: "You are a helpful healthcare chatbot. Provide accurate medical information and be friendly. Keep responses concise and practical."
            });

            const result = await model.generateContent(userMessage);
            const response = await result.response;
            const reply = response.text();

            console.log(`[OK] Reply sent (attempt ${attempt})`);
            return res.json({ reply });

        } catch (error) {
            console.error(`[Attempt ${attempt}/3] Error:`, error.message);

            if (attempt < 3) {
                // Wait 2 seconds before retry
                await sleep(2000);
                continue;
            }

            console.error("Full error:", error);
            return res.json({
                reply: "⚠️ Connection error or API issue. Please try again.",
            });
        }
    }
});

const axios = require("axios");

app.post("/hospitals", async (req, res) => {
  console.log("RECEIVED:", req.body); // 🔥 IMPORTANT

  const { latitude, longitude } = req.body;

  // 🔥 5. Safety check
  if (!latitude || !longitude) {
    return res.json([]);
  }

  const query = `
  [out:json];
  node
    ["amenity"="hospital"]
    (around:5000, ${latitude}, ${longitude});
  out;
  `;

  try {
    const response = await axios.post(
      "https://overpass-api.de/api/interpreter",
      query,
      { headers: { "Content-Type": "text/plain" } }
    );

    const hospitals = response.data.elements.map(h => ({
      id: h.id,
      name: h.tags.name || "Nearby Hospital",
      lat: h.lat,
      lon: h.lon,
      address: h.tags["addr:full"] || "Address not available",
      emergency: h.tags.emergency === "yes" ? "Yes" : "Unknown",
      type: h.tags.healthcare || "General",
    }));

    res.json(hospitals);

  } catch (err) {
    console.log(err);
    res.json([]);
  }
});


const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT} (Google Gemini)`);
});

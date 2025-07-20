const express = require("express");
const fetch = require("node-fetch");
const path = require("path");
const OpenAI = require("openai");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize OpenAI (optional - only if API key is provided)
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the public directory
app.use(express.static("public"));

// API endpoint to fetch weather data
app.get("/api/weather/:city", async (req, res) => {
  const { city } = req.params;
  const URL = `https://api.weatherapi.com/v1/forecast.json?key=${process.env.WEATHER_API_KEY}&q=${city}&days=4`;

  try {
    const response = await fetch(URL);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Weather API Error:", error);
    res.status(500).json({ error: "Failed to fetch weather data" });
  }
});

// Weather prediction endpoint
app.get("/api/predict/:city", async (req, res) => {
  const { city } = req.params;

  try {
    // Get extended forecast (7 days)
    const URL = `https://api.weatherapi.com/v1/forecast.json?key=${process.env.WEATHER_API_KEY}&q=${city}&days=7`;
    const response = await fetch(URL);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Analyze weather patterns for predictions
    const forecast = data.forecast.forecastday;
    const predictions = {
      city: data.location.name,
      country: data.location.country,
      predictions: [],
      trends: analyzeWeatherTrends(forecast),
      recommendations: generateRecommendations(forecast),
    };

    // Generate predictions for next 7 days
    forecast.forEach((day, index) => {
      predictions.predictions.push({
        date: day.date,
        dayIndex: index,
        maxTemp: day.day.maxtemp_c,
        minTemp: day.day.mintemp_c,
        condition: day.day.condition.text,
        chanceOfRain: day.day.daily_chance_of_rain,
        humidity: day.day.avghumidity,
        windSpeed: day.day.maxwind_kph,
        confidence: calculateConfidence(index), // More recent = higher confidence
      });
    });

    res.json(predictions);
  } catch (error) {
    console.error("Weather Prediction Error:", error);
    res.status(500).json({ error: "Failed to generate weather predictions" });
  }
});

// Helper functions for weather analysis
function analyzeWeatherTrends(forecast) {
  const temps = forecast.map((day) => day.day.avgtemp_c);
  const humidity = forecast.map((day) => day.day.avghumidity);
  const rainChances = forecast.map((day) => day.day.daily_chance_of_rain);

  return {
    temperatureTrend: getTrend(temps),
    humidityTrend: getTrend(humidity),
    rainTrend: getTrend(rainChances),
    averageTemp: (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1),
    averageHumidity: (
      humidity.reduce((a, b) => a + b, 0) / humidity.length
    ).toFixed(1),
  };
}

function getTrend(values) {
  if (values.length < 2) return "stable";

  let increasing = 0;
  let decreasing = 0;

  for (let i = 1; i < values.length; i++) {
    if (values[i] > values[i - 1]) increasing++;
    if (values[i] < values[i - 1]) decreasing++;
  }

  if (increasing > decreasing) return "increasing";
  if (decreasing > increasing) return "decreasing";
  return "stable";
}

function generateRecommendations(forecast) {
  const recommendations = [];

  forecast.forEach((day, index) => {
    const temp = day.day.avgtemp_c;
    const rain = day.day.daily_chance_of_rain;
    const date = new Date(day.date).toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });

    let rec = `${date}: `;

    if (rain > 70) {
      rec += "High chance of rain - bring an umbrella! ☔";
    } else if (rain > 30) {
      rec += "Possible rain - keep a jacket handy 🧥";
    } else if (temp > 25) {
      rec += "Great weather for outdoor activities! ☀️";
    } else if (temp < 10) {
      rec += "Cold day - dress warmly! 🧣";
    } else {
      rec += "Pleasant weather expected 😊";
    }

    recommendations.push(rec);
  });

  return recommendations;
}

function calculateConfidence(dayIndex) {
  // Confidence decreases with distance into the future
  return Math.max(95 - dayIndex * 10, 60);
}

// AI Chat endpoint for weather predictions and discussions
app.post("/api/chat", async (req, res) => {
  if (!openai) {
    return res.status(503).json({ error: "AI service not available" });
  }

  const { message, weatherData } = req.body;

  try {
    const systemPrompt = `You are a helpful weather assistant. You can discuss weather patterns, provide weather insights, and make predictions based on current weather data. You have access to current weather information and can provide detailed explanations about weather phenomena.

Current weather context: ${
      weatherData
        ? JSON.stringify(weatherData, null, 2)
        : "No current weather data provided"
    }

Be conversational, informative, and helpful. You can:
- Explain weather patterns
- Suggest activities based on weather
- Discuss seasonal changes
- Make predictions about weather trends
- Answer general weather questions`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    res.json({
      response: completion.choices[0].message.content,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("OpenAI API Error:", error);
    res.status(500).json({ error: "Failed to get AI response" });
  }
});

// Serve the main HTML file for any other routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

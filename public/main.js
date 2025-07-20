const city = document.querySelector(".city").textContent;
let currentWeatherData = null; // Store current weather data for AI context

function getIconEmoji(code, isNight) {
  if ([1000].includes(code)) return isNight ? "🌙" : "☀️";
  if ([1003].includes(code)) return isNight ? "🌤️" : "🌤️";
  if ([1006, 1009].includes(code)) return "☁️";
  if ([1030, 1135, 1147].includes(code)) return "🌫️";
  if ([1063, 1150, 1153, 1180, 1183, 1240].includes(code))
    return isNight ? "🌧️" : "🌦️";
  if ([1186, 1189, 1192, 1195, 1243, 1246].includes(code)) return "🌧️";
  if ([1066, 1210, 1213, 1216, 1219, 1222, 1225, 1255, 1258].includes(code))
    return "❄️";
  if (
    [1069, 1072, 1168, 1171, 1204, 1207, 1237, 1249, 1252, 1261, 1264].includes(
      code
    )
  )
    return "🌨️";
  if ([1087, 1273, 1276, 1279, 1282].includes(code)) return "⛈️";
  return "🌡️";
}

const isNight = (hour) => {
  return hour >= 18 || hour < 6;
};

function getWeatherByCity(city) {
  const URL = `/api/weather/${city}`;

  fetch(URL)
    .then((response) => response.json())
    .then((result) => {
      // Store weather data for AI context
      currentWeatherData = result;
      // data dari API
      const location = result.location;
      const current = result.current;
      const forecast = result.forecast;

      // check kondisi malam
      // const localHour = 19;
      const localHour = new Date(location.localtime).getHours();
      const nightMode = isNight(localHour);
      const emoji = getIconEmoji(current.condition.code, nightMode);

      // diambil dari tag HTML
      const body = document.body;
      const card = document.querySelector(".weather-card");
      const sun = document.querySelector(".sun");
      const moon = document.querySelector(".moon");

      if (nightMode) {
        body.dataset.mode = "night";
        card.dataset.mode = "night";
        sun.style.display = "none";
        moon.style.display = "block";
      } else {
        body.dataset.mode = "day";
        card.dataset.mode = "day";
        sun.style.display = "block";
        moon.style.display = "none";
      }

      document.querySelector(".city").textContent = location.name;
      document.querySelector(".date").textContent =
        new Date().toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "2-digit",
        });
      document.querySelector(
        ".humidity"
      ).textContent = `💦 ${current.humidity}%`;
      document.querySelector(
        ".wind"
      ).textContent = `💨 ${current.wind_kph} km/h`;
      document.querySelector(
        ".temperature"
      ).textContent = `${current.temp_c} °C`;
      document.querySelector(".weather-icon").textContent = emoji;

      updateForecast(forecast.forecastday.slice(1, 4), nightMode);
    })
    .catch((err) => {
      console.error(err);
    });
}

function updateForecast(days, nightMode) {
  const forecastItems = document.querySelectorAll(".forecast-item");
  days.forEach((day, index) => {
    const emoji = getIconEmoji(day.day.condition.code, nightMode);
    const label = new Date(day.date).toLocaleDateString("id-ID", {
      weekday: "long",
    });

    if (forecastItems[index]) {
      forecastItems[index].querySelector(".weather-day").textContent = label;
      forecastItems[index].querySelector(".weather-icon").textContent = emoji;
      forecastItems[index].querySelector(
        ".temperature-card"
      ).textContent = `${day.day.avgtemp_c} °C`;
    }
  });
}

window.onload = () => {
  getWeatherByCity(city);
  initializeChat();
  initializePredictions();
};

// AI Chat Functionality
function initializeChat() {
  const chatContainer = document.getElementById("chatContainer");
  const chatToggle = document.getElementById("chatToggle");
  const chatInput = document.getElementById("chatInput");
  const sendButton = document.getElementById("sendMessage");
  const chatMessages = document.getElementById("chatMessages");

  // Toggle chat window
  chatToggle.addEventListener("click", () => {
    chatContainer.classList.toggle("open");
  });

  // Send message on button click
  sendButton.addEventListener("click", sendMessage);

  // Send message on Enter key
  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  });

  function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    // Add user message to chat
    addMessageToChat(message, "user");
    chatInput.value = "";

    // Show typing indicator
    showTypingIndicator();

    // Send to AI
    fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message,
        weatherData: currentWeatherData,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        hideTypingIndicator();
        if (data.error) {
          addMessageToChat(
            "Sorry, I'm having trouble right now. Please try again later.",
            "ai"
          );
        } else {
          addMessageToChat(data.response, "ai");
        }
      })
      .catch((error) => {
        hideTypingIndicator();
        addMessageToChat(
          "Sorry, I encountered an error. Please try again.",
          "ai"
        );
        console.error("Chat error:", error);
      });
  }

  function addMessageToChat(message, sender) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${sender}`;
    messageDiv.textContent = message;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function showTypingIndicator() {
    const typingDiv = document.createElement("div");
    typingDiv.className = "typing-indicator";
    typingDiv.textContent = "🤖 AI is thinking...";
    typingDiv.id = "typing";
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function hideTypingIndicator() {
    const typing = document.getElementById("typing");
    if (typing) {
      typing.remove();
    }
  }

  // Add welcome message
  setTimeout(() => {
    addMessageToChat(
      "Hi! I'm your weather AI assistant. Ask me anything about the weather! 🌤️",
      "ai"
    );
  }, 1000);
}

// Weather Predictions Functionality
function initializePredictions() {
  const predictButton = document.getElementById("predictWeather");

  predictButton.addEventListener("click", async () => {
    predictButton.textContent = "🔮 Analyzing...";
    predictButton.disabled = true;

    try {
      const response = await fetch(`/api/predict/${city}`);
      const predictions = await response.json();

      if (predictions.error) {
        alert("Unable to generate predictions. Please try again.");
      } else {
        showPredictions(predictions);
      }
    } catch (error) {
      alert("Error getting predictions. Please try again.");
      console.error("Prediction error:", error);
    } finally {
      predictButton.textContent = "🔮 7-Day Predictions";
      predictButton.disabled = false;
    }
  });
}

function showPredictions(data) {
  const modalHTML = `
    <div class="prediction-modal" id="predictionModal">
      <div class="prediction-content">
        <div class="prediction-header">
          <h2>🔮 7-Day Weather Predictions for ${data.city}</h2>
          <button class="close-modal" onclick="closePredictionModal()">&times;</button>
        </div>
        
        <div class="trends-section">
          <h3>📊 Weather Trends</h3>
          <div class="trends-grid">
            <div class="trend-item">
              <span>🌡️ Temperature:</span>
              <span class="trend-${data.trends.temperatureTrend}">${
    data.trends.temperatureTrend
  }</span>
            </div>
            <div class="trend-item">
              <span>💧 Humidity:</span>
              <span class="trend-${data.trends.humidityTrend}">${
    data.trends.humidityTrend
  }</span>
            </div>
            <div class="trend-item">
              <span>🌧️ Rain Chance:</span>
              <span class="trend-${data.trends.rainTrend}">${
    data.trends.rainTrend
  }</span>
            </div>
          </div>
        </div>

        <div class="predictions-grid">
          ${data.predictions
            .map(
              (pred) => `
            <div class="prediction-day">
              <div class="pred-date">${new Date(pred.date).toLocaleDateString(
                "en-US",
                { weekday: "short", month: "short", day: "numeric" }
              )}</div>
              <div class="pred-temp">${pred.maxTemp}° / ${pred.minTemp}°</div>
              <div class="pred-condition">${pred.condition}</div>
              <div class="pred-rain">Rain: ${pred.chanceOfRain}%</div>
              <div class="pred-confidence">Confidence: ${pred.confidence}%</div>
            </div>
          `
            )
            .join("")}
        </div>

        <div class="recommendations-section">
          <h3>💡 Recommendations</h3>
          <ul>
            ${data.recommendations.map((rec) => `<li>${rec}</li>`).join("")}
          </ul>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHTML);
}

function closePredictionModal() {
  const modal = document.getElementById("predictionModal");
  if (modal) {
    modal.remove();
  }
}

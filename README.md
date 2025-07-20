# Weather-Forecast 🌤️

A beautiful weather application built with Express.js and vanilla JavaScript that provides real-time weather information and forecasts.

## Features

- Real-time weather data
- 3-day weather forecast
- Day/night mode with beautiful UI
- Secure API key handling
- Weather icons with emojis

## Setup

1. Clone this repository:

```bash
git clone <your-repo-url>
cd cuyweather
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file and add your Weather API key:

```env
WEATHER_API_KEY=your_api_key_from_weatherapi.com
```

4. Start the server:

```bash
npm start
```

For development with auto-restart:

```bash
npm run dev
```

5. Open your browser and go to `http://localhost:3000`

## Environment Variables

Copy `.env.example` to `.env` and fill in your API key:

- `WEATHER_API_KEY`: Your API key from [WeatherAPI.com](https://www.weatherapi.com/)

## Project Structure

```
cuyweather/
├── Express.js          # Server file
├── .env               # Environment variables (not in repo)
├── .env.example       # Environment variables template
├── .gitignore         # Git ignore rules
├── package.json       # NPM dependencies
└── public/           # Static files
    ├── index.html    # Main HTML file
    ├── style.css     # Styles
    ├── main.js       # Frontend JavaScript
    └── assets/       # Images
```

## Deployment

This app can be deployed to:

- **Vercel**: `npm install -g vercel && vercel`
- **Railway**: Connect your GitHub repo
- **Render**: Connect your GitHub repo
- **Heroku**: Use Heroku CLI

Make sure to set the `WEATHER_API_KEY` environment variable in your deployment platform.

## License

MIT License

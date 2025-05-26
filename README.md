# Foreign License Appointment Tracker 🚗🇯🇵

Automated tool to monitor Tokyo license conversion appointments. Notifies when slots open up within the next 10 days.

## Features
- 🕵️ Automated screenshot capture of appointment system
- 🤖 AI analysis using OpenAI gpt-4.1-mini realesed April 22, 2025
- 🔔 Audio & console alerts when appointments found
- ♻️ Configurable check interval (default: 30 seconds)
- 🗑️ Automatic cleanup of screenshot files

## Getting Started

### Prerequisites
- Node.js v18+
- npm
- OpenAI API key

```bash
git clone https://github.com/parkerhutcheson/foreign-license-appointment-tracker.git
cd foreign-license-appointment-tracker
npm install
```

### Configuration
1. Create `.env` file:
```env
OPENAI_API_KEY=your_key_here
```

2. Customize constants in `utils/constants.js`:
```javascript
export const CHECK_INTERVAL = 30000; // 30 seconds
export const SCREENSHOTS_DIR = './screenshots'; // Storage path
```

3. Add alert sound file at `./sounds/aiscream.mp3` (or add something less annoying)

## Usage
```bash
npm start
```

## How It Works
1. Takes screenshot of appointment portal every x seconds/minutes
2. Uses AI to analyze for available dates
3. Triggers alarm if any slot within 10 days is found
4. Logs results and cleans up screenshot files

## Disclaimer
Use responsibly. Frequent checks may get your IP blocked. Always comply with the official portal's terms of service.
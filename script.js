import { captureScreenshot } from "./utils/screenshotUtils.js";
import { analyzeScreenshot } from "./utils/analysisUtils.js";
import { scrapeForAppointments } from "./utils/scrapeSite.js";
import { deleteFile } from "./utils/fileUtils.js";
import { CHECK_INTERVAL, SCREENSHOTS_DIR, USE_CHATGPT } from "./utils/constants.js";
import playSound from 'play-sound';

const player = playSound();

async function checkAppointments() {
  try {
    const timestamp = new Date().toLocaleString();
    console.log(`[${timestamp}] Checking appointments...`);
    
    let appointments = [];
    if (USE_CHATGPT) {
      console.log("Using ChatGPT analysis for appointments.");
      const screenshotPath = await captureScreenshot();
      appointments = await analyzeScreenshot(screenshotPath);
    } else {
      appointments = await scrapeForAppointments();
    }
    
    if (appointments.length === 0) {
      if (USE_CHATGPT) deleteFile(screenshotPath);
      console.log("No appointments available");
    } else {
      // Play sound only when appointments are found
      try {
        player.play('./sounds/aiscream.mp3', (err) => {
          if (err) {
            console.error('Could not play sound:', err);
            // Fallback to system beep
            process.stdout.write('\x07');
          }
        });
      } catch (e) {
        console.error('Sound error:', e.message);
        process.stdout.write('\x07');
      }

      console.log(`Found ${appointments.length} appointments:`);
      appointments.forEach((app, index) => {
        console.log(`${index + 1}. ${app.date} | ${app.location} | ${app.type} | 29-Country: ${app.is29Country ? 'Yes' : 'No'}`);
      });
    }

    return appointments;
  } catch (error) {
    console.error("Error during appointment check:", error.message);
    return [];
  }
}

// Process handlers and monitoring system remains the same
async function startMonitoring() {
  console.log(`Starting appointment monitor (checking every ${CHECK_INTERVAL / 1000}s)...`);
  await checkAppointments();
  setInterval(checkAppointments, CHECK_INTERVAL);
}

process.on('SIGINT', () => {
  console.log('\nShutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down...');
  process.exit(0);
});

startMonitoring().catch(error => {
  console.error("Failed to start monitoring:", error);
  process.exit(1);
});
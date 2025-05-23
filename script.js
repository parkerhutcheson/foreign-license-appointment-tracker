import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import OpenAI from "openai";
import { z } from "zod";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY
});

// Zod schema definitions
const AppointmentSchema = z.object({
  location: z.enum(["府中試験場", "鮫洲試験場", "江東試験場"]),
  is29Country: z.boolean(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum([
    "29の国･地域以外の方で、住民票のある方",
    "29の国･地域以外の方で、住民票のない方",
    "29の国･地域の方"
  ])
});

const AnalysisSchema = z.array(AppointmentSchema);

// Configuration
const APPOINTMENT_URL = "https://www.keishicho-gto.metro.tokyo.lg.jp/keishicho-u/reserve/offerList_detail?tempSeq=363&accessFrom=offerList";
const SCREENSHOTS_DIR = path.join(process.cwd(), "screenshots");
const CHECK_INTERVAL = 30000;

// Utility functions
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function deleteFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error(`Failed to delete file ${filePath}:`, error.message);
  }
}

function extractJSON(text) {
  // Remove markdown code blocks if present
  const cleanText = text.replace(/```json\s*|\s*```/g, '').trim();
  
  // Try to find JSON array in the text
  const jsonMatch = cleanText.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    return jsonMatch[0];
  }
  
  // If no array found, return the cleaned text
  return cleanText;
}

// Core functionality
async function captureScreenshot() {
  ensureDirectoryExists(SCREENSHOTS_DIR);

  const browser = await puppeteer.launch({ 
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  await page.goto(APPOINTMENT_URL, {
    waitUntil: "networkidle2",
    timeout: 60000,
  });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const screenshotPath = path.join(SCREENSHOTS_DIR, `screenshot-${timestamp}.png`);

  await page.screenshot({
    path: screenshotPath,
    fullPage: true,
  });

  await browser.close();
  return screenshotPath;
}

async function analyzeScreenshot(filePath) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a JSON extraction assistant. Always respond with valid JSON only, no markdown formatting or explanations."
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Extract appointment data from this Japanese police appointment screenshot. Return only a JSON array with this exact structure:

[
  {
    "location": "府中試験場",
    "is29Country": true,
    "date": "2025-05-23",
    "type": "29の国･地域の方"
  }
]

NOTE THAT THE ABOVE IS JUST AN EXAMPLE. DO NOT INCLUDE IT IN YOUR RESPONSE.
Valid locations: 府中試験場, 鮫洲試験場, 江東試験場
Valid types: "29の国･地域以外の方で、住民票のある方", "29の国･地域以外の方で、住民票のない方", "29の国･地域の方"

If no appointments found, return: []`,
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/png;base64,${fs.readFileSync(filePath, {
                encoding: "base64",
              })}`,
            },
          },
        ],
      },
    ],
    temperature: 0,
  });

  const analysisText = response.choices[0].message.content;
  
  try {
    const jsonText = extractJSON(analysisText);
    const rawData = JSON.parse(jsonText);
    const parsed = AnalysisSchema.safeParse(rawData);

    if (!parsed.success) {
      console.error("Schema validation failed:", parsed.error.format());
      return [];
    }

    return parsed.data;
  } catch (error) {
    console.error("Failed to parse analysis:", error.message);
    console.error("Raw response:", analysisText);
    return [];
  }
}

async function checkAppointments() {
  try {
    const timestamp = new Date().toLocaleString();
    console.log(`[${timestamp}] Checking appointments...`);
    
    const screenshotPath = await captureScreenshot();
    const appointments = await analyzeScreenshot(screenshotPath);
    
    // deleteFile(screenshotPath);

    if (appointments.length === 0) {
      console.log("No appointments available");
    } else {
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

// Monitoring system
async function startMonitoring() {
  console.log(`Starting appointment monitor (checking every ${CHECK_INTERVAL / 1000}s)...\n`);

  await checkAppointments();
  setInterval(checkAppointments, CHECK_INTERVAL);
}

// Process handlers
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down...');
  process.exit(0);
});

// Start the system
startMonitoring().catch(error => {
  console.error("Failed to start monitoring:", error);
  process.exit(1);
});
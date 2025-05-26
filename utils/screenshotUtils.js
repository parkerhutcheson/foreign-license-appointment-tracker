import puppeteer from "puppeteer";
import path from "path";
import { APPOINTMENT_URL, SCREENSHOTS_DIR } from "./constants.js";
import { ensureDirectoryExists } from "./fileUtils.js";

export async function captureScreenshot() {
  ensureDirectoryExists(SCREENSHOTS_DIR);
  const browser = await puppeteer.launch({ 
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto(APPOINTMENT_URL, { waitUntil: "networkidle2", timeout: 60000 });

  // Evaluate the page's dimensions
  const pageDimensions = await page.evaluate(() => {
    return {
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
    };
  });

  const clipHeight = 2800; // how much from the bottom you want
  const screenshotRegion = {
    x: 0,
    y: pageDimensions.height - clipHeight,
    width: pageDimensions.width,
    height: clipHeight,
  };

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const screenshotPath = path.join(SCREENSHOTS_DIR, `screenshot-${timestamp}.png`);

  await page.screenshot({ path: screenshotPath, clip: screenshotRegion });
  await browser.close();
  return screenshotPath;
}

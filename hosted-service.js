// hosted-service.js

const puppeteer = require('puppeteer');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const port = 3000;

async function openProfile(profileNumber, debuggerAddress) {
  const browser = await puppeteer.connect({ browserURL: `http://${debuggerAddress}` });
  const page = await browser.newPage();

  try {
    // Read the text from the 'n.txt' file based on the profile number
    const filePath = 'C:\\n.txt'; // Modify this line with your custom path
    const lines = (await fs.readFile(filePath, 'utf-8')).split('\n');
    const searchText = lines[profileNumber - 1].trim();

    // Navigate to the YouTube channel switcher
    await page.goto('https://youtube.com/channel_switcher');

    // Find the element with the specified text content
    const selector = `//*[contains(text(), '${searchText}')]`;
    const element = await page.$x(selector);

    if (element.length > 0) {
      await element[0].click();
      console.log(`Clicked on element in Profile ${profileNumber} using text: "${searchText}"`);
    } else {
      console.log(`Element not found in Profile ${profileNumber} using text: "${searchText}"`);
    }

    // Wait for 4 seconds to see the action (adjust as needed)
    await page.waitForTimeout(3000);
  } catch (error) {
    console.error(`Error processing Profile ${profileNumber}:`, error.message);
  } finally {
    // Close the browser
    await browser.close();
  }
}

async function runProfiles() {
  // Generate an array of debugger addresses from 9222 to 9522
  const startPort = 9222;
  const endPort = 9522;
  const debuggerAddresses = Array.from({ length: endPort - startPort + 1 }, (_, i) => `127.0.0.1:${startPort + i}`);

  // Get the directory of the current executable
  const scriptDirectory = path.dirname(process.argv[1]);

  // Iterate through profiles and debugger addresses
  const numProfiles = Math.min(300, debuggerAddresses.length);
  for (let profileNumber = 1; profileNumber <= numProfiles; profileNumber++) {
    const debuggerAddress = debuggerAddresses[profileNumber - 1];
    await openProfile(profileNumber, debuggerAddress);
    // Add a delay before running the next profile (adjust as needed)
    await new Promise((resolve) => setTimeout(resolve, 3500));
  }
}

// Express endpoint to handle requests
app.use(bodyParser.json());

app.post('/openProfile', async (req, res) => {
  const { profileNumber, debuggerAddress } = req.body;
  await openProfile(profileNumber, debuggerAddress);
  res.json({ message: `Profile ${profileNumber} opened successfully` });
});

app.post('/runProfiles', async (req, res) => {
  await runProfiles();
  res.json({ message: 'Profiles run successfully' });
});

// Start the Express server
app.listen(port, () => {
  console.log(`Hosted service is running at http://localhost:${port}`);
});

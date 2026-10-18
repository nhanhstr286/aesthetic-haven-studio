const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("Dang mo Pinterest Pin Creation...");
  await page.goto('https://www.pinterest.com/pin-creation-tool/');
})();

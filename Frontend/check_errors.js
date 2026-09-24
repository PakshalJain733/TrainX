const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('PAGE ERROR LOG:', msg.text());
    }
  });

  page.on('pageerror', err => {
    console.log('PAGE EXCEPTION:', err.toString());
  });

  try {
    await page.goto('http://localhost:5175/admin', { waitUntil: 'networkidle0', timeout: 10000 });
    console.log('Successfully loaded /admin');
  } catch (err) {
    console.log('Error loading /admin:', err.message);
  }

  try {
    await page.goto('http://localhost:5175/coordinator', { waitUntil: 'networkidle0', timeout: 10000 });
    console.log('Successfully loaded /coordinator');
  } catch (err) {
    console.log('Error loading /coordinator:', err.message);
  }
  
  await browser.close();
})();

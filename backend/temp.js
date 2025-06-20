import puppeteer from "puppeteer";
(async () => {
  const browser = await puppeteer.launch({
    headless: false, // login manually
    userDataDir: "./yt-session", // save login session
  });

  const page = await browser.newPage();
  await page.goto("https://www.youtube.com");

  console.log("🚀 Please login manually. Close browser after login.");
})();

import { chromium } from "playwright";

const BASE = "http://localhost:3311";

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("response", (r) => {
  if (r.status() >= 500) errors.push(`${r.status()} ${r.url()}`);
});

console.log("1) /new — fill intro + intake");
await page.goto(`${BASE}/new`, { waitUntil: "networkidle" });
await page.fill('input[name="name"]', "Test Bakery LLC");
await page.fill('input[name="owner_name"]', "Erkin Test");
await page.fill('input[name="sector"]', "Artisan bakery");
await page.selectOption('select[name="time_in_operation"]', "1-3y");
await page.selectOption('select[name="customer_payment_status"]', "C");
await page.selectOption('select[name="people_band"]', "2-5");
await page.selectOption('select[name="customer_base_band"]', "26-100");
await page.check('input[name="in_place__paying_customers"]');
await page.check('input[name="in_place__active_reach"]');
await page.check('input[name="in_place__product_delivered"]');
await page.check('input[name="funding_basis"][value="own_revenue"]');
await page.click('button[type="submit"]');
await page.waitForURL(/\/assessment\//, { timeout: 10000 });
console.log("   -> reached", page.url());

console.log("2) /assessment/[id] — answer every question, submit");
// Every question is a required radio group named health__* / risk__* / owner_exposure_level.
const names = await page.$$eval("input[type=radio]", (els) => [...new Set(els.map((e) => e.name))]);
console.log(`   radio groups found: ${names.length} (expect 45 health + up to 20 risk + 1 owner = up to 66)`);
for (const name of names) {
  // pick a mid-range value (C) where present, else the first option, to get a realistic mixed profile
  const options = await page.$$eval(`input[name="${name}"]`, (els) => els.map((e) => e.value));
  const pick = options.includes("C") ? "C" : options[0];
  await page.check(`input[name="${name}"][value="${pick}"]`);
}
await page.click('button[type="submit"]');
await page.waitForURL(/\/results\//, { timeout: 15000 });
console.log("   -> reached", page.url());

console.log("3) /results/[id] — verify scores rendered");
const healthScore = await page.textContent("text=/Business Health/");
console.log("   Business Health card present:", !!healthScore);
const bodyText = await page.textContent("body");
if (!/\d+\s*\/\s*100/.test(bodyText)) throw new Error("No score (.../100) found on results page");
console.log("   scores render OK");

console.log("4) /plan/[id] — verify action plan renders");
await page.click('text=View action plan');
await page.waitForURL(/\/plan\//, { timeout: 10000 });
const cardCount = await page.$$eval('h2', (els) => els.length);
console.log("   action item headings found:", cardCount);
if (cardCount < 1) throw new Error("No action plan items rendered");

console.log("5) confirm the first action item, if it has a confirm form");
const confirmForms = await page.$$('form:has(button:has-text("Mark as delivered"))');
console.log("   confirmable items:", confirmForms.length);
if (confirmForms.length > 0) {
  await confirmForms[0].$eval('button[type="submit"]', (b) => b.click());
  await page.waitForURL(/\/plan\//, { timeout: 10000 });
  console.log("   -> confirm submitted, back on", page.url());
}

console.log("\nERRORS:", errors.length ? errors : "none");
await browser.close();
if (errors.length) process.exit(1);
console.log("\nSMOKE TEST PASSED");

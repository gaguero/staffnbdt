const { chromium } = require('playwright');

async function runTenantSwitchVerification() {
  console.log('🚀 Starting tenant switch verification (dev)...');

  let browser;
  try {
    browser = await chromium.launch({ headless: false, slowMo: 200, channel: 'chrome' });
  } catch {
    browser = await chromium.launch({ headless: false, slowMo: 200 });
  }
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    const baseUrl = 'https://frontend-copy-production-f1da.up.railway.app';

    console.log('📍 Navigating to dev frontend...');
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // If not authenticated, navigate to login and sign in
    if (!/dashboard/i.test(await page.title()) && !/dashboard/.test(page.url())) {
      await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
    }

    const email = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    const password = page.locator('input[type="password"], input[name="password"], input[placeholder*="password" i]').first();
    if (await email.count() && await password.count()) {
      console.log('🔐 Logging in as PLATFORM_ADMIN...');
      await email.fill('admin@nayara.com');
      await password.fill('password123');
      await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first().click();
      await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    }

    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'test-results/tenant-00-dashboard-initial.png', fullPage: true });

    // Helper: switch organization by visible label in header combobox
    async function switchOrganization(label) {
      console.log(`🔁 Switching organization to: ${label}`);
      // try header select first
      const selects = page.locator('select');
      if (await selects.count()) {
        await selects.first().selectOption({ label });
        // Wait for potential reload
        await page.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {});
        await page.waitForTimeout(1500);
      }
    }

    // Switch to Taso Group
    await switchOrganization('Taso Group');
    await page.screenshot({ path: 'test-results/tenant-01-dashboard-taso.png', fullPage: true });

    // Visit Properties
    await page.goto(`${baseUrl}/properties`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/tenant-02-properties-taso.png', fullPage: true });

    // Visit Departments
    await page.goto(`${baseUrl}/departments`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/tenant-03-departments-taso.png', fullPage: true });

    // Visit Users
    await page.goto(`${baseUrl}/users`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/tenant-04-users-taso.png', fullPage: true });

    // Visit Roles
    await page.goto(`${baseUrl}/admin/roles`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/tenant-05-roles-taso.png', fullPage: true });

    // Switch back to Default Organization
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    await switchOrganization('Default Organization');
    await page.screenshot({ path: 'test-results/tenant-06-dashboard-default.png', fullPage: true });

    // Re-visit key pages under Default Organization
    for (const [route, name] of [
      ['/properties', 'properties'],
      ['/departments', 'departments'],
      ['/users', 'users'],
      ['/admin/roles', 'roles']
    ]) {
      await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `test-results/tenant-07-${name}-nayara.png`, fullPage: true });
    }

    console.log('🔍 Console errors:', consoleErrors.length);
    if (consoleErrors.length) {
      consoleErrors.slice(0, 10).forEach((e, i) => console.log(`ERR[${i+1}]:`, e));
    }

    console.log('✅ Tenant switch verification completed. Screenshots saved in test-results/.');
  } catch (err) {
    console.error('❌ Tenant switch verification failed:', err.message);
    try { await page.screenshot({ path: 'test-results/tenant-error.png', fullPage: true }); } catch {}
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }
}

runTenantSwitchVerification();



import { Page, expect } from '@playwright/test';

/**
 * Page Object Model for the Login page
 * Handles login functionality and authentication state
 */
export class LoginPage {
  constructor(private page: Page) {}

  // Locators
  get emailInput() { return this.page.locator('input[name="email"], input[type="email"]'); }
  get passwordInput() { return this.page.locator('input[name="password"], input[type="password"]'); }
  get loginButton() { return this.page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")'); }
  get errorMessage() { return this.page.locator('[role="alert"], .error-message, .alert-error'); }

  /**
   * Perform login with credentials
   */
  async login(email: string, password: string) {
    console.log(`🔐 Logging in as ${email}...`);
    
    // Wait for login form to be visible
    await this.emailInput.waitFor({ state: 'visible', timeout: 10000 });
    
    // Fill login form
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    
    // Submit form
    await this.loginButton.click();
    
    // Wait for navigation or error
    try {
      await this.page.waitForURL('**/dashboard', { timeout: 15000 });
    } catch (timeoutError) {
      // Check if we're still on login page (login failed) or if there's an error message
      const currentUrl = this.page.url();
      if (currentUrl.includes('/login')) {
        // Try to find error message
        const hasErrorMessage = await this.errorMessage.isVisible();
        if (hasErrorMessage) {
          const errorText = await this.errorMessage.textContent();
          throw new Error(`Login failed with error: ${errorText}`);
        }
        throw new Error('Login failed - still on login page');
      }
      // If we're not on login page, assume success
      console.log(`Login appears successful, current URL: ${currentUrl}`);
    }
    
    console.log('✅ Login successful');
  }

  /**
   * Verify we're on the login page
   */
  async verifyOnLoginPage() {
    await expect(this.page).toHaveURL(/\/login/);
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.loginButton).toBeVisible();
  }

  /**
   * Verify successful login by checking we're redirected
   */
  async verifyLoginSuccess() {
    await this.page.waitForURL('**/dashboard', { timeout: 15000 });
    await expect(this.page).toHaveURL(/\/dashboard/);
  }
}
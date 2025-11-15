import { Page, expect } from '@playwright/test';

export class TestHelpers {
  constructor(private page: Page) {}

  async login(
    email: string = 'test@example.com',
    password: string = 'password123'
  ) {
    await this.page.goto('/');
    await this.page.fill('input[type="email"]', email);
    await this.page.fill('input[type="password"]', password);
    await this.page.click('button[type="submit"]');
  }

  async mockAuthenticatedUser(role: string = 'user') {
    await this.page.addInitScript(userRole => {
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem(
        'user',
        JSON.stringify({
          id: 1,
          email: 'test@example.com',
          role: userRole,
        })
      );
    }, role);
  }

  async mockApiResponse(endpoint: string, response: any, status: number = 200) {
    await this.page.route(`**${endpoint}`, async route => {
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    });
  }

  async waitForApiCall(endpoint: string): Promise<any> {
    return new Promise(resolve => {
      this.page.on('response', async response => {
        if (response.url().includes(endpoint)) {
          const data = await response.json();
          resolve(data);
        }
      });
    });
  }

  async takeScreenshot(name: string, fullPage: boolean = false) {
    await this.page.screenshot({
      path: `test-results/screenshots/${name}.png`,
      fullPage,
    });
  }

  async checkNoConsoleErrors() {
    const errors: string[] = [];

    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await this.page.waitForLoadState('networkidle');

    const criticalErrors = errors.filter(
      error =>
        !error.includes('favicon') &&
        !error.includes('404') &&
        !error.includes('net::ERR_FAILED')
    );

    expect(criticalErrors).toHaveLength(0);
  }

  async fillStudyForm(data: {
    title: string;
    description: string;
    category?: string;
  }) {
    await this.page.fill('input[name="title"]', data.title);
    await this.page.fill('textarea[name="description"]', data.description);

    if (data.category) {
      await this.page.selectOption('select[name="category"]', data.category);
    }
  }

  async waitForNavigation(expectedUrl: string | RegExp) {
    await expect(this.page).toHaveURL(expectedUrl);
  }
}

export const mockStudies = [
  {
    id: 1,
    title: 'Climate Impact Study',
    status: 'active',
    category: 'climate',
  },
  {
    id: 2,
    title: 'Food Security Analysis',
    status: 'draft',
    category: 'food-security',
  },
  {
    id: 3,
    title: 'Water Resource Assessment',
    status: 'completed',
    category: 'water',
  },
];

export const mockUsers = {
  admin: { id: 1, email: 'admin@example.com', role: 'admin' },
  researcher: { id: 2, email: 'researcher@example.com', role: 'researcher' },
  user: { id: 3, email: 'user@example.com', role: 'user' },
};

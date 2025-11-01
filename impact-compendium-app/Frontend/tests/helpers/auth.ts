import { Page } from '@playwright/test';

export async function loginAsAdmin(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('ic_access_token', 'mock-admin-token');
    localStorage.setItem('ic_user', JSON.stringify({
      email: 'admin@example.com',
      sub: '123',
      groups: ['admin']
    }));
  });

  await page.route('**/api/auth/me', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        email: 'admin@example.com',
        sub: '123',
        groups: ['admin']
      })
    });
  });
}

export async function loginAsUser(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('ic_access_token', 'mock-user-token');
    localStorage.setItem('ic_user', JSON.stringify({
      email: 'user@example.com',
      sub: '456',
      groups: ['researchers']
    }));
  });

  await page.route('**/api/auth/me', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        email: 'user@example.com',
        sub: '456',
        groups: ['researchers']
      })
    });
  });
}

export async function mockStudiesAPI(page: Page, studies: any[] = []) {
  await page.route('**/api/studies*', async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          studies,
          total: studies.length
        })
      });
    }
  });
}

export async function mockUsersAPI(page: Page, users: any[] = []) {
  await page.route('**/api/users', async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(users)
      });
    }
  });
}

import { test, expect, type Page } from '@playwright/test';

async function doSet(page: Page, fallbackWeight = '50') {
  const weight = page.getByLabel('weight', { exact: true });
  if ((await weight.inputValue()) === '') await weight.fill(fallbackWeight);
  if (await page.getByText('To failure', { exact: true }).isVisible()) {
    await page.getByRole('button', { name: 'Increase reps' }).click(); // beat the target by one
  }
  await page.locator('footer .pill').click();
}

test('a full Push session: log, rest, failure sets, resume, summary, history, progression', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();
  await expect(page.getByText('Up next in rotation')).toBeVisible();
  await page.getByRole('button', { name: /Start Push/ }).click();

  // Overview: 7 exercises, swap opens alternatives
  await expect(page.getByText('7 exercises')).toBeVisible();
  await page.getByRole('button', { name: 'Swap Cable flys' }).click();
  await expect(page.getByRole('radio', { name: 'Pec deck' })).toBeVisible();
  await page.getByRole('button', { name: 'Swap Cable flys' }).click();
  await page.getByRole('button', { name: /Begin · Bench press/ }).click();

  // First ever set: weight must be entered once
  await expect(page.getByRole('heading', { name: 'Bench press' })).toBeVisible();
  await expect(page.getByText('Set 1 of 4 · target 8 reps')).toBeVisible();
  await expect(page.locator('footer .pill')).toBeDisabled();
  await page.getByLabel('weight', { exact: true }).fill('185');
  await page.locator('footer .pill').click();

  // Rest starts automatically with Push's 2:30
  await expect(page.getByRole('heading', { name: 'Rest' })).toBeVisible();
  await expect(page.getByText('of 2:30 rest')).toBeVisible();
  await expect(page.getByText('185 × 8').first()).toBeVisible();
  await page.getByRole('button', { name: '+30s' }).click();
  await expect(page.getByText('of 3:00 rest')).toBeVisible();

  // Edit takes the set back with its values
  await page.getByRole('button', { name: /Set 1 logged/ }).click();
  await expect(page.getByText('Set 1 of 4 · target 8 reps')).toBeVisible();
  await expect(page.getByLabel('weight', { exact: true })).toHaveValue('185');
  await page.locator('footer .pill').click();
  await page.getByRole('button', { name: /Skip rest/ }).click();

  // Reload mid-workout resumes on the same set with the same weight
  await expect(page.getByText('Set 2 of 4 · target 8 reps')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Set 2 of 4 · target 8 reps')).toBeVisible();
  await expect(page.getByLabel('weight', { exact: true })).toHaveValue('185');

  // Sets 2–3, then the failure set
  for (let i = 0; i < 2; i++) { await doSet(page); await page.getByRole('button', { name: /Skip rest/ }).click(); }
  await expect(page.getByText('To failure', { exact: true })).toBeVisible();
  await expect(page.getByText('Reps hit')).toBeVisible();
  await doSet(page); // logs 185 × 9

  // Rest of the session: act only once the next screen has rendered
  const screen = page.locator('[data-screen]');
  await expect(screen).toHaveAttribute('data-screen', 'rest:4');
  for (let guard = 0; guard < 60; guard++) {
    const key = (await screen.getAttribute('data-screen'))!;
    if (key === 'summary') break;
    if (key.startsWith('rest:')) await page.getByRole('button', { name: /Skip rest|Start set/ }).click();
    else await doSet(page);
    await expect(screen).not.toHaveAttribute('data-screen', key);
  }

  // Summary
  await expect(page.getByRole('heading', { name: 'Session done' })).toBeVisible();
  await expect(page.getByText('22 of 22 sets')).toBeVisible();
  await expect(page.getByText('Total volume')).toBeVisible();
  const benchRow = page.locator('li', { hasText: 'Bench press' });
  await expect(benchRow).toContainText('185 · 8 8 8 9');
  await expect(benchRow).toContainText('190');
  await page.getByRole('button', { name: 'Done' }).click();

  // Rotation moved on; history shows today
  await expect(page.getByText('Up next in rotation')).toBeVisible();
  await expect(page.getByRole('button', { name: /Start Pull/ })).toBeVisible();
  await page.getByRole('button', { name: 'History' }).click();
  await expect(page.getByRole('button', { name: /, Push$/ })).toBeVisible();
  await expect(page.getByText('190').first()).toBeHidden(); // trend shows 185 working weight
  await expect(page.getByText(/185/).first()).toBeVisible();
  await page.getByRole('button', { name: 'Back' }).click();

  // Next Push suggests +5 on bench
  await page.getByRole('radio', { name: 'Push' }).click();
  await page.getByRole('button', { name: /Start Push/ }).click();
  await page.getByRole('button', { name: /Begin · Bench press/ }).click();
  await expect(page.getByLabel('weight', { exact: true })).toHaveValue('190');
  await expect(page.getByText('+5 lb')).toBeVisible();
});

test('works offline after the first visit', async ({ page, context }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload(); // let the SW take control
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();
  await page.getByRole('button', { name: /Start Push/ }).click();
  await page.getByRole('button', { name: /Begin/ }).click();
  await page.getByLabel('weight', { exact: true }).fill('135');
  await page.locator('footer .pill').click();
  await expect(page.getByRole('heading', { name: 'Rest' })).toBeVisible();
});

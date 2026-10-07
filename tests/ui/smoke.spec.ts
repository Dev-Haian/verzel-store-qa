import { test, expect } from '@playwright/test';

// Smoke: garante que a loja está no ar antes dos cenários de negócio.
// Os cenários do cupom e do frete grátis (CT01, CT10, ...) entram em arquivos próprios,
// por exemplo tests/ui/cupom.spec.ts, usando o ID do cenário no título do teste.
test('loja carrega a página inicial', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Verzel Store/);
  await expect(page.locator('#root')).not.toBeEmpty();
});

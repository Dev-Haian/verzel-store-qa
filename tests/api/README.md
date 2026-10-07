# Testes de API

Coloque aqui os testes dos endpoints descritos na documentação, usando o fixture `request` do Playwright:

```ts
import { test, expect } from '@playwright/test';

test('CTxx · <comportamento esperado>', async ({ request }) => {
  const res = await request.get('/api/<endpoint>');
  expect(res.status()).toBe(200);
  const body = await res.json();
  // validar valores, não só o status
});
```

A `baseURL` vem do `playwright.config.ts`.

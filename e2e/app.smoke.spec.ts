import { expect, test } from '@playwright/test'

test('loads the Apex application shell', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('body')).toContainText(/Apex AI Copilot|Type a message|Escreva uma mensagem|Sign in/i)
})

test('returns platform status plan from the backend', async ({ request }) => {
  const response = await request.post('http://127.0.0.1:4177/api/copilot/metrics-plan', {
    data: {
      goal: 'status geral da plataforma',
      projectSummary: {
        name: 'Apex Project',
        files: 0,
        messages: 0,
        exports: 0,
        activeStudio: 'none',
        generationHistory: 0,
      },
      runtimeSummary: {
        selectedModel: 'test-model',
        modelState: 'ready',
        lastResponseMode: 'local',
        persistenceMode: 'localStorage',
      },
    },
  })

  expect(response.ok()).toBeTruthy()

  const data = await response.json()
  expect(data.plan.providerStatus).toBe('LOCAL_RUNTIME_STATUS')
  expect(Array.isArray(data.plan.connectorStatus)).toBeTruthy()
})

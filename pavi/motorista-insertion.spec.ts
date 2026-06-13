import { test, expect } from '@playwright/test';

test('deve inserir um novo motorista com sucesso', async ({ page }) => {
  // 1. Acessa a aplicação
  await page.goto('http://localhost:4200/#/motoristas');

  // 2. Abre o modal de novo motorista
  await page.click('button:has-text("Novo motorista")');

  // 3. Preenche os campos obrigatórios
  await page.fill('input[placeholder="Nome completo"]', 'Motorista de Teste Automatizado');
  await page.selectOption('select', { label: 'Masculino' }); // Sexo
  
  // Preenche Data de Nascimento (selecionando pelo label ou ordem se necessário)
  // Como são vários inputs de data, vamos usar o seletor mais específico
  const dateInputs = page.locator('input[type="date"]');
  await dateInputs.nth(0).fill('1985-10-10'); // Data de Nascimento
  await dateInputs.nth(1).fill('2030-12-31'); // Validade CNH

  await page.fill('input[inputmode="numeric"]', '99988877766'); // CNH
  
  // Seleciona a primeira cidade disponível
  await page.locator('select').nth(1).selectOption({ index: 1 });

  // 4. Clica em Criar
  await page.click('button:has-text("Criar motorista")');

  // 5. Verifica se o modal fechou ou se houve mensagem de sucesso
  await expect(page.locator('.pv-modal')).not.toBeVisible();
  
  // 6. Verifica se o nome aparece na tabela
  await expect(page.locator('table')).toContainText('Motorista de Teste Automatizado');
});

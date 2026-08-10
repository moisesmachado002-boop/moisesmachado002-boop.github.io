(() => {
  const form = document.getElementById('transactionForm');
  if (!form) return;

  const typeSelect = form.elements.type;
  const categorySelect = form.elements.category;
  const descriptionInput = form.elements.description;

  const incomeCategories = [
    'Entregas/Apps',
    'Salário',
    'Renda extra',
    'Venda',
    'Reembolso',
    'Investimentos/Rendimentos',
    'Presente',
    'Outros'
  ];

  const expenseCategories = [
    'Alimentação',
    'Casa',
    'Combustível',
    'Transporte',
    'Moto/Carro',
    'Saúde',
    'Educação',
    'Lazer',
    'Assinaturas',
    'Compras',
    'Contas',
    'Outros'
  ];

  function syncTransactionFields() {
    const isIncome = typeSelect.value === 'income';
    const categories = isIncome ? incomeCategories : expenseCategories;
    const previous = categorySelect.value;

    categorySelect.replaceChildren(...categories.map(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      return option;
    }));

    categorySelect.value = categories.includes(previous) ? previous : categories[0];
    descriptionInput.placeholder = isIncome
      ? 'Ex.: iFood, salário, venda'
      : 'Ex.: mercado, gasolina, internet';
  }

  typeSelect.addEventListener('change', syncTransactionFields);
  form.addEventListener('reset', () => setTimeout(syncTransactionFields, 0));
  syncTransactionFields();
})();

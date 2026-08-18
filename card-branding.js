(() => {
  const grid = document.getElementById('cardsGrid');
  if (!grid) return;

  const normalize = value => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();

  function identifyCard(name) {
    const normalized = normalize(name);
    if (normalized.includes('NUBANK')) {
      const variant = normalized.match(/(?:NUBANK\s*[- ]?)(\d+)/)?.[1] || '';
      return { brand: 'nubank', variant };
    }
    if (normalized.includes('PICPAY')) return { brand: 'picpay', variant: '' };
    if (normalized.includes('NEON')) return { brand: 'neon', variant: '' };
    if (normalized.includes('DIGIO')) return { brand: 'digio', variant: '' };
    return { brand: '', variant: '' };
  }

  function applyBranding() {
    grid.querySelectorAll('.credit-card').forEach(card => {
      const name = card.querySelector('.card-name')?.textContent || '';
      const { brand, variant } = identifyCard(name);

      card.classList.remove(
        'card-branded', 'brand-nubank', 'brand-picpay', 'brand-neon', 'brand-digio',
        'card-variant-1', 'card-variant-2'
      );
      delete card.dataset.cardBrand;

      if (!brand) return;
      card.classList.add('card-branded', `brand-${brand}`);
      card.dataset.cardBrand = brand;
      if (brand === 'nubank' && (variant === '1' || variant === '2')) {
        card.classList.add(`card-variant-${variant}`);
      }
    });
  }

  const observer = new MutationObserver(applyBranding);
  observer.observe(grid, { childList: true, subtree: true, characterData: true });

  applyBranding();
})();

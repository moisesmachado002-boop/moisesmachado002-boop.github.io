(() => {
  'use strict';

  const api = window.__financeApp;
  if (!api) return console.error('V1.5: API interna indisponível.');

  const CURRENT_VERSION = window.__APP_VERSION || '1.5.0';
  const state = () => api.getState();

  injectStyles();
  injectUpdateBanner();
  injectDashboardLoans();
  injectVersionInfo();
  enableTransactionEditing();
  refreshDashboardLoans();
  checkForUpdate();

  setInterval(() => {
    if (document.visibilityState !== 'hidden') refreshDashboardLoans();
  }, 1600);
  setInterval(() => {
    if (document.visibilityState !== 'hidden') checkForUpdate();
  }, 60000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      refreshDashboardLoans();
      checkForUpdate();
    }
  });

  function injectStyles() {
    if (document.getElementById('v15Styles')) return;
    const style = document.createElement('style');
    style.id = 'v15Styles';
    style.textContent = `
      .app-update-banner{position:fixed;left:50%;bottom:86px;transform:translateX(-50%);z-index:9998;width:min(560px,calc(100% - 24px));display:none;gap:12px;align-items:center;justify-content:space-between;padding:12px 14px;border:1px solid var(--line);border-radius:16px;background:var(--surface);box-shadow:0 18px 50px rgba(15,23,42,.2)}
      .app-update-banner.show{display:flex}.app-update-copy{min-width:0}.app-update-copy strong{display:block;font-size:.9rem}.app-update-copy small{display:block;color:var(--muted);margin-top:2px}.app-update-banner button{white-space:nowrap}
      .dashboard-loans-panel .stats-grid{margin-top:12px}.dashboard-loans-panel .panel-head{align-items:center}.dashboard-loans-panel .loan-dashboard-note{color:var(--muted);font-size:.8rem;margin-top:6px}
      .version-chip{display:inline-flex;align-items:center;padding:5px 8px;border-radius:999px;border:1px solid var(--line);font-size:.72rem;font-weight:800;color:var(--muted);margin-top:8px}
      .mini-btn.edit-tx{color:var(--brand)}
      @media(max-width:520px){.app-update-banner{bottom:82px;align-items:flex-start}.app-update-banner button{min-height:40px}.dashboard-loans-panel .stats-grid{grid-template-columns:1fr 1fr}}
    `;
    document.head.appendChild(style);
  }

  function injectUpdateBanner() {
    if (document.getElementById('appUpdateBanner')) return;
    const el = document.createElement('div');
    el.id = 'appUpdateBanner';
    el.className = 'app-update-banner';
    el.innerHTML = `
      <div class="app-update-copy"><strong>Nova versão disponível</strong><small id="appUpdateText">Toque para atualizar o Financeiro.</small></div>
      <button class="primary small" id="appUpdateBtn" type="button">Atualizar agora</button>
    `;
    document.body.appendChild(el);
    document.getElementById('appUpdateBtn').addEventListener('click', applyUpdate);
  }

  async function checkForUpdate() {
    if (!navigator.onLine) return;
    try {
      const response = await fetch(`./version.json?t=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) return;
      const info = await response.json();
      const latest = String(info.version || '').trim();
      const banner = document.getElementById('appUpdateBanner');
      if (!latest || latest === CURRENT_VERSION) {
        banner?.classList.remove('show');
        return;
      }
      banner.dataset.latest = latest;
      const text = document.getElementById('appUpdateText');
      if (text) text.textContent = `Versão ${latest} pronta. Seus dados serão mantidos.`;
      banner.classList.add('show');
    } catch (_) {}
  }

  async function applyUpdate() {
    const banner = document.getElementById('appUpdateBanner');
    const latest = banner?.dataset.latest || '';
    const btn = document.getElementById('appUpdateBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Atualizando...'; }
    try {
      const registration = await navigator.serviceWorker?.getRegistration?.();
      if (registration) await registration.update().catch(() => {});
      const target = `./?v=${encodeURIComponent(latest || Date.now())}&refresh=${Date.now()}`;
      location.replace(target);
    } catch (_) {
      location.reload();
    }
  }

  function injectDashboardLoans() {
    if (document.getElementById('dashboardLoansPanel')) return;
    const dashboard = document.getElementById('view-dashboard');
    if (!dashboard) return;
    const firstStats = dashboard.querySelector('.stats-grid');
    if (!firstStats) return;

    const panel = document.createElement('section');
    panel.className = 'panel dashboard-loans-panel';
    panel.id = 'dashboardLoansPanel';
    panel.innerHTML = `
      <div class="panel-head">
        <div><p class="eyebrow">EMPRÉSTIMOS</p><h2>Dinheiro com outras pessoas</h2><p class="loan-dashboard-note">Não entra como receita ou despesa enquanto estiver apenas emprestado.</p></div>
        <button class="text-btn" id="dashboardLoansOpen" type="button">Ver empréstimos</button>
      </div>
      <div class="stats-grid">
        <article class="stat-card warning"><span>A receber</span><strong id="dashboardLoanOutstanding">R$ 0,00</strong><small id="dashboardLoanPeople">0 pessoas</small></article>
        <article class="stat-card negative"><span>Vencido</span><strong id="dashboardLoanOverdue">R$ 0,00</strong><small id="dashboardLoanOverdueCount">0 empréstimos</small></article>
      </div>
    `;
    firstStats.insertAdjacentElement('afterend', panel);
    document.getElementById('dashboardLoansOpen').addEventListener('click', () => {
      document.querySelector('.bottom-nav [data-nav="loans"]')?.click();
    });
  }

  function refreshDashboardLoans() {
    const s = state();
    const loans = Array.isArray(s.loans) ? s.loans : [];
    let outstanding = 0;
    let overdue = 0;
    let overdueCount = 0;
    const owingPeople = new Set();
    const today = api.todayLocal();

    for (const loan of loans) {
      const remaining = loanRemaining(loan);
      if (remaining > 0.009) {
        outstanding += remaining;
        if (loan.personId) owingPeople.add(loan.personId);
        if (loan.dueDate && loan.dueDate < today) {
          overdue += remaining;
          overdueCount += 1;
        }
      }
    }

    setText('dashboardLoanOutstanding', api.money(outstanding));
    setText('dashboardLoanOverdue', api.money(overdue));
    setText('dashboardLoanPeople', `${owingPeople.size} ${owingPeople.size === 1 ? 'pessoa' : 'pessoas'}`);
    setText('dashboardLoanOverdueCount', `${overdueCount} ${overdueCount === 1 ? 'empréstimo' : 'empréstimos'}`);
    const openBtn = document.getElementById('dashboardLoansOpen');
    if (openBtn) openBtn.disabled = !document.querySelector('.bottom-nav [data-nav="loans"]');
  }

  function loanRemaining(loan) {
    const received = (Array.isArray(loan.repayments) ? loan.repayments : []).reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
    const forgiven = Number(loan.forgivenAmount) || 0;
    return Math.max(0, (Number(loan.amount) || 0) - received - forgiven);
  }

  function injectVersionInfo() {
    const settings = document.getElementById('view-settings');
    if (!settings || document.getElementById('appVersionChip')) return;
    const title = settings.querySelector('.section-title > div');
    if (!title) return;
    const chip = document.createElement('span');
    chip.id = 'appVersionChip';
    chip.className = 'version-chip';
    chip.textContent = `Versão ${CURRENT_VERSION}`;
    title.appendChild(chip);
  }

  function enableTransactionEditing() {
    const list = document.getElementById('transactionsList');
    const form = document.getElementById('transactionForm');
    const modal = document.getElementById('transactionModal');
    if (!list || !form || !modal) return;

    enhanceTransactionButtons();
    const observer = new MutationObserver(enhanceTransactionButtons);
    observer.observe(list, { childList: true, subtree: true });

    list.addEventListener('click', event => {
      const btn = event.target.closest('[data-edit-tx]');
      if (!btn) return;
      openTransactionEditor(btn.dataset.editTx);
    });

    form.addEventListener('submit', event => {
      const id = form.dataset.editId;
      if (!id) return;
      event.preventDefault();
      event.stopImmediatePropagation();

      const tx = state().transactions?.find(t => t.id === id);
      if (!tx) {
        api.toast('Lançamento não encontrado.');
        exitEditMode();
        return;
      }
      if (tx.source && tx.source !== 'manual') {
        api.toast('Esse lançamento é gerado automaticamente e não pode ser editado aqui.');
        exitEditMode();
        return;
      }

      const fd = new FormData(form);
      const amount = parseMoney(fd.get('amount'));
      if (!(amount > 0)) return api.toast('Informe um valor válido.');

      tx.type = String(fd.get('type') || 'expense');
      tx.amount = api.roundMoney(amount);
      tx.description = String(fd.get('description') || '').trim();
      tx.category = String(fd.get('category') || 'Outros');
      tx.paymentMethod = String(fd.get('paymentMethod') || 'Outro');
      tx.date = String(fd.get('date') || api.todayLocal());
      tx.note = String(fd.get('note') || '').trim();
      tx.source = tx.source || 'manual';

      api.saveState();
      modal.close();
      form.reset();
      exitEditMode();
      api.renderAll();
      api.toast('Lançamento atualizado.');
    }, true);

    modal.addEventListener('close', exitEditMode);
  }

  function enhanceTransactionButtons() {
    const list = document.getElementById('transactionsList');
    if (!list) return;
    list.querySelectorAll('[data-delete-tx]').forEach(deleteBtn => {
      const id = deleteBtn.dataset.deleteTx;
      if (!id || deleteBtn.parentElement?.querySelector(`[data-edit-tx="${cssEscape(id)}"]`)) return;
      const tx = state().transactions?.find(t => t.id === id);
      if (!tx || (tx.source && tx.source !== 'manual')) return;
      const edit = document.createElement('button');
      edit.type = 'button';
      edit.className = 'mini-btn edit-tx';
      edit.dataset.editTx = id;
      edit.textContent = 'Editar';
      deleteBtn.before(edit);
    });
  }

  function openTransactionEditor(id) {
    const s = state();
    const tx = s.transactions?.find(t => t.id === id);
    const form = document.getElementById('transactionForm');
    const modal = document.getElementById('transactionModal');
    if (!tx || !form || !modal) return;
    if (tx.source && tx.source !== 'manual') return api.toast('Esse lançamento é automático.');

    form.dataset.editId = id;
    const title = modal.querySelector('.modal-head h2');
    if (title) title.textContent = 'Editar lançamento';
    const saveBtn = form.querySelector('.modal-actions button[type="submit"]');
    if (saveBtn) saveBtn.textContent = 'Salvar alterações';

    form.elements.type.value = tx.type || 'expense';
    form.elements.type.dispatchEvent(new Event('change', { bubbles: true }));
    form.elements.amount.value = formatMoneyInput(tx.amount);
    form.elements.description.value = tx.description || '';
    ensureCategoryOption(form.elements.category, tx.category || 'Outros');
    form.elements.category.value = tx.category || 'Outros';
    form.elements.paymentMethod.value = tx.paymentMethod || 'Outro';
    form.elements.date.value = tx.date || api.todayLocal();
    form.elements.note.value = tx.note || '';

    if (!modal.open) modal.showModal();
    setTimeout(() => form.elements.amount.focus(), 30);
  }

  function exitEditMode() {
    const form = document.getElementById('transactionForm');
    const modal = document.getElementById('transactionModal');
    if (!form || !modal) return;
    delete form.dataset.editId;
    const title = modal.querySelector('.modal-head h2');
    if (title) title.textContent = 'Novo lançamento';
    const saveBtn = form.querySelector('.modal-actions button[type="submit"]');
    if (saveBtn) saveBtn.textContent = 'Salvar lançamento';
  }

  function ensureCategoryOption(select, value) {
    if (!select || !value) return;
    if ([...select.options].some(o => o.value === value)) return;
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  }

  function parseMoney(value) {
    let s = String(value ?? '').trim().replace(/\s/g, '').replace(/R\$/gi, '');
    if (!s) return 0;
    if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '').replace(',', '.');
    else if (s.includes(',')) s = s.replace(',', '.');
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  }

  function formatMoneyInput(value) {
    const n = Number(value) || 0;
    return n.toFixed(2).replace('.', ',');
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function cssEscape(value) {
    if (window.CSS?.escape) return CSS.escape(value);
    return String(value).replace(/["\\]/g, '\\$&');
  }
})();

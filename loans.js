(() => {
  'use strict';

  const api = window.__financeApp;
  if (!api) return console.error('Módulo de empréstimos: API do app indisponível.');

  const methods = ['Dinheiro', 'Pix', 'Débito', 'Transferência', 'Boleto', 'Outro'];

  const money = api.money;
  const esc = api.escapeHtml;
  const fmtDate = api.formatDate;
  const today = api.todayLocal;
  const uid = api.uid;
  const round = api.roundMoney;
  const toast = api.toast;

  injectStyles();
  injectInterface();
  bindLoans();
  renderLoans();
  updateAvailabilityWithLoans();

  // Mantém a aba e os saldos atualizados caso o estado seja trocado pelo Realtime.
  setInterval(() => {
    if (document.visibilityState !== 'hidden') {
      if (document.querySelector('#view-loans')?.classList.contains('active')) renderLoans();
      updateAvailabilityWithLoans();
    }
  }, 1500);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      renderLoans();
      updateAvailabilityWithLoans();
    }
  });

  function getState() {
    const state = api.getState();
    if (!Array.isArray(state.loans)) state.loans = [];
    return state;
  }

  function injectInterface() {
    const nav = document.querySelector('.bottom-nav');
    if (nav && !nav.querySelector('[data-nav="loans"]')) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.nav = 'loans';
      btn.innerHTML = '<span>↔</span><small>Empréstimos</small>';
      const reports = nav.querySelector('[data-nav="reports"]');
      nav.insertBefore(btn, reports || null);
    }

    const main = document.querySelector('main');
    if (main && !document.getElementById('view-loans')) {
      const section = document.createElement('section');
      section.className = 'view';
      section.id = 'view-loans';
      section.dataset.view = 'loans';
      section.innerHTML = `
        <div class="section-title">
          <div>
            <p class="eyebrow">DINHEIRO A RECEBER</p>
            <h2>Empréstimos</h2>
          </div>
          <button class="primary" id="addLoanBtn" type="button">+ Emprestar</button>
        </div>
        <p class="loan-intro">Empréstimos não entram como despesa nem a devolução como receita. Eles apenas movimentam seu dinheiro disponível.</p>
        <div class="stats-grid loan-stats">
          <article class="stat-card"><span>Total emprestado</span><strong id="loanTotalLent">R$ 0,00</strong></article>
          <article class="stat-card warning"><span>A receber</span><strong id="loanOutstanding">R$ 0,00</strong></article>
          <article class="stat-card positive"><span>Recebido</span><strong id="loanReceived">R$ 0,00</strong></article>
          <article class="stat-card negative"><span>Perdoado</span><strong id="loanForgiven">R$ 0,00</strong></article>
        </div>
        <div class="loan-filter-row">
          <select id="loanStatusFilter" aria-label="Filtrar empréstimos">
            <option value="all">Todos</option>
            <option value="pending">Pendentes</option>
            <option value="overdue">Vencidos</option>
            <option value="paid">Pagos</option>
            <option value="forgiven">Perdoados</option>
          </select>
          <input id="loanSearch" type="search" placeholder="Buscar pessoa..." />
        </div>
        <div id="loansList" class="list empty-state">Nenhum empréstimo cadastrado.</div>
      `;
      const reports = document.getElementById('view-reports');
      main.insertBefore(section, reports || null);
    }

    if (!document.getElementById('loanModal')) {
      document.body.insertAdjacentHTML('beforeend', `
        <dialog id="loanModal" class="modal">
          <form id="loanForm" method="dialog" autocomplete="off">
            <div class="modal-head"><h2>Novo empréstimo</h2><button type="button" class="icon-btn loan-close">×</button></div>
            <div class="form-grid">
              <label class="field full"><span>Pessoa</span><input name="person" maxlength="80" placeholder="Ex.: João" required /></label>
              <label class="field"><span>Valor emprestado</span><input name="amount" inputmode="decimal" placeholder="0,00" required /></label>
              <label class="field"><span>Data do empréstimo</span><input name="lentDate" type="date" required /></label>
              <label class="field"><span>Prazo para pagar (opcional)</span><input name="dueDate" type="date" /></label>
              <label class="field"><span>Dinheiro saiu por</span><select name="paymentMethod" required>${methodOptions()}</select></label>
              <label class="field full"><span>Observação (opcional)</span><textarea name="note" rows="2" maxlength="180" placeholder="Ex.: combinado para pagar no fim do mês"></textarea></label>
            </div>
            <div class="info-box">Ao salvar, o valor sai do seu saldo disponível, mas não é contabilizado como despesa.</div>
            <div class="modal-actions"><button type="button" class="secondary loan-close">Cancelar</button><button type="submit" class="primary">Salvar empréstimo</button></div>
          </form>
        </dialog>

        <dialog id="loanRepaymentModal" class="modal compact-modal">
          <form id="loanRepaymentForm" method="dialog" autocomplete="off">
            <div class="modal-head"><h2>Registrar devolução</h2><button type="button" class="icon-btn repayment-close">×</button></div>
            <input type="hidden" name="loanId" />
            <div class="info-box" id="repaymentInfo">Saldo a receber: R$ 0,00</div>
            <label class="field"><span>Valor devolvido</span><input name="amount" inputmode="decimal" placeholder="0,00" required /></label>
            <label class="field"><span>Data</span><input name="date" type="date" required /></label>
            <label class="field"><span>Recebido por</span><select name="paymentMethod" required>${methodOptions()}</select></label>
            <div class="modal-actions"><button type="button" class="secondary repayment-close">Cancelar</button><button type="submit" class="primary">Confirmar devolução</button></div>
          </form>
        </dialog>
      `);
    }
  }

  function bindLoans() {
    const navBtn = document.querySelector('.bottom-nav [data-nav="loans"]');
    navBtn?.addEventListener('click', () => {
      document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.dataset.view === 'loans'));
      document.querySelectorAll('.bottom-nav [data-nav]').forEach(b => b.classList.toggle('active', b.dataset.nav === 'loans'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      renderLoans();
    });

    document.querySelectorAll('.bottom-nav [data-nav]:not([data-nav="loans"])').forEach(btn => {
      btn.addEventListener('click', () => updateAvailabilityWithLoans());
    });

    document.getElementById('addLoanBtn')?.addEventListener('click', () => {
      const form = document.getElementById('loanForm');
      form.reset();
      form.elements.lentDate.value = today();
      document.getElementById('loanModal').showModal();
    });

    document.querySelectorAll('.loan-close').forEach(btn => btn.addEventListener('click', () => document.getElementById('loanModal').close()));
    document.querySelectorAll('.repayment-close').forEach(btn => btn.addEventListener('click', () => document.getElementById('loanRepaymentModal').close()));

    document.getElementById('loanStatusFilter')?.addEventListener('change', renderLoans);
    document.getElementById('loanSearch')?.addEventListener('input', renderLoans);

    document.getElementById('loanForm')?.addEventListener('submit', event => {
      event.preventDefault();
      const fd = new FormData(event.currentTarget);
      const amount = parseMoney(fd.get('amount'));
      if (!(amount > 0)) return toast('Informe um valor válido.');
      const state = getState();
      state.loans.push({
        id: uid('loan'),
        person: String(fd.get('person') || '').trim(),
        amount: round(amount),
        lentDate: String(fd.get('lentDate') || today()),
        dueDate: String(fd.get('dueDate') || ''),
        paymentMethod: String(fd.get('paymentMethod') || 'Outro'),
        note: String(fd.get('note') || '').trim(),
        repayments: [],
        forgivenAmount: 0,
        forgivenAt: ''
      });
      api.saveState();
      event.currentTarget.reset();
      document.getElementById('loanModal').close();
      api.renderAll();
      renderLoans();
      updateAvailabilityWithLoans();
      toast('Empréstimo registrado.');
    });

    document.getElementById('loanRepaymentForm')?.addEventListener('submit', event => {
      event.preventDefault();
      const fd = new FormData(event.currentTarget);
      const state = getState();
      const loan = state.loans.find(l => l.id === fd.get('loanId'));
      if (!loan) return toast('Empréstimo não encontrado.');
      const remaining = loanRemaining(loan);
      const amount = parseMoney(fd.get('amount'));
      if (!(amount > 0)) return toast('Informe um valor válido.');
      if (amount > remaining + 0.009) return toast(`O máximo a receber é ${money(remaining)}.`);
      if (!Array.isArray(loan.repayments)) loan.repayments = [];
      loan.repayments.push({
        id: uid('repay'),
        amount: round(amount),
        date: String(fd.get('date') || today()),
        paymentMethod: String(fd.get('paymentMethod') || 'Outro')
      });
      api.saveState();
      event.currentTarget.reset();
      document.getElementById('loanRepaymentModal').close();
      api.renderAll();
      renderLoans();
      updateAvailabilityWithLoans();
      toast(loanRemaining(loan) <= 0.009 ? 'Empréstimo quitado.' : 'Devolução parcial registrada.');
    });
  }

  function renderLoans() {
    const state = getState();
    const loans = state.loans || [];
    const totalLent = sum(loans, l => Number(l.amount) || 0);
    const received = sum(loans, l => loanReceived(l));
    const forgiven = sum(loans, l => Number(l.forgivenAmount) || 0);
    const outstanding = sum(loans, l => loanRemaining(l));

    setText('loanTotalLent', money(totalLent));
    setText('loanOutstanding', money(outstanding));
    setText('loanReceived', money(received));
    setText('loanForgiven', money(forgiven));

    const filter = document.getElementById('loanStatusFilter')?.value || 'all';
    const search = (document.getElementById('loanSearch')?.value || '').trim().toLowerCase();
    const filtered = loans.filter(loan => {
      const status = loanStatus(loan).key;
      return (filter === 'all' || filter === status) && (!search || `${loan.person} ${loan.note || ''}`.toLowerCase().includes(search));
    }).sort((a, b) => statusRank(loanStatus(a).key) - statusRank(loanStatus(b).key) || `${b.lentDate}${b.id}`.localeCompare(`${a.lentDate}${a.id}`));

    const list = document.getElementById('loansList');
    if (!list) return;
    if (!filtered.length) {
      list.classList.add('empty-state');
      list.textContent = loans.length ? 'Nenhum empréstimo encontrado neste filtro.' : 'Nenhum empréstimo cadastrado.';
      return;
    }

    list.classList.remove('empty-state');
    list.innerHTML = filtered.map(loan => loanHtml(loan)).join('');
    list.querySelectorAll('[data-loan-repay]').forEach(btn => btn.addEventListener('click', () => openRepayment(btn.dataset.loanRepay)));
    list.querySelectorAll('[data-loan-forgive]').forEach(btn => btn.addEventListener('click', () => forgiveLoan(btn.dataset.loanForgive)));
    list.querySelectorAll('[data-loan-reopen]').forEach(btn => btn.addEventListener('click', () => reopenLoan(btn.dataset.loanReopen)));
    list.querySelectorAll('[data-loan-delete]').forEach(btn => btn.addEventListener('click', () => deleteLoan(btn.dataset.loanDelete)));
  }

  function loanHtml(loan) {
    const status = loanStatus(loan);
    const received = loanReceived(loan);
    const forgiven = Number(loan.forgivenAmount) || 0;
    const remaining = loanRemaining(loan);
    const repayCount = Array.isArray(loan.repayments) ? loan.repayments.length : 0;
    const due = loan.dueDate ? ` · prazo ${fmtDate(loan.dueDate)}` : '';
    const note = loan.note ? `<div class="loan-note">${esc(loan.note)}</div>` : '';
    const history = repayCount ? `<div class="loan-history">${repayCount} devolução${repayCount === 1 ? '' : 'ões'} · recebido ${money(received)}</div>` : '';
    const forgiveness = forgiven > 0 ? `<div class="loan-history forgiven">Perdoado: ${money(forgiven)}${loan.forgivenAt ? ` em ${fmtDate(loan.forgivenAt)}` : ''}</div>` : '';
    const activeActions = remaining > 0.009
      ? `<button class="mini-btn" data-loan-repay="${loan.id}">Registrar devolução</button><button class="mini-btn danger-text" data-loan-forgive="${loan.id}">Perdoar saldo</button>`
      : (status.key === 'forgiven' ? `<button class="mini-btn" data-loan-reopen="${loan.id}">Reabrir</button>` : '');

    return `<article class="list-item loan-item">
      <div class="item-main">
        <div class="item-title"><span>${esc(loan.person)}</span><span class="loan-status ${status.key}">${status.label}</span></div>
        <div class="item-meta">Emprestado ${money(loan.amount)} · ${fmtDate(loan.lentDate)} · ${esc(loan.paymentMethod || 'Outro')}${due}</div>
        ${note}${history}${forgiveness}
        <div class="item-actions">${activeActions}<button class="mini-btn danger-text" data-loan-delete="${loan.id}">Excluir</button></div>
      </div>
      <div class="loan-right"><small>A receber</small><strong>${money(remaining)}</strong></div>
    </article>`;
  }

  function openRepayment(id) {
    const loan = getState().loans.find(l => l.id === id);
    if (!loan) return;
    const remaining = loanRemaining(loan);
    const form = document.getElementById('loanRepaymentForm');
    form.reset();
    form.elements.loanId.value = id;
    form.elements.date.value = today();
    form.elements.paymentMethod.value = loan.paymentMethod || 'Pix';
    document.getElementById('repaymentInfo').textContent = `Saldo a receber de ${loan.person}: ${money(remaining)}`;
    document.getElementById('loanRepaymentModal').showModal();
    setTimeout(() => form.elements.amount.focus(), 50);
  }

  function forgiveLoan(id) {
    const loan = getState().loans.find(l => l.id === id);
    if (!loan) return;
    const remaining = loanRemaining(loan);
    if (!(remaining > 0)) return;
    if (!confirm(`Perdoar ${money(remaining)} que ${loan.person} ainda deve?\n\nEsse valor NÃO voltará para sua conta e NÃO será considerado receita.`)) return;
    loan.forgivenAmount = round((Number(loan.forgivenAmount) || 0) + remaining);
    loan.forgivenAt = today();
    api.saveState();
    api.renderAll();
    renderLoans();
    updateAvailabilityWithLoans();
    toast('Saldo marcado como perdoado.');
  }

  function reopenLoan(id) {
    const loan = getState().loans.find(l => l.id === id);
    if (!loan || !(Number(loan.forgivenAmount) > 0)) return;
    if (!confirm(`Reabrir a dívida de ${loan.person}? O valor perdoado voltará a aparecer como "A receber".`)) return;
    loan.forgivenAmount = 0;
    loan.forgivenAt = '';
    api.saveState();
    api.renderAll();
    renderLoans();
    updateAvailabilityWithLoans();
    toast('Empréstimo reaberto.');
  }

  function deleteLoan(id) {
    const state = getState();
    const loan = state.loans.find(l => l.id === id);
    if (!loan) return;
    if (!confirm(`Excluir o empréstimo de ${loan.person}?\n\nIsso remove todo o histórico dele e recalcula seu saldo disponível.`)) return;
    state.loans = state.loans.filter(l => l.id !== id);
    api.saveState();
    api.renderAll();
    renderLoans();
    updateAvailabilityWithLoans();
    toast('Empréstimo excluído.');
  }

  function loanReceived(loan) {
    return round(sum(Array.isArray(loan.repayments) ? loan.repayments : [], r => Number(r.amount) || 0));
  }

  function loanRemaining(loan) {
    return round(Math.max(0, (Number(loan.amount) || 0) - loanReceived(loan) - (Number(loan.forgivenAmount) || 0)));
  }

  function loanStatus(loan) {
    const remaining = loanRemaining(loan);
    if ((Number(loan.forgivenAmount) || 0) > 0 && remaining <= 0.009) return { key: 'forgiven', label: 'Perdoado' };
    if (remaining <= 0.009) return { key: 'paid', label: 'Pago' };
    if (loan.dueDate && loan.dueDate < today()) return { key: 'overdue', label: 'Vencido' };
    return { key: 'pending', label: 'Pendente' };
  }

  function statusRank(key) {
    return ({ overdue: 0, pending: 1, forgiven: 2, paid: 3 })[key] ?? 9;
  }

  function updateAvailabilityWithLoans() {
    const state = getState();
    const dash = availabilityAt(today());
    setText('accountBalanceValue', money(dash.account));
    setText('cashBalanceValue', money(dash.cash));
    setText('availableTotalValue', money(dash.total));
    setText('unclassifiedBalanceValue', money(dash.unclassified));

    const reportMonth = document.getElementById('reportMonth')?.value;
    if (reportMonth) {
      const current = today().slice(0, 7);
      let cutoff = today();
      if (reportMonth < current) {
        const [y, m] = reportMonth.split('-').map(Number);
        cutoff = `${reportMonth}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`;
      }
      const report = availabilityAt(cutoff);
      setText('reportAccountBalance', money(report.account));
      setText('reportCashBalance', money(report.cash));
      setText('reportAvailableTotal', money(report.total));
      setText('reportUnclassifiedBalance', money(report.unclassified));
    }
  }

  function availabilityAt(cutoff) {
    const state = getState();
    const opening = state.openingBalances || { account: 0, cash: 0 };
    let account = Number(opening.account) || 0;
    let cash = Number(opening.cash) || 0;
    let unclassified = 0;

    (state.transactions || []).forEach(tx => {
      if (!tx.date || tx.date > cutoff) return;
      const signed = tx.type === 'income' ? Number(tx.amount) : -Number(tx.amount);
      addAt(paymentLocation(tx.paymentMethod), signed);
    });

    (state.loans || []).forEach(loan => {
      if (loan.lentDate && loan.lentDate <= cutoff) addAt(paymentLocation(loan.paymentMethod), -(Number(loan.amount) || 0));
      (Array.isArray(loan.repayments) ? loan.repayments : []).forEach(rep => {
        if (rep.date && rep.date <= cutoff) addAt(paymentLocation(rep.paymentMethod), Number(rep.amount) || 0);
      });
      // Valor perdoado propositalmente não gera entrada: o dinheiro apenas ficou fora do saldo.
    });

    account = round(account);
    cash = round(cash);
    unclassified = round(unclassified);
    return { account, cash, unclassified, total: round(account + cash) };

    function addAt(location, value) {
      if (location === 'cash') cash += value;
      else if (location === 'account') account += value;
      else unclassified += value;
    }
  }

  function paymentLocation(method) {
    if (method === 'Dinheiro') return 'cash';
    if (['Pix', 'Débito', 'Transferência', 'Boleto'].includes(method)) return 'account';
    return 'unclassified';
  }

  function methodOptions() {
    return '<option value="">Selecione...</option>' + methods.map(m => `<option value="${m}">${m}</option>`).join('');
  }

  function parseMoney(value) {
    if (typeof value === 'number') return value;
    let s = String(value || '').trim().replace(/\s/g, '').replace(/R\$/gi, '');
    if (!s) return 0;
    if (s.includes(',') && s.includes('.')) s = s.lastIndexOf(',') > s.lastIndexOf('.') ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
    else if (s.includes(',')) s = s.replace(',', '.');
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  }

  function sum(arr, fn) {
    return round((arr || []).reduce((acc, item) => acc + Number(fn(item) || 0), 0));
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .loan-intro{color:var(--muted);margin:-6px 0 18px;line-height:1.45;font-size:.86rem}
      .loan-stats{margin-bottom:16px}
      .loan-filter-row{display:grid;grid-template-columns:minmax(150px,220px) 1fr;gap:10px;margin:0 0 14px}
      .loan-filter-row input,.loan-filter-row select{width:100%;border:1px solid var(--line);background:var(--surface);color:var(--text);border-radius:14px;padding:12px 14px;font:inherit}
      .loan-item{align-items:start}
      .loan-status{display:inline-flex;align-items:center;border-radius:999px;padding:4px 8px;font-size:.68rem;font-weight:900;margin-left:7px;border:1px solid var(--line)}
      .loan-status.pending{color:var(--warning)} .loan-status.overdue{color:var(--danger)} .loan-status.paid{color:var(--success)} .loan-status.forgiven{color:var(--muted)}
      .loan-note,.loan-history{color:var(--muted);font-size:.76rem;margin-top:5px;line-height:1.35}.loan-history.forgiven{font-weight:800}
      .loan-right{text-align:right;white-space:nowrap}.loan-right small{display:block;color:var(--muted);font-size:.68rem}.loan-right strong{display:block;margin-top:4px;font-size:1rem}
      @media(max-width:640px){.bottom-nav{grid-template-columns:repeat(8,minmax(70px,1fr))}.loan-filter-row{grid-template-columns:1fr}.loan-item{grid-template-columns:minmax(0,1fr)}.loan-right{text-align:left;margin-top:8px}.loan-right small,.loan-right strong{display:inline}.loan-right strong{margin-left:6px}.loan-status{margin-left:4px}}
    `;
    document.head.appendChild(style);
  }
})();

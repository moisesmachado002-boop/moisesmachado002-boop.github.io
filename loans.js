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
  let selectedPersonId = 'all';

  injectStyles();
  injectInterface();
  const migrated = ensureDataModel();
  bindLoans();
  if (migrated) api.saveState();
  renderLoans();
  updateAvailabilityWithLoans();

  setInterval(() => {
    if (document.visibilityState !== 'hidden') {
      if (document.querySelector('#view-loans')?.classList.contains('active')) renderLoans();
      updateAvailabilityWithLoans();
    }
  }, 1800);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      renderLoans();
      updateAvailabilityWithLoans();
    }
  });

  function getState() {
    const state = api.getState();
    if (!Array.isArray(state.loans)) state.loans = [];
    if (!Array.isArray(state.loanPeople)) state.loanPeople = [];
    if (!Array.isArray(state.transactions)) state.transactions = [];
    return state;
  }

  function ensureDataModel() {
    const state = getState();
    let changed = false;

    state.loans.forEach(loan => {
      if (loan.personId && state.loanPeople.some(p => p.id === loan.personId)) return;
      const oldName = String(loan.person || '').trim() || 'Pessoa sem nome';
      let person = state.loanPeople.find(p => normalizeName(p.name) === normalizeName(oldName));
      if (!person) {
        person = { id: uid('person'), name: oldName, phone: '', note: '', createdAt: today() };
        state.loanPeople.push(person);
      }
      loan.personId = person.id;
      changed = true;
    });

    state.loans.forEach(loan => {
      if (!Array.isArray(loan.repayments)) { loan.repayments = []; changed = true; }
      if (!Number.isFinite(Number(loan.forgivenAmount))) { loan.forgivenAmount = 0; changed = true; }
      if (Number(loan.forgivenAmount) > 0) {
        const existing = state.transactions.find(tx => tx.source === 'loan_forgiven' && tx.loanId === loan.id);
        if (!existing) {
          const person = personById(loan.personId);
          const tx = makeForgivenExpense(loan, person, Number(loan.forgivenAmount), loan.forgivenAt || today());
          state.transactions.push(tx);
          loan.forgivenTransactionId = tx.id;
          changed = true;
        } else if (loan.forgivenTransactionId !== existing.id) {
          loan.forgivenTransactionId = existing.id;
          changed = true;
        }
      }
    });

    return changed;
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
        <div class="section-title loan-title-row">
          <div>
            <p class="eyebrow">DINHEIRO A RECEBER</p>
            <h2>Pessoas e empréstimos</h2>
          </div>
          <div class="action-pair wrap">
            <button class="secondary" id="addLoanPersonBtn" type="button">+ Pessoa</button>
            <button class="primary" id="addLoanBtn" type="button">+ Emprestar</button>
          </div>
        </div>
        <p class="loan-intro">O empréstimo reduz seu dinheiro disponível, mas não é despesa. A devolução repõe o saldo sem virar receita. Se você perdoar uma dívida, o valor perdoado passa a aparecer no extrato como despesa, sem baixar o saldo novamente.</p>

        <div class="stats-grid loan-stats">
          <article class="stat-card"><span>Total emprestado</span><strong id="loanTotalLent">R$ 0,00</strong></article>
          <article class="stat-card warning"><span>A receber</span><strong id="loanOutstanding">R$ 0,00</strong></article>
          <article class="stat-card positive"><span>Recebido</span><strong id="loanReceived">R$ 0,00</strong></article>
          <article class="stat-card negative"><span>Perdoado</span><strong id="loanForgiven">R$ 0,00</strong></article>
        </div>

        <section class="panel loan-people-panel">
          <div class="panel-head">
            <div><p class="eyebrow">POR PESSOA</p><h2>Quem está devendo?</h2></div>
            <input id="loanPersonSearch" class="loan-person-search" type="search" placeholder="Buscar pessoa..." />
          </div>
          <div id="loanPeopleGrid" class="loan-people-grid empty-state">Cadastre uma pessoa para começar.</div>
        </section>

        <section class="panel">
          <div class="panel-head loan-history-head">
            <div><p class="eyebrow">HISTÓRICO</p><h2 id="loanHistoryTitle">Todos os empréstimos</h2></div>
            <button class="text-btn" id="showAllLoansBtn" type="button" hidden>Ver todos</button>
          </div>
          <div class="loan-filter-row">
            <select id="loanStatusFilter" aria-label="Filtrar empréstimos">
              <option value="all">Todos os status</option>
              <option value="pending">Pendentes</option>
              <option value="overdue">Vencidos</option>
              <option value="paid">Pagos</option>
              <option value="forgiven">Perdoados</option>
            </select>
          </div>
          <div id="loansList" class="list empty-state">Nenhum empréstimo cadastrado.</div>
        </section>
      `;
      const reports = document.getElementById('view-reports');
      main.insertBefore(section, reports || null);
    }

    if (!document.getElementById('loanPersonModal')) {
      document.body.insertAdjacentHTML('beforeend', `
        <dialog id="loanPersonModal" class="modal compact-modal">
          <form id="loanPersonForm" method="dialog" autocomplete="off">
            <div class="modal-head"><h2 id="loanPersonModalTitle">Nova pessoa</h2><button type="button" class="icon-btn person-close">×</button></div>
            <input type="hidden" name="personId" />
            <div class="form-grid">
              <label class="field full"><span>Nome</span><input name="name" maxlength="80" placeholder="Ex.: João" required /></label>
              <label class="field full"><span>Telefone (opcional)</span><input name="phone" maxlength="30" inputmode="tel" placeholder="Ex.: (75) 99999-9999" /></label>
              <label class="field full"><span>Observação (opcional)</span><textarea name="note" rows="2" maxlength="180" placeholder="Ex.: colega de trabalho"></textarea></label>
            </div>
            <div class="modal-actions"><button type="button" class="secondary person-close">Cancelar</button><button type="submit" class="primary">Salvar pessoa</button></div>
          </form>
        </dialog>

        <dialog id="loanModal" class="modal">
          <form id="loanForm" method="dialog" autocomplete="off">
            <div class="modal-head"><h2>Novo empréstimo</h2><button type="button" class="icon-btn loan-close">×</button></div>
            <div class="form-grid">
              <label class="field full"><span>Pessoa</span><select name="personId" id="loanPersonSelect" required></select></label>
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

    document.getElementById('addLoanPersonBtn')?.addEventListener('click', () => openPersonModal());
    document.getElementById('addLoanBtn')?.addEventListener('click', openLoanModal);
    document.getElementById('showAllLoansBtn')?.addEventListener('click', () => { selectedPersonId = 'all'; renderLoans(); });
    document.getElementById('loanStatusFilter')?.addEventListener('change', renderLoanHistory);
    document.getElementById('loanPersonSearch')?.addEventListener('input', renderPeople);

    document.querySelectorAll('.person-close').forEach(btn => btn.addEventListener('click', () => document.getElementById('loanPersonModal').close()));
    document.querySelectorAll('.loan-close').forEach(btn => btn.addEventListener('click', () => document.getElementById('loanModal').close()));
    document.querySelectorAll('.repayment-close').forEach(btn => btn.addEventListener('click', () => document.getElementById('loanRepaymentModal').close()));

    document.getElementById('loanPersonForm')?.addEventListener('submit', event => {
      event.preventDefault();
      const fd = new FormData(event.currentTarget);
      const state = getState();
      const name = String(fd.get('name') || '').trim();
      if (!name) return toast('Informe o nome da pessoa.');
      const id = String(fd.get('personId') || '');
      const duplicate = state.loanPeople.find(p => normalizeName(p.name) === normalizeName(name) && p.id !== id);
      if (duplicate) return toast('Essa pessoa já está cadastrada.');

      if (id) {
        const person = state.loanPeople.find(p => p.id === id);
        if (!person) return toast('Pessoa não encontrada.');
        person.name = name;
        person.phone = String(fd.get('phone') || '').trim();
        person.note = String(fd.get('note') || '').trim();
        toast('Cadastro atualizado.');
      } else {
        state.loanPeople.push({
          id: uid('person'), name,
          phone: String(fd.get('phone') || '').trim(),
          note: String(fd.get('note') || '').trim(),
          createdAt: today()
        });
        toast('Pessoa cadastrada.');
      }
      api.saveState();
      event.currentTarget.reset();
      document.getElementById('loanPersonModal').close();
      renderLoans();
    });

    document.getElementById('loanForm')?.addEventListener('submit', event => {
      event.preventDefault();
      const fd = new FormData(event.currentTarget);
      const amount = parseMoney(fd.get('amount'));
      if (!(amount > 0)) return toast('Informe um valor válido.');
      const state = getState();
      const personId = String(fd.get('personId') || '');
      if (!state.loanPeople.some(p => p.id === personId)) return toast('Selecione uma pessoa válida.');
      state.loans.push({
        id: uid('loan'), personId,
        amount: round(amount),
        lentDate: String(fd.get('lentDate') || today()),
        dueDate: String(fd.get('dueDate') || ''),
        paymentMethod: String(fd.get('paymentMethod') || 'Outro'),
        note: String(fd.get('note') || '').trim(),
        repayments: [], forgivenAmount: 0, forgivenAt: '', forgivenTransactionId: ''
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
      loan.repayments.push({ id: uid('repay'), amount: round(amount), date: String(fd.get('date') || today()), paymentMethod: String(fd.get('paymentMethod') || 'Outro') });
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
    ensureDataModel();
    renderGlobalTotals();
    renderPeople();
    renderLoanHistory();
    updatePersonSelect();
    updateAvailabilityWithLoans();
  }

  function renderGlobalTotals() {
    const loans = getState().loans;
    setText('loanTotalLent', money(sum(loans, l => Number(l.amount) || 0)));
    setText('loanOutstanding', money(sum(loans, loanRemaining)));
    setText('loanReceived', money(sum(loans, loanReceived)));
    setText('loanForgiven', money(sum(loans, l => Number(l.forgivenAmount) || 0)));
  }

  function renderPeople() {
    const state = getState();
    const search = (document.getElementById('loanPersonSearch')?.value || '').trim().toLowerCase();
    const people = state.loanPeople
      .filter(p => !search || `${p.name} ${p.phone || ''} ${p.note || ''}`.toLowerCase().includes(search))
      .sort((a, b) => {
        const ao = personSummary(a.id).outstanding;
        const bo = personSummary(b.id).outstanding;
        return bo - ao || a.name.localeCompare(b.name, 'pt-BR');
      });

    const grid = document.getElementById('loanPeopleGrid');
    if (!grid) return;
    if (!people.length) {
      grid.classList.add('empty-state');
      grid.textContent = state.loanPeople.length ? 'Nenhuma pessoa encontrada.' : 'Cadastre uma pessoa para começar.';
      return;
    }

    grid.classList.remove('empty-state');
    grid.innerHTML = people.map(person => personCardHtml(person)).join('');
    grid.querySelectorAll('[data-person-view]').forEach(btn => btn.addEventListener('click', () => {
      selectedPersonId = btn.dataset.personView;
      renderLoanHistory();
      document.getElementById('loansList')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));
    grid.querySelectorAll('[data-person-lend]').forEach(btn => btn.addEventListener('click', () => openLoanModal(btn.dataset.personLend)));
    grid.querySelectorAll('[data-person-edit]').forEach(btn => btn.addEventListener('click', () => openPersonModal(btn.dataset.personEdit)));
    grid.querySelectorAll('[data-person-delete]').forEach(btn => btn.addEventListener('click', () => deletePerson(btn.dataset.personDelete)));
  }

  function personCardHtml(person) {
    const s = personSummary(person.id);
    const badge = s.outstanding > 0.009 ? `<span class="loan-status ${s.overdue ? 'overdue' : 'pending'}">${s.overdue ? 'Tem vencido' : 'A receber'}</span>` : '<span class="loan-status paid">Em dia</span>';
    return `<article class="loan-person-card ${selectedPersonId === person.id ? 'selected' : ''}">
      <div class="loan-person-head"><div><strong>${esc(person.name)}</strong>${person.phone ? `<small>${esc(person.phone)}</small>` : ''}</div>${badge}</div>
      <div class="loan-person-main"><span>A receber</span><strong>${money(s.outstanding)}</strong></div>
      <div class="loan-person-breakdown">
        <span>Emprestado <b>${money(s.lent)}</b></span>
        <span>Recebido <b>${money(s.received)}</b></span>
        <span>Perdoado <b>${money(s.forgiven)}</b></span>
        <span>${s.count} empréstimo${s.count === 1 ? '' : 's'}</span>
      </div>
      ${person.note ? `<p class="loan-person-note">${esc(person.note)}</p>` : ''}
      <div class="item-actions loan-person-actions">
        <button class="mini-btn" data-person-view="${person.id}">Ver histórico</button>
        <button class="mini-btn" data-person-lend="${person.id}">+ Emprestar</button>
        <button class="mini-btn" data-person-edit="${person.id}">Editar</button>
        <button class="mini-btn danger-text" data-person-delete="${person.id}">Excluir</button>
      </div>
    </article>`;
  }

  function renderLoanHistory() {
    const state = getState();
    const filter = document.getElementById('loanStatusFilter')?.value || 'all';
    const selectedPerson = selectedPersonId === 'all' ? null : personById(selectedPersonId);
    if (selectedPersonId !== 'all' && !selectedPerson) selectedPersonId = 'all';

    setText('loanHistoryTitle', selectedPerson ? `Empréstimos de ${selectedPerson.name}` : 'Todos os empréstimos');
    const showAll = document.getElementById('showAllLoansBtn');
    if (showAll) showAll.hidden = selectedPersonId === 'all';

    const filtered = state.loans.filter(loan => {
      const status = loanStatus(loan).key;
      return (selectedPersonId === 'all' || loan.personId === selectedPersonId) && (filter === 'all' || filter === status);
    }).sort((a, b) => statusRank(loanStatus(a).key) - statusRank(loanStatus(b).key) || `${b.lentDate}${b.id}`.localeCompare(`${a.lentDate}${a.id}`));

    const list = document.getElementById('loansList');
    if (!list) return;
    if (!filtered.length) {
      list.classList.add('empty-state');
      list.textContent = state.loans.length ? 'Nenhum empréstimo encontrado neste filtro.' : 'Nenhum empréstimo cadastrado.';
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
    const person = personById(loan.personId) || { name: 'Pessoa não encontrada' };
    const status = loanStatus(loan);
    const received = loanReceived(loan);
    const forgiven = Number(loan.forgivenAmount) || 0;
    const remaining = loanRemaining(loan);
    const repayCount = Array.isArray(loan.repayments) ? loan.repayments.length : 0;
    const due = loan.dueDate ? ` · prazo ${fmtDate(loan.dueDate)}` : '';
    const note = loan.note ? `<div class="loan-note">${esc(loan.note)}</div>` : '';
    const history = repayCount ? `<div class="loan-history">${repayCount} devolução${repayCount === 1 ? '' : 'ões'} · recebido ${money(received)}</div>` : '';
    const forgiveness = forgiven > 0 ? `<div class="loan-history forgiven">Perdoado: ${money(forgiven)}${loan.forgivenAt ? ` em ${fmtDate(loan.forgivenAt)}` : ''} · lançado como despesa</div>` : '';
    const activeActions = remaining > 0.009
      ? `<button class="mini-btn" data-loan-repay="${loan.id}">Registrar devolução</button><button class="mini-btn danger-text" data-loan-forgive="${loan.id}">Perdoar saldo</button>`
      : (status.key === 'forgiven' ? `<button class="mini-btn" data-loan-reopen="${loan.id}">Reabrir</button>` : '');

    return `<article class="list-item loan-item">
      <div class="item-main">
        <div class="item-title"><span>${esc(person.name)}</span><span class="loan-status ${status.key}">${status.label}</span></div>
        <div class="item-meta">Emprestado ${money(loan.amount)} · ${fmtDate(loan.lentDate)} · ${esc(loan.paymentMethod || 'Outro')}${due}</div>
        ${note}${history}${forgiveness}
        <div class="item-actions">${activeActions}<button class="mini-btn danger-text" data-loan-delete="${loan.id}">Excluir</button></div>
      </div>
      <div class="loan-right"><small>A receber</small><strong>${money(remaining)}</strong></div>
    </article>`;
  }

  function openPersonModal(id = '') {
    const state = getState();
    const form = document.getElementById('loanPersonForm');
    form.reset();
    form.elements.personId.value = '';
    setText('loanPersonModalTitle', id ? 'Editar pessoa' : 'Nova pessoa');
    if (id) {
      const person = state.loanPeople.find(p => p.id === id);
      if (!person) return;
      form.elements.personId.value = person.id;
      form.elements.name.value = person.name || '';
      form.elements.phone.value = person.phone || '';
      form.elements.note.value = person.note || '';
    }
    document.getElementById('loanPersonModal').showModal();
    setTimeout(() => form.elements.name.focus(), 50);
  }

  function openLoanModal(personId = '') {
    const state = getState();
    if (!state.loanPeople.length) {
      toast('Cadastre uma pessoa primeiro.');
      openPersonModal();
      return;
    }
    updatePersonSelect();
    const form = document.getElementById('loanForm');
    form.reset();
    form.elements.lentDate.value = today();
    updatePersonSelect();
    const preferred = personId || (selectedPersonId !== 'all' ? selectedPersonId : '');
    if (preferred && state.loanPeople.some(p => p.id === preferred)) form.elements.personId.value = preferred;
    document.getElementById('loanModal').showModal();
    setTimeout(() => form.elements.amount.focus(), 50);
  }

  function updatePersonSelect() {
    const select = document.getElementById('loanPersonSelect');
    if (!select) return;
    const previous = select.value;
    const people = getState().loanPeople.slice().sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    select.innerHTML = people.length ? people.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('') : '<option value="">Cadastre uma pessoa primeiro</option>';
    if (people.some(p => p.id === previous)) select.value = previous;
  }

  function openRepayment(id) {
    const loan = getState().loans.find(l => l.id === id);
    if (!loan) return;
    const person = personById(loan.personId) || { name: 'Pessoa' };
    const remaining = loanRemaining(loan);
    const form = document.getElementById('loanRepaymentForm');
    form.reset();
    form.elements.loanId.value = id;
    form.elements.date.value = today();
    form.elements.paymentMethod.value = loan.paymentMethod || 'Pix';
    document.getElementById('repaymentInfo').textContent = `Saldo a receber de ${person.name}: ${money(remaining)}`;
    document.getElementById('loanRepaymentModal').showModal();
    setTimeout(() => form.elements.amount.focus(), 50);
  }

  function forgiveLoan(id) {
    const state = getState();
    const loan = state.loans.find(l => l.id === id);
    if (!loan) return;
    const person = personById(loan.personId) || { name: 'Pessoa' };
    const remaining = loanRemaining(loan);
    if (!(remaining > 0)) return;
    if (!confirm(`Perdoar ${money(remaining)} que ${person.name} ainda deve?\n\nO valor será lançado no extrato como DESPESA, mas não sairá novamente do seu saldo porque o dinheiro já saiu no dia do empréstimo.`)) return;

    loan.forgivenAmount = round((Number(loan.forgivenAmount) || 0) + remaining);
    loan.forgivenAt = today();
    const tx = makeForgivenExpense(loan, person, remaining, loan.forgivenAt);
    state.transactions.push(tx);
    loan.forgivenTransactionId = tx.id;

    api.saveState();
    api.renderAll();
    renderLoans();
    updateAvailabilityWithLoans();
    toast('Saldo perdoado e lançado como despesa.');
  }

  function makeForgivenExpense(loan, person, amount, date) {
    return {
      id: uid('tx'), type: 'expense', amount: round(amount),
      description: `Empréstimo perdoado - ${person?.name || 'Pessoa'}`,
      category: 'Empréstimo perdoado',
      paymentMethod: loan.paymentMethod || 'Outro',
      date: date || today(),
      note: 'Perda de empréstimo. Registro contábil sem nova saída de dinheiro.',
      source: 'loan_forgiven', loanId: loan.id, nonCashImpact: true
    };
  }

  function reopenLoan(id) {
    const state = getState();
    const loan = state.loans.find(l => l.id === id);
    if (!loan || !(Number(loan.forgivenAmount) > 0)) return;
    const person = personById(loan.personId) || { name: 'Pessoa' };
    if (!confirm(`Reabrir a dívida de ${person.name}? O valor perdoado voltará a aparecer como "A receber" e a despesa correspondente será removida do extrato.`)) return;
    state.transactions = state.transactions.filter(tx => !(tx.source === 'loan_forgiven' && tx.loanId === loan.id));
    loan.forgivenAmount = 0;
    loan.forgivenAt = '';
    loan.forgivenTransactionId = '';
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
    const person = personById(loan.personId) || { name: 'Pessoa' };
    if (!confirm(`Excluir este empréstimo de ${person.name}?\n\nIsso remove devoluções e eventual despesa de valor perdoado, recalculando seu saldo disponível.`)) return;
    state.loans = state.loans.filter(l => l.id !== id);
    state.transactions = state.transactions.filter(tx => !(tx.source === 'loan_forgiven' && tx.loanId === id));
    api.saveState();
    api.renderAll();
    renderLoans();
    updateAvailabilityWithLoans();
    toast('Empréstimo excluído.');
  }

  function deletePerson(id) {
    const state = getState();
    const person = state.loanPeople.find(p => p.id === id);
    if (!person) return;
    if (state.loans.some(l => l.personId === id)) return toast('Essa pessoa possui empréstimos. Exclua o histórico dela primeiro.');
    if (!confirm(`Excluir o cadastro de ${person.name}?`)) return;
    state.loanPeople = state.loanPeople.filter(p => p.id !== id);
    if (selectedPersonId === id) selectedPersonId = 'all';
    api.saveState();
    renderLoans();
    toast('Pessoa excluída.');
  }

  function personSummary(personId) {
    const loans = getState().loans.filter(l => l.personId === personId);
    return {
      lent: round(sum(loans, l => Number(l.amount) || 0)),
      received: round(sum(loans, loanReceived)),
      forgiven: round(sum(loans, l => Number(l.forgivenAmount) || 0)),
      outstanding: round(sum(loans, loanRemaining)),
      count: loans.length,
      overdue: loans.some(l => loanStatus(l).key === 'overdue')
    };
  }

  function personById(id) {
    return getState().loanPeople.find(p => p.id === id);
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

    state.transactions.forEach(tx => {
      if (!tx.date || tx.date > cutoff) return;
      if (tx.nonCashImpact || tx.source === 'loan_forgiven') return;
      const signed = tx.type === 'income' ? Number(tx.amount) : -Number(tx.amount);
      addAt(paymentLocation(tx.paymentMethod), signed);
    });

    state.loans.forEach(loan => {
      if (loan.lentDate && loan.lentDate <= cutoff) addAt(paymentLocation(loan.paymentMethod), -(Number(loan.amount) || 0));
      (Array.isArray(loan.repayments) ? loan.repayments : []).forEach(rep => {
        if (rep.date && rep.date <= cutoff) addAt(paymentLocation(rep.paymentMethod), Number(rep.amount) || 0);
      });
    });

    function addAt(location, amount) {
      if (location === 'cash') cash += amount;
      else if (location === 'account') account += amount;
      else unclassified += amount;
    }

    account = round(account); cash = round(cash); unclassified = round(unclassified);
    return { account, cash, unclassified, total: round(account + cash) };
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
    const raw = String(value ?? '').trim().replace(/\s/g, '').replace(/R\$/gi, '');
    if (!raw) return 0;
    const normalized = raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw;
    const n = Number(normalized);
    return Number.isFinite(n) ? n : 0;
  }

  function sum(items, fn) {
    return round(items.reduce((total, item) => total + (Number(fn(item)) || 0), 0));
  }

  function normalizeName(value) {
    return String(value || '').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function injectStyles() {
    if (document.getElementById('loanModuleStyles')) return;
    const style = document.createElement('style');
    style.id = 'loanModuleStyles';
    style.textContent = `
      .bottom-nav { grid-template-columns: repeat(8, minmax(70px, 1fr)); }
      .loan-intro { color: var(--muted); font-size: .88rem; line-height: 1.55; margin: -4px 0 16px; }
      .loan-stats { margin-bottom: 16px; }
      .loan-title-row { gap: 12px; }
      .loan-person-search { min-width: 190px; max-width: 280px; }
      .loan-people-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px; }
      .loan-people-grid.empty-state { display: block; }
      .loan-person-card { border: 1px solid var(--line); border-radius: 18px; padding: 15px; background: var(--surface); min-width: 0; }
      .loan-person-card.selected { outline: 2px solid color-mix(in srgb, var(--brand) 45%, transparent); }
      .loan-person-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
      .loan-person-head strong { display: block; font-size: 1rem; }
      .loan-person-head small { display: block; color: var(--muted); margin-top: 3px; }
      .loan-person-main { margin: 14px 0 10px; }
      .loan-person-main span { display: block; color: var(--muted); font-size: .74rem; }
      .loan-person-main strong { display: block; font-size: 1.45rem; margin-top: 2px; }
      .loan-person-breakdown { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 10px; color: var(--muted); font-size: .74rem; }
      .loan-person-breakdown b { color: var(--text); font-weight: 800; }
      .loan-person-note { color: var(--muted); font-size: .77rem; margin: 10px 0 0; line-height: 1.4; }
      .loan-person-actions { margin-top: 12px; }
      .loan-filter-row { display: flex; gap: 10px; margin-bottom: 12px; }
      .loan-filter-row select { max-width: 240px; }
      .loan-item { align-items: start; }
      .loan-right { min-width: 105px; text-align: right; }
      .loan-right small { display: block; color: var(--muted); font-size: .7rem; }
      .loan-right strong { display: block; margin-top: 4px; font-size: 1rem; }
      .loan-note, .loan-history { color: var(--muted); font-size: .76rem; margin-top: 5px; line-height: 1.4; }
      .loan-history.forgiven { color: var(--danger); }
      .loan-status { display: inline-flex; align-items: center; border-radius: 999px; padding: 4px 8px; font-size: .65rem; font-weight: 900; margin-left: 7px; white-space: nowrap; }
      .loan-status.pending { background: color-mix(in srgb, var(--warning) 16%, transparent); color: var(--warning); }
      .loan-status.overdue { background: color-mix(in srgb, var(--danger) 14%, transparent); color: var(--danger); }
      .loan-status.paid { background: color-mix(in srgb, var(--success) 14%, transparent); color: var(--success); }
      .loan-status.forgiven { background: color-mix(in srgb, var(--muted) 14%, transparent); color: var(--muted); }
      @media (max-width: 760px) {
        .bottom-nav { grid-template-columns: repeat(8, minmax(74px, 1fr)); }
        .loan-people-panel .panel-head, .loan-history-head { align-items: flex-start; }
        .loan-person-search { max-width: none; width: 100%; }
      }
      @media (max-width: 520px) {
        .loan-title-row { align-items: flex-start; }
        .loan-title-row .action-pair { display: flex; width: 100%; }
        .loan-title-row .action-pair button { flex: 1; }
        .loan-people-grid { grid-template-columns: 1fr; }
        .loan-person-breakdown { grid-template-columns: 1fr 1fr; }
        .loan-item { grid-template-columns: minmax(0, 1fr) auto; }
      }
    `;
    document.head.appendChild(style);
  }
})();

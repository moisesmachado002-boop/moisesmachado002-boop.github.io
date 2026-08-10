(() => {
  'use strict';
  const api = window.__financeApp;
  if (!api) return;

  const ids = [
    'accountBalanceValue', 'cashBalanceValue', 'availableTotalValue', 'unclassifiedBalanceValue',
    'reportAccountBalance', 'reportCashBalance', 'reportAvailableTotal', 'reportUnclassifiedBalance'
  ];

  let refreshing = false;
  const balanceObserver = new MutationObserver(() => {
    if (!refreshing) refreshAvailability();
  });
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) balanceObserver.observe(el, { childList: true, subtree: true, characterData: true });
  });

  const transactionsList = document.getElementById('transactionsList');
  if (transactionsList) {
    const txObserver = new MutationObserver(protectAutomaticEntries);
    txObserver.observe(transactionsList, { childList: true, subtree: true });
    protectAutomaticEntries();
  }

  refreshAvailability();
  setInterval(() => {
    if (document.visibilityState !== 'hidden') refreshAvailability();
  }, 1200);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refreshAvailability();
  });

  function protectAutomaticEntries() {
    const state = api.getState();
    document.querySelectorAll('#transactionsList [data-delete-tx]').forEach(btn => {
      const tx = state.transactions?.find(t => t.id === btn.dataset.deleteTx);
      if (!tx || tx.source !== 'loan_forgiven') return;
      btn.disabled = true;
      btn.textContent = 'Automático';
      btn.title = 'Gerado pelo empréstimo. Reabra ou altere o empréstimo para remover este registro.';
    });
  }

  function refreshAvailability() {
    refreshing = true;
    try {
      const dash = availabilityAt(api.todayLocal());
      setText('accountBalanceValue', api.money(dash.account));
      setText('cashBalanceValue', api.money(dash.cash));
      setText('availableTotalValue', api.money(dash.total));
      setText('unclassifiedBalanceValue', api.money(dash.unclassified));

      const reportMonth = document.getElementById('reportMonth')?.value;
      if (reportMonth) {
        const currentMonth = api.todayLocal().slice(0, 7);
        let cutoff = api.todayLocal();
        if (reportMonth < currentMonth) {
          const [year, month] = reportMonth.split('-').map(Number);
          cutoff = `${reportMonth}-${String(new Date(year, month, 0).getDate()).padStart(2, '0')}`;
        }
        const report = availabilityAt(cutoff);
        setText('reportAccountBalance', api.money(report.account));
        setText('reportCashBalance', api.money(report.cash));
        setText('reportAvailableTotal', api.money(report.total));
        setText('reportUnclassifiedBalance', api.money(report.unclassified));
      }
    } finally {
      refreshing = false;
    }
  }

  function availabilityAt(cutoff) {
    const state = api.getState();
    const opening = state.openingBalances || { account: 0, cash: 0 };
    let account = Number(opening.account) || 0;
    let cash = Number(opening.cash) || 0;
    let unclassified = 0;

    const addAt = (location, amount) => {
      if (location === 'cash') cash += amount;
      else if (location === 'account') account += amount;
      else unclassified += amount;
    };

    (state.transactions || []).forEach(tx => {
      if (!tx.date || tx.date > cutoff || tx.nonCashImpact === true) return;
      const amount = Number(tx.amount) || 0;
      addAt(paymentLocation(tx.paymentMethod), tx.type === 'income' ? amount : -amount);
    });

    (state.loans || []).forEach(loan => {
      if (loan.lentDate && loan.lentDate <= cutoff) {
        addAt(paymentLocation(loan.paymentMethod), -(Number(loan.amount) || 0));
      }
      (Array.isArray(loan.repayments) ? loan.repayments : []).forEach(rep => {
        if (rep.date && rep.date <= cutoff) {
          addAt(paymentLocation(rep.paymentMethod), Number(rep.amount) || 0);
        }
      });
    });

    account = api.roundMoney(account);
    cash = api.roundMoney(cash);
    unclassified = api.roundMoney(unclassified);
    return { account, cash, unclassified, total: api.roundMoney(account + cash) };
  }

  function paymentLocation(method) {
    if (method === 'Dinheiro') return 'cash';
    if (['Pix', 'Débito', 'Transferência', 'Boleto'].includes(method)) return 'account';
    return 'unclassified';
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el && el.textContent !== text) el.textContent = text;
  }
})();

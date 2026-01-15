const STORAGE_KEYS = {
  user: 'alke_user',
  balance: 'alke_balance',
  transactions: 'alke_transactions',
  contacts: 'alke_contacts'
};

const defaultState = {
  user: { email: 'user@alke.com', password: 'alke123', name: 'Jorge' },
  balance: 100000,
  transactions: [
    { id: cryptoId(), type: 'deposit', amount: 50000, date: isoNow(), note: 'Depósito inicial' },
    { id: cryptoId(), type: 'transfer', amount: -10000, date: isoNow(), note: 'Pago servicios' }
  ],
  contacts: ['María López', 'Juan Pérez', 'Ana Torres', 'Banco Alke', 'Proveedor Servicios']
};

function cryptoId() {
  return 'tx_' + Math.random().toString(36).slice(2, 10);
}
function isoNow() {
  return new Date().toISOString();
}

function initStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.user)) {
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(defaultState.user));
  }
  if (!localStorage.getItem(STORAGE_KEYS.balance)) {
    localStorage.setItem(STORAGE_KEYS.balance, String(defaultState.balance));
  }
  if (!localStorage.getItem(STORAGE_KEYS.transactions)) {
    localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(defaultState.transactions));
  }
  if (!localStorage.getItem(STORAGE_KEYS.contacts)) {
    localStorage.setItem(STORAGE_KEYS.contacts, JSON.stringify(defaultState.contacts));
  }
}

function getUser() { return JSON.parse(localStorage.getItem(STORAGE_KEYS.user)); }
function getBalance() { return Number(localStorage.getItem(STORAGE_KEYS.balance) || 0); }
function setBalance(v) { localStorage.setItem(STORAGE_KEYS.balance, String(v)); }
function getTransactions() { return JSON.parse(localStorage.getItem(STORAGE_KEYS.transactions) || '[]'); }
function setTransactions(arr) { localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(arr)); }
function getContacts() { return JSON.parse(localStorage.getItem(STORAGE_KEYS.contacts) || '[]'); }
function setContacts(arr) { localStorage.setItem(STORAGE_KEYS.contacts, JSON.stringify(arr)); }

function addTransaction(type, amount, note) {
  const tx = { id: cryptoId(), type, amount, date: isoNow(), note };
  const list = getTransactions();
  list.unshift(tx);
  setTransactions(list);
  showToast(type === 'deposit' ? 'Depósito registrado' : 'Transferencia realizada');
}

function formatCLP(n) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);
}

function showToast(msg) {
  const el = document.querySelector('.toast');
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => el.style.display = 'none', 2000);
}

document.addEventListener('DOMContentLoaded', () => {
  initStorage();

  const user = getUser();
  const userEl = document.querySelector('[data-user-name]');
  if (userEl && user?.name) userEl.textContent = user.name;

  const balEl = document.querySelector('[data-balance]');
  if (balEl) balEl.textContent = formatCLP(getBalance());

  const txListEl = document.querySelector('[data-tx-list]');
  if (txListEl) {
    const txs = getTransactions();
    txListEl.innerHTML = txs.map(tx => {
      const signClass = tx.amount >= 0 ? 'amount-pos' : 'amount-neg';
      const label = tx.type === 'deposit' ? 'Depósito' : 'Transferencia';
      const date = new Date(tx.date).toLocaleString('es-CL');
      return `
        <div class="list-item">
          <div>
            <div><strong>${label}</strong> — <span class="tag">${date}</span></div>
            <div style="color: var(--muted)">${tx.note || ''}</div>
          </div>
          <div class="${signClass}">${formatCLP(tx.amount)}</div>
        </div>`;
    }).join('');
  }

  const loginForm = document.querySelector('#loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = loginForm.email.value.trim();
      const password = loginForm.password.value.trim();
      const u = getUser();
      if (email === u.email && password === u.password) {
        showToast('Login exitoso');
        setTimeout(() => window.location.href = 'menu.html', 800);
      } else {
        showToast('Credenciales inválidas');
      }
    });
  }

  const depositForm = document.querySelector('#depositForm');
  if (depositForm) {
    depositForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const amount = Number(depositForm.amount.value);
      const note = depositForm.note.value.trim();
      if (!amount || amount <= 0) return showToast('Monto inválido');
      const newBal = getBalance() + amount;
      setBalance(newBal);
      addTransaction('deposit', amount, note || 'Depósito');
      document.querySelector('[data-balance]').textContent = formatCLP(newBal);
      depositForm.reset();
    });
  }

  const sendForm = document.querySelector('#sendForm');
  if (sendForm) {
    sendForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const to = sendForm.to.value.trim();
      const amount = Number(sendForm.amount.value);
      const note = sendForm.note.value.trim();
      if (!to) return showToast('Selecciona un contacto');
      if (!amount || amount <= 0) return showToast('Monto inválido');
      const bal = getBalance();
      if (amount > bal) return showToast('Saldo insuficiente');
      setBalance(bal - amount);
      addTransaction('transfer', -amount, note || `Envío a ${to}`);
      document.querySelector('[data-balance]').textContent = formatCLP(getBalance());
      sendForm.reset();
    });

    const contacts = getContacts();
    $('#to').on('input', function () {
      const q = $(this).val().toLowerCase();
      const matches = contacts.filter(c => c.toLowerCase().includes(q)).slice(0, 5);
      const list = $('#autocomplete');
      list.empty();
      matches.forEach(m => {
        list.append(`<div class="list-item" style="cursor:pointer">${m}</div>`);
      });
      list.find('.list-item').on('click', function () {
        $('#to').val($(this).text());
        list.empty();
      });
    });

    $('#addContactBtn').on('click', function () {
      const name = prompt('Nombre del nuevo contacto:');
      if (!name) return;
      const arr = getContacts();
      arr.push(name.trim());
      setContacts(arr);
      showToast('Contacto agregado');
    });
  }

  $('.card').hide().fadeIn(250);
});
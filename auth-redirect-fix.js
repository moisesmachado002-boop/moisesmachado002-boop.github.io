(() => {
  'use strict';

  if (!window.supabase?.createClient) return;

  const SUPABASE_URL = 'https://pqcltcegwmyuzytivakt.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_3B61vWHjC_Qu3ksO0GJVXA_d_ytJyop';
  const REDIRECT_URL = new URL('./', window.location.href).href.split('?')[0].split('#')[0];

  const authClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });

  const form = document.getElementById('authForm');
  const signUpBtn = document.getElementById('signUpBtn');
  const signInBtn = document.getElementById('signInBtn');
  const message = document.getElementById('authMessage');
  if (!form || !signUpBtn || !message) return;

  let resendBtn = document.getElementById('resendConfirmationBtn');
  if (!resendBtn) {
    resendBtn = document.createElement('button');
    resendBtn.type = 'button';
    resendBtn.id = 'resendConfirmationBtn';
    resendBtn.className = 'text-btn';
    resendBtn.textContent = 'Reenviar e-mail de confirmação';
    resendBtn.style.display = 'none';
    resendBtn.style.width = '100%';
    resendBtn.style.marginTop = '8px';
    message.insertAdjacentElement('afterend', resendBtn);
  }

  signUpBtn.addEventListener('click', async event => {
    event.preventDefault();
    event.stopImmediatePropagation();

    const fd = new FormData(form);
    const email = String(fd.get('email') || '').trim();
    const password = String(fd.get('password') || '');
    if (!email || password.length < 6) {
      setMessage('Digite um e-mail válido e uma senha com pelo menos 6 caracteres.', 'error');
      return;
    }

    setBusy(true, 'Criando conta...');
    const { data, error } = await authClient.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: REDIRECT_URL }
    });

    setBusy(false);
    if (error) {
      setMessage(friendlyError(error), 'error');
      resendBtn.style.display = '';
      return;
    }

    if (data?.session) {
      setMessage('Conta criada. Você já pode entrar.', 'success');
      resendBtn.style.display = 'none';
      return;
    }

    setMessage('Conta criada. Enviamos um e-mail de confirmação. Depois de confirmar, volte aqui e toque em Entrar.', 'success');
    resendBtn.style.display = '';
  }, true);

  resendBtn.addEventListener('click', async () => {
    const email = String(new FormData(form).get('email') || '').trim();
    if (!email) return setMessage('Digite o e-mail da conta para reenviar a confirmação.', 'error');

    resendBtn.disabled = true;
    resendBtn.textContent = 'Reenviando...';
    const { error } = await authClient.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: REDIRECT_URL }
    });
    resendBtn.disabled = false;
    resendBtn.textContent = 'Reenviar e-mail de confirmação';

    if (error) return setMessage(friendlyError(error), 'error');
    setMessage('Novo e-mail enviado. Use o link mais recente para confirmar a conta.', 'success');
  });

  function setBusy(busy, text = '') {
    signUpBtn.disabled = busy;
    if (signInBtn) signInBtn.disabled = busy;
    signUpBtn.textContent = busy ? text : 'Criar minha conta';
  }

  function setMessage(text, type = '') {
    message.textContent = text;
    message.classList.remove('error', 'success');
    if (type) message.classList.add(type);
  }

  function friendlyError(error) {
    const raw = String(error?.message || '').toLowerCase();
    if (raw.includes('rate limit') || raw.includes('email rate')) return 'Aguarde um pouco antes de solicitar outro e-mail.';
    if (raw.includes('already registered') || raw.includes('already exists')) return 'Essa conta já existe. Se ainda não confirmou o e-mail, use “Reenviar e-mail de confirmação”.';
    if (raw.includes('invalid email')) return 'Informe um e-mail válido.';
    return error?.message || 'Não foi possível concluir o cadastro.';
  }
})();

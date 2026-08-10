(async () => {
  const VERSION = '1.3.5';
  const bodyParts = ["body.01.txt", "body.02.txt", "body.03.txt", "body.04.txt", "body.05.txt"];
  const styleParts = ["style.01.txt", "style.02.txt", "style.03.txt"];
  const appParts = ["app.01.txt", "app.02.txt", "app.03.txt", "app.04.txt", "app.05.txt", "app.06.txt", "app.07.txt", "app.08.txt", "app.09.txt", "app.10.txt", "app.11.txt"];
  const versioned = p => `${p}?v=${VERSION}`;
  const readParts = async parts => (await Promise.all(parts.map(p => fetch(versioned(p), { cache: 'no-store' }).then(r => { if (!r.ok) throw new Error(p); return r.text(); })))).join('');
  const loadScript = src => new Promise((resolve, reject) => { const s=document.createElement('script'); s.src=src; s.onload=resolve; s.onerror=reject; document.head.appendChild(s); });
  try {
    const [bodyHtml, css] = await Promise.all([readParts(bodyParts), readParts(styleParts)]);
    const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);
    document.body.innerHTML = bodyHtml;
    if (!window.supabase) await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
    const js = await readParts(appParts);
    (0, eval)(js);
    await loadScript(versioned('./category-fix.js'));
  } catch (err) {
    document.body.innerHTML = '<div style="font-family:system-ui;padding:24px">Não foi possível carregar o Meu Financeiro. Verifique sua internet e atualize a página.</div>';
    console.error(err);
  }
})();

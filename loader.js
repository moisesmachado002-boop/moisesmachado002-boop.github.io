(async () => {
  const styleParts = ["style.01.txt", "style.02.txt", "style.03.txt"];
  const appParts = ["app.01.txt", "app.02.txt", "app.03.txt", "app.04.txt", "app.05.txt", "app.06.txt", "app.07.txt", "app.08.txt", "app.09.txt", "app.10.txt"];
  try {
    const css = (await Promise.all(styleParts.map(p => fetch(p).then(r => { if (!r.ok) throw new Error(p); return r.text(); })))).join('');
    const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);
    const js = (await Promise.all(appParts.map(p => fetch(p).then(r => { if (!r.ok) throw new Error(p); return r.text(); })))).join('');
    (0, eval)(js);
  } catch (err) {
    document.body.innerHTML = '<div style="font-family:system-ui;padding:24px">Não foi possível carregar o Meu Financeiro. Verifique sua internet e atualize a página.</div>';
    console.error(err);
  }
})();

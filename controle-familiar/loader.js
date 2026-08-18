(async () => {
  const VERSION = '2.2.1';
  window.__CONTROLE_FAMILIAR_VERSION = VERSION;

  const bodyParts = ["body.01.txt"];
  const styleParts = ["style.01.txt", "style.02.txt", "style.03.txt", "style.04.txt"];
  const appParts = ["app.01.txt", "app.02.txt", "app.03.txt", "app.04.txt", "app.05.txt"];

  const versioned = p => `${p}?v=${VERSION}`;

  const readParts = async parts => (
    await Promise.all(
      parts.map(p =>
        fetch(versioned(p), { cache: 'no-store' }).then(r => {
          if (!r.ok) throw new Error(`Falha ao carregar ${p}`);
          return r.text();
        })
      )
    )
  ).join('\n');

  try {
    const [bodyHtml, css, js] = await Promise.all([
      readParts(bodyParts),
      readParts(styleParts),
      readParts(appParts)
    ]);

    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    document.body.innerHTML = bodyHtml;
    (0, eval)(js);
  } catch (err) {
    document.body.innerHTML = '<div style="font-family:system-ui;padding:24px">Não foi possível carregar a Gestão Financeira Familiar. Atualize a página e tente novamente.</div>';
    console.error(err);
  }
})();

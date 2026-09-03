(async () => {
  const VERSION = '2.13.1';
  window.__CONTROLE_FAMILIAR_VERSION = VERSION;

  const bodyParts = ["body.01.txt"];
  const styleParts = ["style.01.txt", "style.02.txt", "style.03.txt", "style.04.txt", "style.05.txt", "style.06.txt", "style.07.txt", "style.08.txt", "style.09.txt", "style.10.txt", "style.11.txt", "style.12.txt", "style.13.txt", "style.14.txt", "style.15.txt", "style.16.txt", "style.17.txt"];
  const appParts = ["app.01.txt", "app.02.txt", "app.03.txt", "app.04.txt", "app.08.txt", "app.10.txt", "app.26.txt", "app.31.txt", "app.05.txt", "app.06.txt", "app.07.txt", "app.09.txt", "app.11.txt", "app.12.txt", "app.13.txt", "app.14.txt", "app.15.txt", "app.16.txt", "app.17.txt", "app.18.txt", "app.19.txt", "app.20.txt", "app.21.txt", "app.22.txt", "app.23.txt", "app.24.txt", "app.25.txt", "app.28.txt", "app.29.txt", "app.30.txt", "app.32.txt", "app.27.txt"];

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
    document.body.innerHTML = '<div style="font-family:system-ui;padding:24px">Não foi possível carregar a Gestão Financeira Familiar. Se estiver sem internet e for a primeira abertura neste aparelho, conecte-se uma vez para preparar o modo offline.</div>';
    console.error(err);
  }
})();
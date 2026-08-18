(async () => {
  const VERSION = '2.4.0';
  window.__CONTROLE_FAMILIAR_VERSION = VERSION;

  const bodyParts = ["body.01.txt"];
  const styleParts = ["style.01.txt", "style.02.txt", "style.03.txt", "style.04.txt", "style.05.txt"];
  const appParts = ["app.01.txt", "app.02.txt", "app.03.txt", "app.04.txt", "app.08.txt", "app.10.txt", "app.05.txt", "app.06.txt", "app.07.txt", "app.09.txt", "app.11.txt", "app.12.txt"];

  const versioned = p => `${p}?v=${VERSION}`;

  const readParts = async parts => (
    await Promise.all(
      parts.map(p =>
        fetch(versioned(p)).then(r => {
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

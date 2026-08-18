# Controle Financeiro Familiar — Sprint

## Sprint 1 — Base modular e segurança

- [x] Preservar layout e fluxo do HTML original
- [x] Separar a aplicação no padrão modular usado no Meu Financeiro
- [x] Criar `index.html` enxuto
- [x] Criar `loader.js` versionado
- [x] Separar interface em `body.01.txt`
- [x] Separar estilos em `style.01.txt`
- [x] Separar lógica em `app.01.txt`
- [x] Migrar lançamentos antigos para ID único sem exigir recadastro
- [x] Tornar edição e exclusão baseadas em ID, não em posição do array
- [x] Adicionar botão Cancelar edição
- [x] Fazer Enter apenas avançar o foco; o último Enter não salva automaticamente
- [x] Proteger leitura do `localStorage` contra JSON corrompido
- [x] Validar estrutura antes de importar backup
- [x] Manter compatibilidade com backup antigo em formato de array
- [x] Aceitar responsáveis/cartões já existentes no histórico
- [x] Gerar anos do filtro automaticamente
- [x] Corrigir preenchimento da data usando horário local
- [x] Exportar backup com `Blob` e data local
- [x] Limpar relatório temporário após impressão
- [x] Testar sintaxe JavaScript
- [x] Testar compatibilidade estrutural com o backup de 69 lançamentos

### Aviso encontrado no backup atual

- [ ] Revisar manualmente o lançamento `SAO ROQUE` com data `0002-07-07`. O sistema apenas sinaliza; não corrige automaticamente.

## Sprint 2 — Fatura e parcelamento

- [ ] Criar competência completa da fatura (`AAAA-MM`)
- [ ] Manter data original da compra separada da competência da fatura
- [ ] Criar campos de parcela atual e total de parcelas
- [ ] Criar ID/grupo de parcelamento
- [ ] Ao lançar `2/6`, gerar automaticamente `3/6`, `4/6`, `5/6` e `6/6` nas competências seguintes
- [ ] Editar somente uma parcela ou esta e as futuras
- [ ] Excluir somente uma parcela ou esta e as futuras
- [ ] Criar resumo de próximas faturas
- [ ] Mostrar valor já comprometido nos próximos meses

## Sprint 3 — Persistência online

- [ ] Definir integração com banco online sem substituir o app atual
- [ ] Manter JSON como backup de segurança
- [ ] Planejar migração dos dados locais para banco com rollback

## Regra do projeto

Manter a interface conhecida e evoluir por pequenas sprints. Quando uma parte crescer, separar em novos arquivos (`app.02.txt`, `style.02.txt`, etc.) em vez de concentrar tudo em um único arquivo.

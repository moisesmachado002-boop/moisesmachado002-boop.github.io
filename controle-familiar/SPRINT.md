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

- [x] Criar competência completa da fatura (`AAAA-MM`)
- [x] Manter data original da compra separada da competência da fatura
- [x] Criar campos de parcela atual e total de parcelas
- [x] Criar ID/grupo de parcelamento
- [x] Ao lançar `2/6`, registrar `2/6` e gerar automaticamente `3/6`, `4/6`, `5/6` e `6/6` nas competências seguintes
- [x] Manter o valor informado como valor de cada parcela
- [x] Editar somente uma parcela ou esta e as futuras
- [x] Excluir somente uma parcela ou esta e as futuras
- [x] Criar filtro por competência completa da fatura
- [x] Criar resumo de próximas faturas
- [x] Mostrar valor já comprometido nos próximos meses
- [x] Exibir `parcela/total` na tabela e no relatório
- [x] Manter `mesFatura` no JSON para compatibilidade com backups antigos
- [x] Preservar lançamentos antigos sem inventar o ano da fatura
- [x] Criar conversão manual dos lançamentos antigos para um ano informado pelo usuário
- [x] Separar Sprint 2 em `app.03.txt`, `app.04.txt` e `style.02.txt`
- [x] Atualizar aplicação para versão `2.1.0`

### Testes da Sprint 2

- [x] Sintaxe de `app.03.txt` validada
- [x] Sintaxe de `app.04.txt` validada
- [x] Teste `2/6` a partir de `2026-08`: gera competências até `2026-12`
- [x] Teste de virada de ano: `2026-12 + 1 mês = 2027-01`
- [x] Backup atual testado: 69 registros aceitos estruturalmente
- [x] Data suspeita `0002-07-07` continua sinalizada e não é alterada automaticamente

## Sprint 3 — Persistência online

- [x] Inspecionar a integração Supabase já usada pelo Meu Financeiro
- [x] Confirmar que o Meu Financeiro usa a tabela `finance_state`
- [x] Definir tabela própria `family_finance_state` para impedir interferência entre os dois sistemas
- [x] Manter o mesmo projeto Supabase, mas dados familiares em tabela separada
- [x] Separar também a sessão de autenticação da Gestão Familiar com `storageKey` próprio
- [x] Usar logout local na Gestão Familiar para não encerrar outras sessões do usuário
- [x] Manter JSON como backup de segurança
- [x] Manter `localStorage` como fallback quando estiver sem internet
- [x] Criar `supabase.sql` com tabela, trigger, permissões e RLS por usuário
- [x] Criar módulo de nuvem `app.05.txt`
- [x] Criar estilos da nuvem em `style.03.txt`
- [x] Preparar login, criação de conta, sair e sincronização manual
- [x] Preparar sincronização automática após alterações locais
- [x] Preparar tratamento de conflito inicial entre dados locais e dados da nuvem
- [x] Manter metadados de sincronização separados por usuário
- [x] Criar `family_finance_state` no projeto Supabase PAINEL FINANCEIRO
- [x] Confirmar RLS ativo na tabela familiar
- [x] Testar RLS: segundo usuário não consegue alterar dados do primeiro
- [x] Confirmar que os testes foram revertidos e a tabela familiar voltou a 0 linhas
- [x] Ligar `app.05.txt` e `style.03.txt` no `loader.js`
- [x] Atualizar versão para `2.2.0`
- [ ] Testar login real pelo navegador
- [ ] Testar upload do backup atual para a nuvem
- [ ] Testar alteração em um aparelho e recuperação em outro
- [ ] Confirmar no teste final que sair da Gestão Familiar não desloga o Meu Financeiro
- [ ] Confirmar após sincronização real que a tabela `finance_state` do Meu Financeiro permanece inalterada

## Melhorias futuras

- [ ] Permitir informar valor total da compra e calcular automaticamente o valor das parcelas
- [ ] Criar cadastro editável de responsáveis e cartões
- [ ] Criar histórico/registro de alterações importantes

## Regra do projeto

Manter a interface conhecida e evoluir por pequenas sprints. Quando uma parte crescer, separar em novos arquivos (`app.02.txt`, `style.02.txt`, etc.) em vez de concentrar tudo em um único arquivo.

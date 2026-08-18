# Sprint 4 — Acabamento e testes reais

## Objetivos

- [x] Criar branch separada `agent/controle-familiar-sprint-4`
- [x] Validar parcelamento real já sincronizado
- [x] Confirmar ausência de parcelas duplicadas
- [x] Confirmar ausência de parcelas inconsistentes
- [x] Ordenar a tabela por data real, mantendo os lançamentos mais recentes primeiro
- [x] Somar totais em centavos para evitar erro de ponto flutuante
- [x] Somar próximas faturas em centavos
- [x] Marcar alteração local imediatamente para reforçar o modo offline
- [x] Exibir status `Salvo neste aparelho` quando houver alteração sem internet
- [x] Criar diagnóstico interno de integridade dos parcelamentos
- [x] Criar `app.06.txt`
- [x] Publicar a versão `2.3.0`
- [x] Testar criação normal e sincronização com a nuvem
- [x] Testar edição normal sem duplicar registro
- [x] Testar exclusão normal e retorno à contagem anterior
- [x] Detectar em teste real a falha de reabertura do app sem internet
- [x] Criar Service Worker próprio para manter o aplicativo disponível offline
- [x] Remover `cache: no-store` dos fragmentos do aplicativo
- [x] Criar retomada automática da conexão após reabertura offline
- [x] Preparar versão `2.3.1`
- [ ] Publicar a versão `2.3.1`
- [ ] Repetir lançamento offline → fechar/reabrir → voltar internet → sincronizar
- [ ] Testar edição de uma parcela
- [ ] Testar edição desta e das próximas parcelas
- [ ] Testar exclusão de uma parcela
- [ ] Testar exclusão desta e das próximas parcelas
- [ ] Testar relatório/PDF no celular
- [ ] Confirmar novamente sincronização PC ↔ celular

## Teste real encontrado no Supabase

Grupo `SKG`:
- 3/6 — 2026-09
- 4/6 — 2026-10
- 5/6 — 2026-11
- 6/6 — 2026-12

Resultado da auditoria no banco:
- 4 parcelas
- 0 duplicadas
- 0 inconsistentes

## Falha offline encontrada no teste real

Na versão 2.3.0, um lançamento podia ser criado enquanto a página já estava aberta sem internet, mas a aplicação não possuía um Service Worker próprio e o `loader.js` buscava os módulos com `cache: no-store`. Ao fechar e tentar reabrir offline, o aplicativo não tinha todos os arquivos necessários para se reconstruir a partir do navegador.

A versão 2.3.1 adiciona cache offline do shell completo do aplicativo e retomada da sincronização quando a conexão volta.

## Regra

A Sprint 4 não altera a tabela `finance_state` do Meu Financeiro e não modifica o formato dos 73 lançamentos já sincronizados. As correções desta sprint atuam na exibição, cálculo e confiabilidade de sincronização local.

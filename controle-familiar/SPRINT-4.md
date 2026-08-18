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
- [x] Atualizar loader para versão `2.3.0`
- [ ] Publicar a versão 2.3.0
- [ ] Testar edição de uma parcela
- [ ] Testar edição desta e das próximas parcelas
- [ ] Testar exclusão de uma parcela
- [ ] Testar exclusão desta e das próximas parcelas
- [ ] Testar lançamento offline → fechar/reabrir → voltar internet → sincronizar
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

## Regra

A Sprint 4 não altera a tabela `finance_state` do Meu Financeiro e não modifica o formato dos 73 lançamentos já sincronizados. As correções desta sprint atuam na exibição, cálculo e confiabilidade de sincronização local.

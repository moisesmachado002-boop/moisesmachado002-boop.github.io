# Sprint 5 — Cadastros de pessoas e cartões

## Objetivo
Permitir gerenciar os responsáveis e cartões usados na Gestão Financeira Familiar sem apagar o histórico existente.

## Checklist
- [x] Criar painel compacto de Cadastros
- [x] Adicionar pessoa
- [x] Renomear pessoa
- [x] Remover pessoa dos novos lançamentos
- [x] Adicionar cartão
- [x] Renomear cartão
- [x] Remover cartão dos novos lançamentos
- [x] Renomear também os lançamentos históricos após confirmação
- [x] Preservar histórico ao remover cadastro
- [x] Remover do dashboard cadastros sem histórico que foram desativados
- [x] Manter cadastros desativados nos totais quando ainda houver histórico
- [x] Salvar catálogo no navegador
- [x] Manter segunda cópia do catálogo no IndexedDB
- [x] Criar campos de catálogo na `family_finance_state`
- [x] Sincronizar catálogo entre dispositivos usando a mesma conta familiar
- [x] Atualizar cache offline
- [x] Atualizar selo para versão 2.4.0
- [ ] Testar cadastro de uma pessoa no navegador
- [ ] Confirmar pessoa no celular
- [ ] Testar renomear pessoa
- [ ] Testar remover pessoa
- [ ] Testar cadastrar cartão
- [ ] Confirmar cartão no celular
- [ ] Testar renomear cartão
- [ ] Testar remover cartão

## Regra de segurança
Remover um cadastro não exclui lançamentos antigos. O item deixa de aparecer apenas para novos lançamentos. Se houver histórico, ele continua aparecendo nos relatórios e totais correspondentes.

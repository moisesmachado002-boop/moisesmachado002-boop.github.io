# Controle Familiar — Arquitetura interna

Versão de referência: **2.12.0**

Este documento existe para tornar futuras alterações mais previsíveis e reduzir o risco de uma correção em uma área afetar outra.

## Princípios

1. **Preservar dados antes de alterar interface.**
2. **Dinheiro sempre em centavos** nas rotinas de soma e comparação.
3. **Parcelamentos são grupos por `parcelamentoId`** e devem manter sequência 1..N e competências mensais consecutivas.
4. **`competenciaFatura` é a fonte principal da competência.** `mesFatura` permanece por compatibilidade.
5. **Não apagar histórico silenciosamente.**
6. **Sincronização deve confirmar o servidor antes de remover pendências locais.**
7. **Novas extensões devem preferir `familyCore.on/emit` ou funções próprias**, evitando novas cadeias de sobrescrita de funções globais.

## Áreas funcionais

| Área | Responsabilidade principal | Arquivos atuais mais relevantes |
|---|---|---|
| Base de lançamentos | CRUD, normalização e armazenamento local | `app.01` a `app.04` |
| Offline | fila local e IndexedDB | `app.08`, `app.10` |
| Núcleo compartilhado | infraestrutura, registro de módulos, Supabase compartilhado | `app.26` |
| Nuvem | sincronização dos lançamentos e resolução de conflitos | `app.05` |
| Totais | apresentação e somas principais | `app.06` |
| Cadastros | pessoas e cartões | `app.11`, `app.12` |
| Faturas | pagamentos e status | `app.13` |
| Abas e preferências | navegação e competência padrão | `app.14`, `app.15` |
| Filtros | pessoa, cartão e competências | `app.16`, `app.20`, `app.22`, `app.23` |
| Cartões | limite, fechamento e vencimento | `app.17` |
| Apresentação | identidade visual e próximas faturas | `app.18`, `app.19` |
| Backup | exportação/importação completa | `app.21`, `app.24` |
| Integridade | validações e auditoria dos dados | `app.25` |
| Ponte de eventos | ponto estável para futuras extensões | `app.28` |
| Qualidade | autotestes somente de leitura | `app.27` |

## Supabase

A partir da v2.12.0, `app.26` intercepta a criação de clientes Supabase e reutiliza a mesma instância quando URL, chave pública e `auth.storageKey` são iguais. Isso mantém os módulos antigos compatíveis, mas evita múltiplas instâncias independentes para a mesma sessão.

A tabela familiar continua sendo `family_finance_state`.

- `data`: lançamentos e marcador `dataUpdatedAt`.
- `catalog`: cadastros.
- `invoice_payments`: pagamentos das faturas.
- `card_settings`: limites e datas dos cartões.

Cada área deve continuar usando seu próprio marcador temporal interno/específico para não confundir alterações de naturezas diferentes.

## Ponte de eventos

`app.28` fica no fim da cadeia funcional e publica eventos depois das funções principais. O objetivo é que novas funcionalidades possam usar `familyCore.on(...)` em vez de sobrescrever novamente funções globais.

Eventos disponíveis inicialmente:

- `data:saved`
- `ui:table-rendered`
- `catalog:rendered`
- `invoices:rendered`
- `catalog:synced`
- `invoices:synced`
- `cards:synced`

As sobrescritas antigas foram preservadas nesta versão para evitar uma refatoração de alto risco. A partir daqui, novas modificações devem preferir essa ponte.

## Regras para novas modificações

Antes de publicar uma alteração:

1. identificar a área funcional;
2. evitar editar módulos sem relação direta com a mudança;
3. manter compatibilidade com backups antigos;
4. não alterar IDs existentes;
5. executar/verificar `window.__familySelfTestRun()` e `window.__familyIntegrityRun(false)`;
6. confirmar que a quantidade de lançamentos e IDs únicos na nuvem não mudou sem intenção;
7. atualizar a versão no `loader.js`, `index.html` e `sw.js` quando houver publicação funcional.

## Autotestes

`app.27` executa testes somente de leitura após a inicialização e expõe:

```js
window.__familySelfTestRun()
window.__familySelfTestLastReport
```

Os testes cobrem atualmente:

- versão carregada;
- núcleo compartilhado;
- IDs únicos;
- valores com no máximo duas casas decimais;
- coerência entre mês e competência;
- sequência de parcelamentos;
- auditoria de integridade;
- estrutura do backup completo;
- conversão monetária em centavos;
- chave de pagamento de fatura;
- fábrica compartilhada do Supabase quando disponível.

Esses testes não criam, editam nem excluem lançamentos.

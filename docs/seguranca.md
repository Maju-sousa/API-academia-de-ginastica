# Segurança — requisitos OWASP ASVS 5.0.0 atendidos

> Rascunho inicial. Conferir a numeração exata no documento oficial do ASVS 5.0.0
> (https://github.com/OWASP/ASVS) antes da entrega final.

| Capítulo ASVS 5.0 | Requisito (resumo) | Como foi atendido | Onde |
| --- | --- | --- | --- |
| V1 / V2 — Validação e sanitização | Entrada validada por schema (allow-list) no servidor | Zod em todas as rotas; campos desconhecidos são descartados; sanitização remove chaves perigosas e caracteres de controle | `middlewares/validate.js`, `middlewares/sanitize.js` |
| V1 — Injeção | Uso de queries parametrizadas | Todo acesso ao banco via Prisma (parametrizado); nenhum SQL concatenado | `lib/prisma.js`, services |
| V6 — Autenticação / senhas | Senha mínima de 8 caracteres, aceitar ≥ 64, sem regras de composição | Política em `auth.schemas.js` (8–128 caracteres) | `modules/auth/auth.schemas.js` |
| V6 / V11 — Armazenamento de senhas | Senhas com hash lento e salt | bcrypt com custo 12 (configurável) | `modules/auth/auth.service.js` |
| V6 — Anti-automação | Proteção contra força bruta | Rate limit específico em login/cadastro (10 req / 15 min por IP) | `middlewares/rateLimit.js` |
| V6 — Enumeração de usuários | Mesma resposta para e-mail inexistente e senha errada | Mensagem genérica "Credenciais inválidas" + comparação com hash fictício | `auth.service.js` |
| V8 — Autorização | Controle de acesso por função no servidor | Middleware `authorize(...roles)`; cadastro público só cria `MEMBER` | `middlewares/authorize.js` |
| V9 — Tokens autocontidos | Algoritmo fixo, validação de `exp`, `iss`, `aud` | `jwt.verify` com `algorithms: ['HS256']`, issuer e audience; segredo ≥ 32 chars validado na inicialização | `middlewares/authenticate.js`, `config/env.js` |
| V13 — Configuração | Segredos fora do código; sem cabeçalhos que revelem tecnologia | Variáveis de ambiente; `x-powered-by` desabilitado; `server_tokens off` no Nginx; container sem root | `app.js`, `nginx.conf`, `Dockerfile` |
| V16 — Erros e logs | Sem stack trace para o cliente; log de eventos de segurança sem dados sensíveis | `errorHandler` devolve 500 genérico; falhas de login e 401/403 logadas; `redact` de senha/token | `middlewares/errorHandler.js`, `lib/logger.js` |
| V3 / V4 — Cabeçalhos HTTP | `X-Content-Type-Options`, HSTS etc. | Helmet | `app.js` |

## Pendências / melhorias
- Rate limit usa memória local de cada réplica; com várias réplicas o ideal é usar o Redis como store.
- Refresh token e revogação de token (logout) ainda não implementados.
- Autorização em nível de objeto (membro só acessa os próprios dados) deve ser feita nos módulos de membros, treinos e check-ins.

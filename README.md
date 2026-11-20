# Starlife API

API RESTful para gestão de academia de ginástica — Trabalho Final de **Programação para a Web II** (UFPI / CSHNB).

> Status: **infraestrutura base pronta** (pipeline de middlewares, autenticação JWT com papéis, banco com migrações, cache, load balancing e CI). Os módulos de **membros**, **treinos** e **check-ins** serão implementados a seguir pela equipe.

## Stack

| Camada | Tecnologia | Por quê |
| --- | --- | --- |
| Runtime / framework | Node.js 22 + Express 5 | Ecossistema conhecido pela equipe; Express 5 trata erros de handlers `async` nativamente |
| Banco | PostgreSQL 17 | Relacional, dados com relacionamentos claros (usuário → membro → treinos/check-ins) |
| ORM / migrações | Prisma 6 | Queries parametrizadas (proteção contra SQL injection) + migrações versionadas |
| Cache | Redis 7 | Cache compartilhado entre as réplicas da API |
| Validação | Zod 4 | Schemas declarativos de entrada |
| Auth | JWT (HS256) + bcrypt | Stateless — funciona com várias réplicas sem sessão compartilhada |
| Logs | Pino | Logs estruturados em JSON com mascaramento de dados sensíveis |
| Load balancer | Nginx | Reverse proxy round-robin entre 3 réplicas |
| CI | GitHub Actions | Lint + testes + build da imagem Docker a cada push/PR |

## Arquitetura

```
             ┌──────────────┐
 cliente ──▶ │ Nginx :8080  │  (load balancer, round-robin)
             └──────┬───────┘
        ┌───────────┼───────────┐
        ▼           ▼           ▼
   ┌────────┐  ┌────────┐  ┌────────┐
   │ api #1 │  │ api #2 │  │ api #3 │   Node.js + Express (stateless)
   └───┬────┘  └───┬────┘  └───┬────┘
       └─────┬─────┴─────┬─────┘
             ▼           ▼
       ┌──────────┐ ┌─────────┐
       │ Postgres │ │  Redis  │
       └──────────┘ └─────────┘
```

Estrutura de pastas:

```
src/
  app.js               # monta o pipeline de middlewares
  server.js            # sobe o servidor + encerramento gracioso
  routes.js            # agrega as rotas /api/v1
  config/env.js        # validação das variáveis de ambiente (fail fast)
  errors/AppError.js   # erro padronizado da aplicação
  lib/                 # prisma, redis (cache), logger
  middlewares/         # requestId, logger, sanitize, auth, validate, errors...
  modules/
    auth/              # register, login, me  (módulo de referência)
    health/            # /health
prisma/
  schema.prisma        # modelos User, Member, Workout, CheckIn
  migrations/          # migrações versionadas
  seed.js              # usuários iniciais (admin, trainer, member)
nginx/nginx.conf       # load balancer
docs/                  # documentação técnica (middlewares, segurança)
```

## Como executar

### Opção 1 — Docker Compose (recomendado, sobe tudo com load balancing)

Pré-requisito: Docker Desktop.

```powershell
Copy-Item .env.example .env
```

Edite o `.env` e troque o `JWT_SECRET` (gere um com o comando abaixo):

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

```powershell
docker compose up -d --build
```

A API fica disponível em **http://localhost:8080**. O serviço `migrate` aplica as migrações e o seed antes das réplicas subirem.

Para ver o load balancing funcionando (o campo `instance` muda a cada requisição):

```powershell
1..6 | ForEach-Object { (Invoke-RestMethod http://localhost:8080/health).instance }
```

Escalar réplicas: `docker compose up -d --scale api=5`

### Opção 2 — API local + banco no Docker (desenvolvimento)

```powershell
Copy-Item .env.example .env
```

```powershell
docker compose up -d postgres redis
```

```powershell
npm install
```

```powershell
npm run db:deploy
```

```powershell
npm run db:seed
```

```powershell
npm run dev
```

A API fica em **http://localhost:3000** (com hot reload).

### Usuários do seed (apenas desenvolvimento)

| Papel | E-mail | Senha |
| --- | --- | --- |
| ADMIN | admin@starlife.dev | starlife-admin-123 |
| TRAINER | trainer@starlife.dev | starlife-trainer-123 |
| MEMBER | member@starlife.dev | starlife-member-123 |

## Endpoints disponíveis

| Método | Rota | Acesso | Descrição |
| --- | --- | --- | --- |
| GET | `/health` | público | Status da API, banco e Redis + instância que respondeu |
| POST | `/api/v1/auth/register` | público | Cadastro (sempre cria um `MEMBER`) |
| POST | `/api/v1/auth/login` | público | Retorna `accessToken` (JWT) |
| GET | `/api/v1/auth/me` | autenticado | Dados do usuário logado |

Exemplo:

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@starlife.dev","password":"starlife-admin-123"}'
```

### Formato das respostas

Sucesso: `{ "data": ... }`

Erro (sempre o mesmo formato, sem stack trace):

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Dados de entrada inválidos",
    "details": [{ "location": "body", "field": "email", "message": "E-mail inválido" }],
    "requestId": "5b1f..."
  }
}
```

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | API com hot reload |
| `npm test` | Testes (Vitest + Supertest) |
| `npm run lint` | ESLint |
| `npm run db:migrate -- --name <nome>` | Cria uma nova migração a partir do `schema.prisma` |
| `npm run db:deploy` | Aplica as migrações pendentes |
| `npm run db:seed` | Cria os usuários iniciais |
| `npm run db:studio` | Interface visual do banco |

## Como adicionar um novo módulo (guia da equipe)

1. Crie `src/modules/<recurso>/` com `routes`, `controller`, `service` e `schemas` (use `auth/` como modelo).
2. Nas rotas, encadeie: `authenticate` → `authorize('ADMIN', ...)` → `validate({ body, params, query })` → controller.
3. No service, lance `AppError.notFound()`, `AppError.forbidden()` etc. — o `errorHandler` formata a resposta.
4. Para cache, use `cache.remember(chave, loader, ttl)` e invalide com `cache.forgetPrefix('recurso:')` ao criar/editar/remover.
5. Registre as rotas em `src/routes.js`.
6. Mudou o banco? Edite `prisma/schema.prisma` e rode `npm run db:migrate -- --name <descricao>`.

## Documentação

- [Pipeline de middlewares](docs/middlewares.md)
- [Segurança (OWASP ASVS)](docs/seguranca.md)
- [Changelog](CHANGELOG.md)

## Equipe

- Alysson
- Julia
- _(demais membros)_

# Changelog

Todas as mudanças relevantes do projeto **Starlife** são registradas aqui.
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

## [0.1.0] — 2026-11-19 · Parcial 1

### Adicionado
- Estrutura inicial do projeto em Node.js 22 + Express 5 (ESM).
- Validação das variáveis de ambiente na inicialização (`src/config/env.js`).
- **Pipeline de middlewares**: request ID, logging (Pino), Helmet, CORS, rate limit,
  sanitização, autenticação (JWT), autorização por papel, validação (Zod),
  404 e tratamento de erros padronizado.
- **Persistência**: PostgreSQL + Prisma com migração inicial
  (`users`, `members`, `workouts`, `check_ins`) e seed com um usuário de cada papel.
- **Autenticação**: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
  com papéis `ADMIN`, `TRAINER` e `MEMBER`.
- **Cache**: camada Redis (`src/lib/cache.js`) com TTL e invalidação explícita
  por chave ou prefixo, com fallback quando o Redis está indisponível.
- **Load balancing**: Docker Compose com 3 réplicas da API atrás do Nginx (round-robin);
  header `X-Instance` e `/health` mostram qual réplica respondeu.
- **Deploy/CI**: Dockerfile (usuário não-root, healthcheck) e GitHub Actions
  (lint, testes e build da imagem).
- Testes automatizados do pipeline (Vitest + Supertest).
- Documentação: README, pipeline de middlewares e requisitos ASVS.

### Próximos passos
- Módulos de membros, treinos e check-ins.
- Cache aplicado na listagem de treinos.
- Relatório final.

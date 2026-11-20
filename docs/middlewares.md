# Pipeline de middlewares

A ordem é definida em [`src/app.js`](../src/app.js) (globais) e nos arquivos `*.routes.js` (por rota).

| # | Middleware | Arquivo | Escopo | Responsabilidade |
| --- | --- | --- | --- | --- |
| 1 | `requestId` | `middlewares/requestId.js` | global | Gera (ou reaproveita do Nginx) um `X-Request-Id` para correlacionar logs e respostas de erro |
| 2 | `requestLogger` | `middlewares/requestLogger.js` | global | Log estruturado de método, URL, status e tempo de resposta; mascara `Authorization`/cookies |
| – | `helmet` / `cors` | `app.js` | global | Cabeçalhos de segurança (`nosniff`, `HSTS`, CSP...) e política de origem |
| 3 | `globalLimiter` | `middlewares/rateLimit.js` | global | Limita requisições por IP (300/min) |
| – | `express.json` | `app.js` | global | Parse do JSON com limite de 100 kb (JSON inválido → 400) |
| 4 | `sanitize` | `middlewares/sanitize.js` | global | Remove `__proto__`/`constructor`/chaves `$`, caracteres de controle e faz trim |
| 5 | `authenticate` | `middlewares/authenticate.js` | por rota | Valida o JWT (assinatura, `exp`, `iss`, `aud`, algoritmo HS256) e define `req.user` |
| 6 | `authorize(...roles)` | `middlewares/authorize.js` | por rota | Bloqueia (403) papéis sem permissão |
| 7 | `validate({ body, params, query })` | `middlewares/validate.js` | por rota | Valida com Zod; erros → 400 com lista de campos |
| – | controller → service | `modules/*` | — | Regra de negócio e acesso ao banco |
| 8 | `notFound` | `middlewares/notFound.js` | global | Rota inexistente → 404 padronizado |
| 9 | `errorHandler` | `middlewares/errorHandler.js` | global (último) | Converte qualquer erro na resposta padrão; erros inesperados → 500 genérico, detalhes só no log |

## Por que essa ordem?

- **Request ID e logging primeiro**: toda requisição — inclusive as rejeitadas mais adiante — fica registrada e rastreável.
- **Rate limit antes do parse do corpo**: requisições abusivas são cortadas antes de gastar CPU com JSON/validação.
- **Sanitização antes da validação**: o Zod valida dados já limpos (ex.: `"  ana@x.com "` vira `"ana@x.com"`).
- **Autenticação antes da validação**: quem não tem token recebe 401 sem descobrir detalhes do formato esperado pela rota.
- **Tratamento de erros por último**: o Express só chama middlewares de 4 argumentos quando há erro, então ele precisa estar no final para capturar erros de todas as camadas anteriores.

## Exemplo de rota

```js
router.post(
  '/',
  authenticate,                     // 5
  authorize('ADMIN', 'TRAINER'),    // 6
  validate({ body: createWorkoutSchema }), // 7
  controller.create,
);
```

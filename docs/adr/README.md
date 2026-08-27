# Architecture Decision Records

Decisions that shaped this repo, one file each — context, the call, and what
it costs. Newest last.

| #                                             | Decision                                            |
| --------------------------------------------- | --------------------------------------------------- |
| [0001](0001-python-outside-pnpm-workspace.md) | Python lives outside the pnpm workspace             |
| [0002](0002-separate-nextjs-ai-app.md)        | AI is its own Next.js app                           |
| [0003](0003-repository-seam.md)               | Persistence behind a repository protocol            |
| [0004](0004-postgres-row-level-security.md)   | Postgres RLS enforces per-user isolation            |
| [0005](0005-header-routed-alb.md)             | One ALB, x-service header routing behind CloudFront |
| [0006](0006-http-origin-behind-cloudfront.md) | Plaintext HTTP between CloudFront and the ALB       |

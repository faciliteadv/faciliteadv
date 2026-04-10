## Setup local

1. Instale as dependências:

```bash
npm ci
```

2. Crie um arquivo `.env.local` com base no `.env.example`.

Variáveis obrigatórias:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
DATABASE_URL=
DIRECT_URL=
```

3. Rode o projeto:

```bash
npm run dev
```

4. Abra:

```txt
http://localhost:3000/processes
```

## Onde encontrar as chaves

- `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`: painel do Supabase > Project Settings > API
- `DATABASE_URL` e `DIRECT_URL`: painel do Supabase > Connect

Use de preferência a string pronta do Supabase para Prisma/session pooler.

## Observações

- Sem as variáveis do Supabase, as rotas protegidas como `/processes` não abrem.
- O aviso sobre `middleware` estar depreciado no Next.js não é o erro que está bloqueando o teste local.

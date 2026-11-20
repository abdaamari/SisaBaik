# Prisma + Supabase

Prisma 7 reads `.env.local` through `@next/env`. CLI commands prefer
`DIRECT_URL`, falling back to `DATABASE_URL`.

- `DATABASE_URL`: application connection string.
- `DIRECT_URL`: session-pooler connection string from Supabase (port 5432).
  Set this locally for introspection; do not commit credentials.

Commands:

```sh
npm run db:pull
npm run db:validate
npm run db:generate
```

The schema is introspected from the existing database. The `auth` schema is
included because public tables reference `auth.users`. It is managed by
Supabase, not by Prisma migrations.

Continue applying application SQL migrations manually through Supabase.
Do not use this introspected schema as a replacement for SQL migrations:
RLS, triggers, functions, and some constraints are not fully represented.

Prisma Client powers `/api/admin/stats`, after Supabase session and admin-role
verification. Other application queries still use Supabase clients and their user sessions.
Direct database credentials do not automatically carry Supabase user JWT/RLS context.

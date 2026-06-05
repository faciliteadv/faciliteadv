# 🚀 Setup Local - Guia Completo

## Pré-requisitos
- Node.js v18+ instalado
- npm ou yarn
- Acesso ao projeto Supabase

## Passo 1: Instalar Dependências

```bash
npm ci
```

ou se preferir yarn:

```bash
yarn install
```

## Passo 2: Configurar Variáveis de Ambiente

1. **Copie o arquivo de exemplo:**
```bash
cp .env.example .env.local
```

2. **Edite `.env.local` com suas credenciais do Supabase:**

### Obter as credenciais:

**NEXT_PUBLIC_SUPABASE_URL** e **NEXT_PUBLIC_SUPABASE_ANON_KEY**:
- Acesse o painel do Supabase
- Vá para **Project Settings → API**
- Copie o valor da URL do projeto
- Copie a chave ANON (anon, public)

**DATABASE_URL** e **DIRECT_URL**:
- No painel do Supabase, vá para **Connect**
- Selecione **Prisma** como ferramenta
- Copie a string de conexão com "session pooler"

### Exemplo preenchido:
```env
NEXT_PUBLIC_SUPABASE_URL=https://abc123def456.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres.abc123:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres.abc123:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

## Passo 3: Gerar Prisma Client

```bash
npx prisma generate
```

## Passo 4: Verificar Migrations (Opcional)

Se precisar ver o status das migrações:

```bash
npx prisma migrate status
```

Para aplicar migrações pendentes:

```bash
npx prisma migrate deploy
```

## Passo 5: Rodar o Projeto Local

```bash
npm run dev
```

A aplicação estará disponível em: **http://localhost:3000**

## Verificar o Setup

Após iniciar o projeto, você pode:

1. **Acessar a página de login:**
   - http://localhost:3000/login

2. **Acessar dashboard (requer autenticação):**
   - http://localhost:3000/dashboard

3. **Acessar processos:**
   - http://localhost:3000/processes

## Scripts Disponíveis

```bash
npm run dev      # Inicia servidor de desenvolvimento (hot reload)
npm run build    # Build para produção
npm start        # Roda a build de produção
npm run lint     # Executa linting
npm run test     # Roda testes
```

## Troubleshooting

### ❌ Erro: "Sem variáveis do Supabase"
**Solução:** Verifique se `.env.local` está preenchido corretamente com as credenciais do Supabase.

### ❌ Erro: "DATABASE_URL não definida"
**Solução:** Copie a string de conexão correta do Supabase, incluindo as variáveis `DATABASE_URL` e `DIRECT_URL`.

### ❌ Erro: "Cannot find module @prisma/client"
**Solução:** Execute `npx prisma generate` novamente.

### ❌ Erro: "Conexão recusada no banco de dados"
**Solução:** 
- Verifique se a URL do banco está correta
- Confirme que o Supabase está ativo
- Teste a conexão usando a string do Supabase

## Próximos Passos

Após validar tudo localmente:

1. ✅ Testar funcionalidades principais
2. ✅ Verificar autenticação
3. ✅ Validar conexão com banco de dados
4. ✅ Fazer testes de integração

Depois, fazer o push para produção! 🚀

# 🔐 Implementação de Google OAuth - Guia Completo

## 📋 Resumo da Estratégia

- ✅ **Novos usuários**: Acessam via Google OAuth (sem envio de emails)
- ✅ **Usuários existentes**: Continuam com email/senha (sem alterações)
- ✅ **Cadastro**: DESABILITADO (apenas login)
- ✅ **Dados**: Nenhum usuário será perdido

---

## 🟦 PASSO 1: Configurar Google OAuth no Google Cloud Console

### 1.1 Acesse o Google Cloud Console
1. Vá para: https://console.cloud.google.com
2. Faça login com sua conta Google

### 1.2 Crie um novo projeto
1. Clique no seletor de projeto (topo esquerdo, ao lado de "Google Cloud")
2. Clique em **"NEW PROJECT"**
3. Nome: `FaciliteADV` (ou seu projeto)
4. Clique em **CREATE**
5. Aguarde alguns segundos

### 1.3 Ative a API do Google+
1. No menu esquerdo, vá para **APIs & Services** → **Library**
2. Procure por: `Google+ API`
3. Clique em **Google+ API**
4. Clique em **ENABLE**

### 1.4 Configure a tela de consentimento OAuth
1. No menu esquerdo, vá para **APIs & Services** → **OAuth consent screen**
2. Selecione **External** como tipo de usuário
3. Clique em **CREATE**
4. Preencha o formulário:
   - **App name**: `FaciliteADV`
   - **User support email**: seu email
   - **Developer contact**: seu email
5. Clique em **SAVE AND CONTINUE**
6. Em "Scopes", clique em **ADD OR REMOVE SCOPES**
7. Procure e selecione:
   - `email`
   - `profile`
8. Clique em **UPDATE**
9. Clique em **SAVE AND CONTINUE**
10. Clique em **SAVE AND CONTINUE** (novamente, sem adicionar usuários de teste)

### 1.5 Crie credenciais OAuth (Client ID)
1. No menu esquerdo, vá para **APIs & Services** → **Credentials**
2. Clique em **+ CREATE CREDENTIALS** (topo)
3. Selecione **OAuth client ID**
4. Selecione tipo: **Web application**
5. Nome: `FaciliteADV Web`
6. Em "Authorized JavaScript origins", clique em **+ ADD URI** e adicione:
   - `http://localhost:3000` (desenvolvimento)
   - `https://seu-dominio.com` (produção)
   - `https://supabase-project-ref.supabase.co` (seu projeto Supabase)
7. Em "Authorized redirect URIs", clique em **+ ADD URI** e adicione:
   - `http://localhost:3000/auth/callback` (desenvolvimento)
   - `https://seu-dominio.com/auth/callback` (produção)
   - `https://supabase-project-ref.supabase.co/auth/v1/callback` (Supabase)

**Obs:** Você encontra seu Supabase project ref em: Project Settings → API → Project URL (pegue a parte antes de `.supabase.co`)

8. Clique em **CREATE**
9. **COPIE e GUARDE em local seguro:**
   - **Client ID**
   - **Client Secret**

---

## 🟢 PASSO 2: Configurar Google OAuth no Supabase

### 2.1 Acesse o dashboard do Supabase
1. Vá para: https://app.supabase.com
2. Selecione seu projeto FaciliteADV

### 2.2 Configure o provider Google
1. No menu esquerdo, vá para **Authentication** → **Providers**
2. Procure por **Google**
3. Clique em **Google** para expandir
4. Ative o toggle: **Enable Sign in with Google**
5. Cole as credenciais do Google:
   - **Client ID**: [Cole o Client ID do passo 1.5]
   - **Client Secret**: [Cole o Client Secret do passo 1.5]
6. Clique em **Save**

### 2.3 Configure URLs de redirect (Supabase)
1. Em **Authentication** → **URL Configuration**
2. Em "Redirect URLs", verifique que estão configuradas:
   - `http://localhost:3000/auth/callback` (desenvolvimento)
   - `https://seu-dominio.com/auth/callback` (produção)

Se não estiverem, adicione manualmente clicando em **+ Add URL**.

---

## 💾 PASSO 3: Configurar Variáveis de Ambiente

Não há novas variáveis de ambiente necessárias! O Supabase já gerencia as credenciais do Google.

Seu `.env.local` continua igual:
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
DATABASE_URL=...
DIRECT_URL=...
```

---

## 🔧 PASSO 4: Implementar no Código

### 4.1 Arquivos que serão modificados:
1. `components/auth/auth-form.tsx` - Adicionar botão Google
2. `app/(public)/login/actions.ts` - Adicionar função de login Google
3. `app/(public)/login/page.tsx` - (verificar se precisa ajuste)

### 4.2 O que mudará:
- ✅ Adicionar botão "Sign in with Google"
- ✅ Remover opção de "Sign up" (criar conta)
- ✅ Manter "Sign in" com email/password
- ✅ Adicionar tratamento de callback do OAuth

---

## 🔄 PASSO 5: Fluxo de Autenticação (Resumo)

### Novo usuário clica em "Google":
```
Usuário → Clica "Sign in with Google"
  ↓
Google OAuth redirect para Supabase
  ↓
Supabase cria novo usuário em auth.users
  ↓
Supabase redireciona para /auth/callback
  ↓
App detecta usuário e cria registro em DB (Prisma)
  ↓
Redireciona para /dashboard
```

### Usuário existente (email/password):
```
Usuário → Email + Senha → Sign in
  ↓
Supabase valida com signInWithPassword
  ↓
Redireciona para /dashboard
```

---

## ✅ Por que usuários NÃO serão perdidos?

1. **Usuários com email/senha** continuam no `auth.users` do Supabase
2. **Novos usuários via Google** também vão para `auth.users` (com provider=google)
3. **Registros Prisma** continuam intactos para usuários antigos
4. **Nova tabela de ligação** (se necessário) pode conectar Google com emails antigos

**Exemplo prático:**
- João criou conta com email+senha em janeiro
- Em junho, ativa Google OAuth
- João faz login com email+senha → continua funcionando (acesso normal)
- Maria (novo usuário) faz login com Google → novo usuário criado (sem email de confirmação)

---

## ⚠️ Considerações Importantes

### Email já existe?
Se um usuário tenta fazer login via Google com o mesmo email de uma conta existente:
- **Supabase combina automaticamente** as contas (mesma identidade)
- O usuário pode usar ambos os métodos para acessar

### Limite de emails resolvido?
- ✅ **Novo signup via Google**: 0 emails enviados
- ✅ **Confirmação de email**: Não é necessária
- ✅ **Recovery**: Continua funcionando para usuários com email/senha

### Session e Cookies
- O Supabase SSR continua funcionando normalmente
- Tanto email/password quanto OAuth usam o mesmo sistema de sessão

---

## 🚀 Próximas Etapas

1. Completar os passos 1-2 acima (Google Console + Supabase)
2. Rodar as mudanças no código (passo 4)
3. Testar localmente:
   ```bash
   npm run dev
   ```
4. Ir para http://localhost:3000/login
5. Clicar em "Sign in with Google"
6. Autorizar acesso
7. Verificar se funciona

---

## 📞 Troubleshooting

### ❌ "Erro 400: redirect_uri_mismatch"
- Verifique se a URL de callback está exatamente igual no Google Console e Supabase
- Deve ser: `http://localhost:3000/auth/callback` ou `https://seu-dominio.com/auth/callback`

### ❌ "Invalid Client ID"
- Copie novamente o Client ID do Google Console (pode ter espaços)
- Salve no Supabase > Authentication > Providers > Google

### ❌ "Erro de CORS"
- Verifique se os "Authorized JavaScript origins" no Google Console incluem seu domínio

### ❌ "Usuário não é criado no Prisma"
- Verifique se a função de callback está sendo chamada
- Logs estarão em: Supabase > Logs > Auth

---

## 📚 Referências

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Google Auth](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Next.js Authentication](https://nextjs.org/docs/app/building-your-application/authentication-and-authorization)

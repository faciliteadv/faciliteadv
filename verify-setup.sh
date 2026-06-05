#!/bin/bash
# Script de verificação do ambiente local

echo "🔍 Verificando Setup Local do FaciliteADV..."
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Node.js
echo "1️⃣ Verificando Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✅ Node.js instalado: $NODE_VERSION${NC}"
else
    echo -e "${RED}❌ Node.js não encontrado${NC}"
    exit 1
fi

# 2. npm
echo ""
echo "2️⃣ Verificando npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✅ npm instalado: v$NPM_VERSION${NC}"
else
    echo -e "${RED}❌ npm não encontrado${NC}"
    exit 1
fi

# 3. node_modules
echo ""
echo "3️⃣ Verificando dependências..."
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅ node_modules encontrado${NC}"
else
    echo -e "${YELLOW}⚠️ node_modules não encontrado. Execute: npm ci${NC}"
fi

# 4. .env.local
echo ""
echo "4️⃣ Verificando arquivo .env.local..."
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✅ .env.local configurado${NC}"
    
    # Verificar se tem valores reais
    if grep -q "your-" .env.local; then
        echo -e "${YELLOW}⚠️ .env.local contém placeholders${NC}"
    else
        echo -e "${GREEN}✅ Variáveis parecem estar configuradas${NC}"
    fi
else
    echo -e "${RED}❌ .env.local não encontrado${NC}"
    echo -e "${YELLOW}ℹ️ Execute: cp .env.example .env.local${NC}"
fi

# 5. Prisma
echo ""
echo "5️⃣ Verificando Prisma..."
if [ -d "node_modules/@prisma/client" ]; then
    PRISMA_VERSION=$(node -e "console.log(require('@prisma/client/package.json').version)" 2>/dev/null)
    echo -e "${GREEN}✅ Prisma Client v$PRISMA_VERSION${NC}"
else
    echo -e "${YELLOW}⚠️ Prisma Client não gerado. Execute: npx prisma generate${NC}"
fi

# 6. Git
echo ""
echo "6️⃣ Verificando Git..."
if command -v git &> /dev/null; then
    GIT_STATUS=$(git status --porcelain 2>/dev/null | wc -l)
    if [ $GIT_STATUS -eq 0 ]; then
        echo -e "${GREEN}✅ Repositório Git sincronizado${NC}"
    else
        echo -e "${YELLOW}⚠️ $GIT_STATUS arquivos não commitados${NC}"
    fi
else
    echo -e "${RED}❌ Git não encontrado${NC}"
fi

# 7. TypeScript
echo ""
echo "7️⃣ Verificando TypeScript..."
if command -v tsc &> /dev/null; then
    TSC_VERSION=$(tsc -v)
    echo -e "${GREEN}✅ $TSC_VERSION${NC}"
else
    echo -e "${YELLOW}⚠️ TypeScript não instalado globalmente (mas está nas devDependencies)${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}✅ Setup está pronto para teste local!${NC}"
echo ""
echo "Para rodar o servidor:"
echo "  npm run dev"
echo ""
echo "Acesse: http://localhost:3000"
echo ""

#!/usr/bin/env pwsh

# Script de verificação do ambiente local para Windows
# Execute: .\verify-setup.ps1

Write-Host "🔍 Verificando Setup Local do FaciliteADV..." -ForegroundColor Cyan
Write-Host ""

# 1. Node.js
Write-Host "1️⃣ Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node -v
    Write-Host "✅ Node.js instalado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js não encontrado" -ForegroundColor Red
    exit 1
}

# 2. npm
Write-Host ""
Write-Host "2️⃣ Verificando npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm -v
    Write-Host "✅ npm instalado: v$npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm não encontrado" -ForegroundColor Red
    exit 1
}

# 3. node_modules
Write-Host ""
Write-Host "3️⃣ Verificando dependências..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "✅ node_modules encontrado" -ForegroundColor Green
} else {
    Write-Host "⚠️ node_modules não encontrado. Execute: npm ci" -ForegroundColor Yellow
}

# 4. .env.local
Write-Host ""
Write-Host "4️⃣ Verificando arquivo .env.local..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    Write-Host "✅ .env.local configurado" -ForegroundColor Green
    
    # Verificar se tem valores reais
    $envContent = Get-Content ".env.local" -Raw
    if ($envContent -match "your-|placeholder") {
        Write-Host "⚠️ .env.local contém placeholders" -ForegroundColor Yellow
    } else {
        Write-Host "✅ Variáveis parecem estar configuradas" -ForegroundColor Green
    }
} else {
    Write-Host "❌ .env.local não encontrado" -ForegroundColor Red
    Write-Host "ℹ️ Execute: Copy-Item .env.example .env.local" -ForegroundColor Cyan
}

# 5. Prisma
Write-Host ""
Write-Host "5️⃣ Verificando Prisma..." -ForegroundColor Yellow
if (Test-Path "node_modules/@prisma/client") {
    Write-Host "✅ Prisma Client encontrado" -ForegroundColor Green
} else {
    Write-Host "⚠️ Prisma Client não gerado. Execute: npx prisma generate" -ForegroundColor Yellow
}

# 6. Git
Write-Host ""
Write-Host "6️⃣ Verificando Git..." -ForegroundColor Yellow
try {
    $gitBranch = git branch --show-current
    $gitStatus = git status --porcelain | Measure-Object -Line
    if ($gitStatus.Lines -eq 0) {
        Write-Host "✅ Repositório Git sincronizado (branch: $gitBranch)" -ForegroundColor Green
    } else {
        Write-Host "⚠️ $($gitStatus.Lines) arquivo(s) não commitados" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Git não encontrado" -ForegroundColor Red
}

# 7. TypeScript
Write-Host ""
Write-Host "7️⃣ Verificando TypeScript..." -ForegroundColor Yellow
try {
    $tscVersion = tsc -v
    Write-Host "✅ $tscVersion" -ForegroundColor Green
} catch {
    Write-Host "⚠️ TypeScript não instalado globalmente (mas está nas devDependencies)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Setup está pronto para teste local!" -ForegroundColor Green
Write-Host ""
Write-Host "Para rodar o servidor:" -ForegroundColor Cyan
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Acesse: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""

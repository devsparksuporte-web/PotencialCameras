# Guia de Deploy - CamMonitor Pro

## 🎯 Opções de Deploy

### 1. Cloudflare Workers (Recomendado)

#### Vantagens
- Execução global em edge locations
- Auto-scaling
- Banco D1 integrado
- SSL automático
- CDN integrado

#### Passos Detalhados

1. **Instale o Wrangler**
```bash
npm install -g wrangler
wrangler login
```

2. **Configure o Banco D1**
```bash
# Crie o banco
wrangler d1 create cammonitor-database

# Configure no wrangler.jsonc
{
  "database": [
    {
      "binding": "DB",
      "database_name": "cammonitor-database",
      "database_id": "SEU_DATABASE_ID"
    }
  ]
}
```

3. **Execute Migrações**
```bash
# Migração local para desenvolvimento
wrangler d1 execute cammonitor-database --local --command "CREATE TABLE cameras (...)"

# Migração para produção
wrangler d1 execute cammonitor-database --command "CREATE TABLE cameras (...)"
```

4. **Deploy**
```bash
npm run build
wrangler publish
```

### 2. Vercel

#### Configuração
```json
// vercel.json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "functions": {
    "src/worker/index.ts": {
      "runtime": "nodejs18.x"
    }
  }
}
```

#### Deploy
```bash
npm install -g vercel
vercel --prod
```

### 3. Netlify

#### Configuração
```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/:splat"
  status = 200
```

### 4. VPS/Servidor Próprio

#### Usando PM2
```bash
# Instale PM2
npm install -g pm2

# Configure ecosystem
# ecosystem.config.js
module.exports = {
  apps: [{
    name: 'cammonitor-pro',
    script: 'npm',
    args: 'start',
    cwd: '/path/to/app',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};

# Deploy
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### Usando Docker
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copie arquivos de dependências
COPY package*.json ./
RUN npm ci --only=production

# Copie código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Exposição da porta
EXPOSE 3000

# Comando de inicialização
CMD ["npm", "start"]
```

```bash
# Build e execução
docker build -t cammonitor-pro .
docker run -d -p 3000:3000 --name cammonitor cammonitor-pro
```

### 5. Railway

```bash
# Instale CLI
npm install -g @railway/cli

# Login e deploy
railway login
railway new
railway up
```

## 🔧 Configurações Específicas por Ambiente

### Variáveis de Ambiente

#### Desenvolvimento (.env.local)
```bash
NODE_ENV=development
VITE_API_URL=http://localhost:5173
```

#### Produção
```bash
NODE_ENV=production
DATABASE_URL=your_database_url
API_SECRET_KEY=your_secret_key
```

### Configuração de Banco

#### SQLite Local
```javascript
// Para desenvolvimento local
const db = new Database('./database.sqlite');
```

#### PostgreSQL (Produção)
```javascript
// Para ambientes de produção
import { Pool } from 'pg';
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
```

## 🔐 Configurações de Segurança

### Headers de Segurança
```javascript
// Adicione ao worker/index.ts
app.use('*', async (c, next) => {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '1; mode=block');
});
```

### CORS
```javascript
import { cors } from 'hono/cors';

app.use('/api/*', cors({
  origin: ['https://yourdomain.com'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
```

## 📊 Monitoramento

### Logs de Aplicação
```javascript
// Adicione logging
app.use('*', async (c, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`${c.req.method} ${c.req.url} - ${ms}ms`);
});
```

### Health Check
```javascript
app.get('/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});
```

## 🚨 Checklist Pré-Deploy

- [ ] Build sem erros (`npm run build`)
- [ ] Testes passando (`npm test`)
- [ ] Migrações do banco executadas
- [ ] Variáveis de ambiente configuradas
- [ ] Secrets configurados
- [ ] Health check funcionando
- [ ] CORS configurado
- [ ] Headers de segurança adicionados
- [ ] Logs configurados
- [ ] Backup do banco de dados

## 🔄 CI/CD com GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        
      - name: Deploy to Cloudflare
        run: npx wrangler publish
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

## 📞 Suporte Pós-Deploy

### Comandos Úteis
```bash
# Verificar status
curl https://your-domain.com/health

# Ver logs em tempo real
wrangler tail

# Rollback (Cloudflare)
wrangler rollback [deployment-id]
```

### Monitoramento
- Configure alertas para downtime
- Monitore uso de recursos
- Acompanhe logs de erro
- Verifique métricas de performance

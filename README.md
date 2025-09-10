# CamMonitor Pro - Sistema de Monitoramento de Câmeras

Sistema completo de monitoramento de câmeras de segurança com interface web moderna e banco de dados.

## 📋 Requisitos do Sistema

### Ambiente de Desenvolvimento
- **Node.js**: versão 18 ou superior
- **npm**: versão 8 ou superior
- **Git**: para controle de versão

### Dependências Principais
- **React 19**: Interface de usuário
- **Hono**: Framework web para backend
- **Tailwind CSS**: Estilização
- **SQLite/D1**: Banco de dados
- **TypeScript**: Tipagem estática
- **Vite**: Build tool e dev server

## 🚀 Instalação e Configuração

### 1. Clone o Repositório
```bash
git clone [URL_DO_REPOSITORIO]
cd cammonitor-pro
```

### 2. Instale as Dependências
```bash
npm install
```

### 3. Configuração do Banco de Dados
O sistema usa SQLite com a seguinte estrutura:

```sql
CREATE TABLE cameras (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  ip TEXT NOT NULL,
  serial TEXT NOT NULL,
  location TEXT NOT NULL,
  store TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('online', 'offline', 'aviso', 'erro', 'reparo')),
  channels_total INTEGER NOT NULL DEFAULT 4,
  channels_working INTEGER NOT NULL DEFAULT 4,
  channels_blackscreen INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. Configuração de Secrets (Opcional)
Para funcionalidades avançadas, configure os seguintes secrets:

```bash
# Secrets para autenticação (se necessário)
MOCHA_USERS_SERVICE_API_KEY=your_api_key
MOCHA_USERS_SERVICE_API_URL=your_api_url
```

## 🔧 Execução Local

### Desenvolvimento
```bash
npm run dev
```
A aplicação estará disponível em: `http://localhost:5173`

### Build para Produção
```bash
npm run build
```

### Verificação de Tipos
```bash
npm run check
```

## 🌐 Deploy em Cloudflare Workers

### Pré-requisitos
- Conta no Cloudflare
- Wrangler CLI instalado: `npm install -g wrangler`

### Configuração
1. Configure o wrangler:
```bash
wrangler login
```

2. Configure o banco D1:
```bash
wrangler d1 create cammonitor-db
```

3. Execute as migrações:
```bash
wrangler d1 migrations apply cammonitor-db
```

### Deploy
```bash
wrangler publish
```

## 🐳 Deploy com Docker

### Dockerfile Sugerido
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
```

### Build e Execução
```bash
docker build -t cammonitor-pro .
docker run -p 5173:5173 cammonitor-pro
```

## 📊 Estrutura do Projeto

```
src/
├── react-app/              # Frontend React
│   ├── components/         # Componentes reutilizáveis
│   ├── hooks/             # Custom hooks
│   ├── pages/             # Páginas da aplicação
│   └── main.tsx           # Entry point
├── shared/                # Tipos compartilhados
│   └── types.ts           # Definições TypeScript
└── worker/                # Backend Hono
    └── index.ts           # API routes
```

## 🔌 API Endpoints

### Câmeras
- `GET /api/cameras` - Lista todas as câmeras
- `POST /api/cameras` - Adiciona nova câmera
- `PUT /api/cameras/:id` - Atualiza câmera
- `DELETE /api/cameras/:id` - Remove câmera

### Exemplo de Payload
```json
{
  "name": "Câmera Entrada Principal",
  "ip": "192.168.1.100",
  "serial": "ABC123456789",
  "location": "Entrada Principal",
  "store": "Loja Centro",
  "status": "online",
  "channels_total": 4,
  "channels_working": 4,
  "channels_blackscreen": 0
}
```

## 🔒 Configurações de Segurança

### Variáveis de Ambiente
```bash
# .env.local (para desenvolvimento)
NODE_ENV=development
```

### Headers de Segurança (Produção)
- CORS configurado
- Content Security Policy
- Rate limiting (recomendado)

## 🚨 Troubleshooting

### Problemas Comuns
1. **Erro de conexão com BD**: Verifique se as migrações foram executadas
2. **Build falha**: Verifique versões do Node.js e npm
3. **Campos não clicáveis**: Verifique CSS e JavaScript habilitado

### Logs
```bash
# Desenvolvimento
tail -f /var/log/vite.out.log

# Produção Cloudflare
wrangler tail
```

## 📝 Licença

Este projeto é propriedade da equipe de desenvolvimento.

## 🤝 Suporte

Para suporte técnico:
1. Verifique os logs de erro
2. Consulte a documentação da API
3. Entre em contato com a equipe de desenvolvimento

---

**Versão**: 1.0.0  
**Última Atualização**: Setembro 2025

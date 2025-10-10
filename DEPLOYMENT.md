# 🚀 Deployment Guide - City Information Assistant

This guide covers multiple deployment options for the City Information Assistant.

## 📋 Prerequisites

Before deploying, ensure you have:

1. **OpenAI API Key** (required)
2. **OpenWeatherMap API Key** (optional, but recommended)
3. **RapidAPI Key** (optional, for enhanced city facts)

## 🌐 Deployment Options

### Option 1: Mastra Playground (Local/Development)

The simplest way to run and test:

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Edit .env with your API keys

# Start development server
npm run dev
```

Access at: `http://localhost:3456`

---

### Option 2: Mastra Cloud (Recommended for Production)

Deploy directly to Mastra Cloud:

```bash
# Build the project
npm run build

# Deploy to Mastra Cloud
npx mastra deploy

# Follow the prompts to:
# 1. Authenticate with Mastra Cloud
# 2. Set environment variables
# 3. Configure deployment settings
```

Your app will be available at: `https://your-app.mastra.cloud`

**Benefits:**
- Built-in observability dashboard
- Automatic scaling
- Zero infrastructure management
- Full agent monitoring

---

### Option 3: Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3456

# Set environment to production
ENV NODE_ENV=production

# Start the server
CMD ["npm", "start"]
```

Build and run:

```bash
# Build Docker image
docker build -t city-information-assistant .

# Run container
docker run -p 3456:3456 \
  -e OPENAI_API_KEY=your_key \
  -e OPENWEATHER_API_KEY=your_key \
  -e RAPIDAPI_KEY=your_key \
  city-information-assistant
```

---

### Option 4: Cloud Platform Deployment

#### Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

3. Set environment variables in Vercel dashboard

#### Netlify

1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Deploy:
```bash
netlify deploy --prod
```

3. Set environment variables in Netlify dashboard

#### AWS / Google Cloud / Azure

Use the Docker deployment method with:
- **AWS**: ECS, Fargate, or App Runner
- **Google Cloud**: Cloud Run or Kubernetes Engine
- **Azure**: Container Instances or App Service

---

## 🔐 Environment Variables

### Required

```bash
OPENAI_API_KEY=sk-...
```

### Optional (but recommended)

```bash
# Weather data (without this, mock data is used)
OPENWEATHER_API_KEY=your_key_here

# Enhanced city information (without this, Wikipedia API is used)
RAPIDAPI_KEY=your_key_here
```

### How to Get API Keys

1. **OpenAI**: https://platform.openai.com/api-keys
2. **OpenWeatherMap**: https://openweathermap.org/api
3. **RapidAPI**: https://rapidapi.com/wirefreethought/api/geodb-cities/

---

## 📊 Production Configuration

### Database

The app uses LibSQL for persistent storage. In production:

```typescript
// src/mastra/index.ts
storage: new LibSQLStore({
  url: "file:./mastra.db",  // Local file
  // OR
  url: process.env.DATABASE_URL,  // Remote database
}),
```

### Logging

Configure logging level for production:

```typescript
logger: new PinoLogger({
  name: 'CityInformationAssistant',
  level: process.env.LOG_LEVEL || 'info',  // 'debug', 'info', 'warn', 'error'
}),
```

### Observability

Mastra includes built-in observability:

```typescript
observability: {
  default: { enabled: true },
  // Optional: Add custom exporters
  // cloud: { apiKey: process.env.MASTRA_CLOUD_KEY },
},
```

---

## 🧪 Testing in Production

### Health Check Endpoint

Test your deployment:

```bash
curl https://your-domain.com/health
```

### API Testing

Test the agent:

```bash
curl -X POST https://your-domain.com/api/agents/cityAssistantAgent/generate \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Tell me about Paris"
      }
    ],
    "threadId": "test-123"
  }'
```

---

## 📈 Monitoring

### Mastra Cloud Dashboard

If deployed to Mastra Cloud, access your dashboard at:
- **Observability**: View traces, logs, and metrics
- **Analytics**: Track usage and performance
- **Errors**: Monitor and debug issues

### Custom Monitoring

Integrate with external services:
- **Datadog**: APM and logging
- **New Relic**: Application monitoring
- **Sentry**: Error tracking
- **LogRocket**: Session replay

---

## 🔧 Troubleshooting

### Common Issues

1. **"Agent not found" error**
   - Ensure all imports in `src/mastra/index.ts` are correct
   - Check that the agent is registered in the Mastra config

2. **API key errors**
   - Verify environment variables are set
   - Check API key validity
   - Review rate limits

3. **Memory/Database errors**
   - Ensure LibSQL database file is writable
   - Check disk space
   - Verify database URL is correct

4. **Tool execution failures**
   - Check API endpoint availability
   - Verify network connectivity
   - Review API quotas

### Debug Mode

Enable debug logging:

```bash
LOG_LEVEL=debug npm run dev
```

---

## 🚀 Performance Optimization

### Production Best Practices

1. **Use persistent database**
   ```typescript
   url: "file:./mastra.db"  // Not ":memory:"
   ```

2. **Enable connection pooling**
   ```typescript
   storage: new LibSQLStore({
     url: "file:./mastra.db",
     connectionPooling: true,
   }),
   ```

3. **Configure caching**
   - Cache API responses
   - Use CDN for static assets
   - Implement rate limiting

4. **Monitor performance**
   - Track response times
   - Monitor token usage
   - Watch database size

---

## 📝 Deployment Checklist

- [ ] Environment variables configured
- [ ] Database persistence enabled
- [ ] Logging level set appropriately
- [ ] Observability enabled
- [ ] Health check endpoint working
- [ ] API keys validated
- [ ] Error handling tested
- [ ] Performance monitoring set up
- [ ] Backup strategy in place
- [ ] Documentation updated

---

## 🔄 CI/CD Pipeline

Example GitHub Actions workflow (`.github/workflows/deploy.yml`):

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - run: npm ci
      
      - run: npm test
      
      - run: npm run build
      
      - name: Deploy to Mastra Cloud
        run: npx mastra deploy --auto
        env:
          MASTRA_API_KEY: ${{ secrets.MASTRA_API_KEY }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

---

## 📞 Support

For deployment issues:
- **Mastra Docs**: https://docs.mastra.ai
- **GitHub Issues**: Create an issue in the repository
- **Mastra Discord**: Join the community

---

**Your City Information Assistant is ready for production!** 🎉


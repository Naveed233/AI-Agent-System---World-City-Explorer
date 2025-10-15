# 🚀 Deployment Checklist

## ❌ **MISSING (Must Do Before Production)**

### **1. ❌ Railway Environment Variables**
**Status**: NOT SET  
**Priority**: CRITICAL  
**Impact**: API calls will fail without these

**Add to Railway:**
```bash
AMADEUS_API_KEY=vp3pPKkVcsZA4TAdQg3uIcO6p4OMhsEe
AMADEUS_API_SECRET=So8y0UcyZ00xPZYY
EXCHANGERATE_API_KEY=80352c8e56592c730903bca6
```

**How to Add**:
1. Go to Railway dashboard
2. Select your project: AI-Agent-System---World-City-Explorer
3. Click "Variables" tab
4. Click "+ New Variable"
5. Add each variable one by one
6. Railway will auto-redeploy

**Without these**: Flight/hotel/currency tools will fail

---

### **2. ⚠️ Redis Setup (Optional but Recommended)**
**Status**: NOT CONFIGURED  
**Priority**: HIGH (for performance)  
**Impact**: Will use in-memory cache instead (works fine for single server)

**Option A: Railway Redis Plugin (Recommended - 1 click)**
1. Go to Railway dashboard
2. Click "+ New" → "Database" → "Add Redis"
3. `REDIS_URL` automatically configured
4. Free tier: 100MB storage, 10K requests/day

**Option B: Upstash Redis (Alternative)**
1. Sign up: https://upstash.com
2. Create Redis database (free tier)
3. Copy Redis URL
4. Add to Railway variables: `REDIS_URL=redis://...`

**Option C: Skip (Use In-Memory)**
- Don't add `REDIS_URL`
- System automatically uses in-memory cache
- Works great for single server
- Limitation: Cache clears on restart

**Recommendation**: Use Railway Redis plugin (1 click, free)

---

### **3. ✅ OpenAI API Key**
**Status**: ALREADY SET (assumed)  
**Priority**: CRITICAL  
**Impact**: Agent won't work without it

**Verify it exists:**
```bash
OPENAI_API_KEY=sk-...
```

If missing, add it to Railway variables.

---

### **4. ⚠️ OpenWeather API Key**
**Status**: UNKNOWN  
**Priority**: MEDIUM  
**Impact**: Weather tool will fail

**Check if set:**
```bash
OPENWEATHER_API_KEY=...
```

If missing, get free key:
1. Sign up: https://openweathermap.org/api
2. Get API key (free: 1,000 calls/day)
3. Add to Railway: `OPENWEATHER_API_KEY=your_key`

---

## ⚠️ **POTENTIAL ISSUES**

### **5. ⚠️ CORS Configuration**
**Status**: NOT CONFIGURED  
**Priority**: MEDIUM  
**Impact**: Frontend might have CORS errors

**If you see CORS errors**, add to backend:
```typescript
// In Mastra config or Express middleware
app.use(cors({
  origin: 'https://ai-city-travel.surge.sh',
  credentials: true
}));
```

---

### **6. ⚠️ Rate Limiting User Identification**
**Status**: USING PLACEHOLDER  
**Priority**: LOW (for MVP)  
**Impact**: All users share same rate limit

**Current Code** (in tools):
```typescript
const identifier = 'demo-user'; // TODO: Get from runtimeContext/auth
```

**For Production** (after adding auth):
```typescript
const identifier = runtimeContext.user?.id || 
                   runtimeContext.headers?.['x-user-id'] || 
                   'anonymous';
```

**For Now**: Keep as is (all users share rate limit - fine for demo)

---

### **7. ⚠️ City Disambiguation in Agent Prompt**
**Status**: NOT ENFORCED  
**Priority**: LOW  
**Impact**: Agent might not ask about ambiguous cities

**Enhancement for Agent Prompt**:
Add this to `city-assistant-agent.ts`:
```typescript
// In prompt instructions
- If city name is ambiguous (London, Paris, Birmingham), ALWAYS ask:
  "Which London did you mean? London, UK or London, Ontario, Canada?"
```

**For Now**: City mapper logs warnings, agent should handle naturally

---

## ✅ **ALREADY HANDLED**

### **8. ✅ Package Dependencies**
**Status**: FIXED (just added ioredis)  
All dependencies now in package.json:
- ✅ ioredis (for Redis caching)
- ✅ @mastra/core
- ✅ @ai-sdk/openai
- ✅ All other required packages

### **9. ✅ Error Handling**
**Status**: COMPLETE  
All tools have:
- ✅ Try-catch blocks
- ✅ Fallback strategies
- ✅ Graceful error messages
- ✅ Logging

### **10. ✅ Code Build**
**Status**: SUCCESSFUL  
Last build: ✅ No errors

---

## 📋 **DEPLOYMENT STEPS**

### **Immediate (Before Testing)**
1. ⚠️ **Install ioredis**: `npm install` (done automatically on Railway)
2. ❌ **Add 3 API keys to Railway** (Amadeus x2, ExchangeRate)
3. ⚠️ **Optional: Add Railway Redis plugin** (1-click)
4. ⚠️ **Verify OpenAI key exists**
5. ⚠️ **Optional: Add OpenWeather key**

### **After Deployment**
6. ✅ Test all 3 API tools (currency, flights, hotels)
7. ✅ Test caching (search twice, check logs)
8. ✅ Test rate limiting (make 21+ searches)
9. ✅ Test 150+ cities (Prague, Helsinki, etc.)

### **Production Hardening (Later)**
10. Add user authentication (to track rate limits per user)
11. Add CORS config (if frontend has issues)
12. Add monitoring/alerts (Sentry, LogRocket, etc.)
13. Add analytics (PostHog, Mixpanel, etc.)

---

## 🔧 **QUICK FIX SUMMARY**

**What's Missing RIGHT NOW:**

1. ❌ **Railway env vars** (CRITICAL - add 3 API keys)
2. ⚠️ **Redis setup** (OPTIONAL - 1-click Railway plugin)
3. ✅ **ioredis dependency** (FIXED - in package.json)

**Everything else is ready to go!**

---

## 🧪 **TEST AFTER DEPLOYMENT**

### **Test 1: Currency Conversion (ExchangeRate API)**
```
User: "Convert 1000 USD to EUR"
Expected: Real exchange rate (e.g., "920 EUR")
```

### **Test 2: Flight Search (Amadeus API)**
```
User: "Find flights from London to Paris next week"
Expected: Real flight options with prices
```

### **Test 3: Hotel Search (Amadeus API)**
```
User: "Find hotels in Tokyo"
Expected: Real hotel listings with prices
```

### **Test 4: Caching**
```
1. Search same flight twice
2. Second search should be instant (<10ms)
3. Check Railway logs: "📦 [Cache] HIT"
```

### **Test 5: Rate Limiting**
```
Make 21 flight searches rapidly
21st should return: "⚠️ Rate limit exceeded (20/hour). Try again in X minutes."
```

### **Test 6: 150+ Cities**
```
User: "Flights from Prague to Budapest"
User: "Hotels in Helsinki"
User: "Flights from Cape Town to Nairobi"
Expected: All should work (use IATA codes)
```

---

## 🎯 **PRIORITY ORDER**

### **Must Do Now (Before Testing)**
1. ❌ Add 3 Railway env variables
2. ✅ Push updated package.json (includes ioredis)
3. ⚠️ Wait for Railway to redeploy (~2-3 min)

### **Should Do (For Performance)**
4. ⚠️ Add Railway Redis plugin (1 click)

### **Can Do Later (Nice to Have)**
5. Add user authentication
6. Add monitoring/alerts
7. Improve agent prompt for city disambiguation

---

## ✅ **CURRENT STATUS**

**Code**: 100% Complete ✅  
**Build**: Successful ✅  
**Tests**: Not run yet ⏳  
**Deployment**: Needs env vars ❌  
**Redis**: Optional, not set ⚠️  

**Next Step**: Add 3 env vars to Railway, then test!

---

## 📞 **IF SOMETHING DOESN'T WORK**

### **Currency conversion fails**
→ Check `EXCHANGERATE_API_KEY` is set correctly

### **Flight/hotel search fails**
→ Check both `AMADEUS_API_KEY` and `AMADEUS_API_SECRET` are set

### **Agent doesn't respond**
→ Check `OPENAI_API_KEY` is set

### **Cache doesn't work**
→ It's fine! System falls back to in-memory cache automatically

### **"Module not found: ioredis"**
→ Railway should install it automatically. If not, check package.json was pushed.

---

**🚀 You're 3 env variables away from production!**


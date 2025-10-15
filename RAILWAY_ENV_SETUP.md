# Railway Environment Variables Setup

## 🚀 Add These Environment Variables to Railway

Go to your Railway project → **Variables** tab and add these:

### **Required API Keys**

```bash
# Amadeus API (Flights & Hotels)
AMADEUS_API_KEY=vp3pPKkVcsZA4TAdQg3uIcO6p4OMhsEe
AMADEUS_API_SECRET=So8y0UcyZ00xPZYY

# ExchangeRate API (Currency Conversion)
EXCHANGERATE_API_KEY=80352c8e56592c730903bca6
```

### **Existing Variables (Keep These)**

```bash
# OpenAI
OPENAI_API_KEY=<your_existing_key>

# Weather
OPENWEATHER_API_KEY=<your_existing_key>

# Port
PORT=4111
```

---

## 📝 Steps to Add Variables on Railway

1. Go to: https://railway.app/project/<your-project-id>
2. Click on your **AI-Agent-System---World-City-Explorer** service
3. Go to **Variables** tab
4. Click **+ New Variable**
5. Add each variable:
   - Name: `AMADEUS_API_KEY`
   - Value: `vp3pPKkVcsZA4TAdQg3uIcO6p4OMhsEe`
6. Repeat for `AMADEUS_API_SECRET` and `EXCHANGERATE_API_KEY`
7. Railway will automatically redeploy

---

## ✅ Verification

Once deployed, test:

**Currency Conversion:**
```
"Convert 100 USD to EUR"
```
Should return live exchange rate (updated daily)

**Flight Search:**
```
"Find flights from London to Paris next week"
```
Should return real flight options from Amadeus

**Hotel Search:**
```
"Find mid-range hotels in Tokyo for next month"
```
Should return real hotel listings from Amadeus

---

## ⚠️ API Limits (Free Tier)

- **Amadeus**: 2,000 calls/month (test environment)
- **ExchangeRate**: 1,500 calls/month

If limits exceeded, tools will automatically fall back to web search.


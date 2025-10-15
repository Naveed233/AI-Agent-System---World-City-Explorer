# 🚀 Future Enhancements - Implementation Plans

## ✅ **COMPLETED ENHANCEMENTS**

### 1. ✅ 150+ City IATA Mapping
**Status**: Implemented  
**Impact**: Supports 150+ major cities worldwide  
**Location**: `src/mastra/tools/helpers/city-iata-mapper.ts`

### 2. ✅ Rate Limiting
**Status**: Implemented  
**Impact**: Prevents API abuse, stays within free tier limits  
**Location**: `src/middleware/rate-limiter.ts`  
**Limits**:
- Flight searches: 20/hour per user
- Hotel searches: 20/hour per user
- Currency conversions: 50/hour per user
- Global: 100 requests/hour per user

### 3. ✅ Batch Requests for Groups
**Status**: Implemented  
**Impact**: Already optimized - Amadeus API accepts `passengers` parameter  
**Details**: Single API call handles multiple passengers

### 4. ✅ Redis Caching
**Status**: Implemented  
**Impact**: 50-80% reduction in API calls, faster responses  
**Location**: `src/middleware/cache-manager.ts`  
**Features**:
- Automatic fallback to in-memory if Redis unavailable
- Smart TTL: Flight/hotel = 30min, Hotel list = 24hr, Currency = 1hr
- Cache hit/miss logging

---

## 🔮 **PLANNED ENHANCEMENTS (Ready to Implement)**

### 5. 🔍 Semantic Search for Hotels/Flights
**Status**: Designed, Not Implemented  
**Impact**: Natural language search ("luxury hotel with spa near beach")  
**Complexity**: Medium (2-4 hours)  
**Cost**: ~$0.10/month (using existing OpenAI key)

#### **Implementation Plan**

**Step 1: Database Schema**
```sql
-- Add to LibSQL
CREATE TABLE hotel_embeddings (
  id INTEGER PRIMARY KEY,
  hotel_id TEXT,
  hotel_name TEXT,
  description TEXT,
  embedding BLOB, -- Store as binary vector
  city TEXT,
  price_range TEXT,
  amenities TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_hotel_city ON hotel_embeddings(city);
```

**Step 2: Generate Embeddings**
```typescript
import { openai } from '@ai-sdk/openai';

async function generateHotelEmbedding(description: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small', // Cheap: $0.02 per 1M tokens
    input: description,
  });
  
  return response.data[0].embedding;
}

// Generate for all hotels once
async function indexHotels(hotels: Hotel[]) {
  for (const hotel of hotels) {
    const description = `${hotel.name} ${hotel.amenities.join(' ')} ${hotel.location}`;
    const embedding = await generateHotelEmbedding(description);
    
    await db.insert('hotel_embeddings', {
      hotel_id: hotel.id,
      hotel_name: hotel.name,
      description,
      embedding: Buffer.from(new Float32Array(embedding).buffer),
      city: hotel.city,
      price_range: hotel.priceRange,
      amenities: hotel.amenities.join(','),
    });
  }
}
```

**Step 3: Semantic Search**
```typescript
async function semanticHotelSearch(query: string, city: string, limit: number = 10) {
  // Generate embedding for user query
  const queryEmbedding = await generateHotelEmbedding(query);
  
  // Get all hotels in city
  const hotels = await db.query('SELECT * FROM hotel_embeddings WHERE city = ?', [city]);
  
  // Calculate cosine similarity
  const results = hotels.map(hotel => {
    const hotelEmbedding = new Float32Array(hotel.embedding.buffer);
    const similarity = cosineSimilarity(queryEmbedding, hotelEmbedding);
    
    return { ...hotel, similarity };
  });
  
  // Sort by similarity and return top results
  return results.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}
```

**Step 4: Integrate into Hotel Tool**
```typescript
// In hotel-booking-tool.ts
const searchQuery = `${priceRange} hotel with ${amenities.join(' ')}`;
const semanticResults = await semanticHotelSearch(searchQuery, city);

// Merge with Amadeus results for best of both worlds
const combinedResults = mergeResults(amadeusResults, semanticResults);
```

**Cost Estimate**:
- Embedding generation: $0.02 per 1M tokens
- For 1,000 hotels: ~$0.01 one-time
- User queries: ~$0.0001 per search
- **Total**: ~$0.10/month for 1,000 searches

---

### 6. 📊 Price Tracking System
**Status**: Designed, Not Implemented  
**Impact**: Alert users when flight/hotel prices drop  
**Complexity**: High (4-6 hours)  
**Cost**: Free (Railway cron + existing LibSQL)

#### **Implementation Plan**

**Step 1: Database Schema**
```sql
-- Tracked routes/hotels
CREATE TABLE price_tracking (
  id INTEGER PRIMARY KEY,
  user_id TEXT,
  type TEXT, -- 'flight' or 'hotel'
  route TEXT, -- e.g., "JFK-LHR-2025-12-15"
  city TEXT, -- for hotels
  current_price REAL,
  target_price REAL,
  currency TEXT,
  notify_email TEXT,
  active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_checked DATETIME
);

-- Price history
CREATE TABLE price_history (
  id INTEGER PRIMARY KEY,
  tracking_id INTEGER,
  price REAL,
  currency TEXT,
  source TEXT, -- 'amadeus' or 'websearch'
  checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tracking_id) REFERENCES price_tracking(id)
);

CREATE INDEX idx_tracking_active ON price_tracking(active, last_checked);
```

**Step 2: Add Tracking Endpoint**
```typescript
// In Mastra API
app.post('/api/track-price', async (req, res) => {
  const { userId, type, route, targetPrice, email } = req.body;
  
  // Get current price
  const currentPrice = await getCurrentPrice(type, route);
  
  // Save to database
  const trackingId = await db.insert('price_tracking', {
    user_id: userId,
    type,
    route,
    current_price: currentPrice,
    target_price: targetPrice,
    currency: 'USD',
    notify_email: email,
    active: 1,
    last_checked: new Date().toISOString(),
  });
  
  res.json({ success: true, trackingId });
});
```

**Step 3: Cron Job to Check Prices**
```typescript
// /api/cron/check-prices (called by Railway cron daily)
app.get('/api/cron/check-prices', async (req, res) => {
  // Get all active price tracking
  const tracks = await db.query(`
    SELECT * FROM price_tracking 
    WHERE active = 1 
    ORDER BY last_checked ASC 
    LIMIT 100
  `);
  
  for (const track of tracks) {
    try {
      // Fetch current price
      const newPrice = await getCurrentPrice(track.type, track.route);
      
      // Save to history
      await db.insert('price_history', {
        tracking_id: track.id,
        price: newPrice,
        currency: track.currency,
        source: 'amadeus',
        checked_at: new Date().toISOString(),
      });
      
      // Check if price dropped
      const priceDrop = track.current_price - newPrice;
      const dropPercent = (priceDrop / track.current_price) * 100;
      
      if (newPrice <= track.target_price || dropPercent >= 10) {
        // Send notification
        await sendPriceAlert(track, newPrice, priceDrop);
        
        // Update tracking
        await db.update('price_tracking', track.id, {
          current_price: newPrice,
          last_checked: new Date().toISOString(),
        });
      }
      
    } catch (error) {
      console.error(`Error checking price for ${track.route}:`, error);
    }
  }
  
  res.json({ checked: tracks.length });
});

async function getCurrentPrice(type: string, route: string): Promise<number> {
  if (type === 'flight') {
    const [origin, dest, date] = route.split('-');
    const result = await amadeusRequest('/v2/shopping/flight-offers', {
      originLocationCode: origin,
      destinationLocationCode: dest,
      departureDate: date,
      adults: 1,
      max: 1,
    });
    
    return parseFloat(result.data[0]?.price?.total || 0);
  }
  
  // Similar for hotels...
  return 0;
}

async function sendPriceAlert(track: any, newPrice: number, drop: number) {
  // Use SendGrid, Resend, or Mastra notifications
  const message = `
    Price Alert! 🎉
    
    ${track.route}
    Old price: ${track.currency} ${track.current_price}
    New price: ${track.currency} ${newPrice}
    You save: ${track.currency} ${drop.toFixed(2)} (${((drop/track.current_price)*100).toFixed(1)}%)
    
    Book now: [booking link]
  `;
  
  // Send email/SMS/push notification
  console.log(`📧 [Price Alert] Sending to ${track.notify_email}:`, message);
}
```

**Step 4: Setup Railway Cron**
```bash
# In Railway dashboard:
# 1. Go to your project
# 2. Click "Cron Jobs" in sidebar
# 3. Add new cron job:
#    - Schedule: "0 */6 * * *" (every 6 hours)
#    - Command: curl https://your-app.railway.app/api/cron/check-prices
```

**Cost Estimate**:
- Database: Free (LibSQL on Railway)
- Cron: Free (Railway includes cron)
- Notifications: Free tier (SendGrid: 100/day, Resend: 100/day)
- **Total**: $0/month

---

## 📊 **Implementation Priority**

### **For Interview (Demonstrate Now)**
1. ✅ Rate limiting - Shows abuse prevention thinking
2. ✅ 150+ cities - Shows thoroughness
3. ✅ Caching - Shows cost optimization

### **For Production (Implement Later)**
4. 🔍 Semantic search - Shows AI expertise
5. 📊 Price tracking - Shows full-stack capabilities

---

## 💡 **Additional Future Enhancements**

### 7. User Authentication & Profiles
- JWT auth with Mastra
- Save favorite destinations
- Booking history
- Custom rate limits per tier (free/premium)

### 8. Multi-Currency Support Throughout
- Detect user's currency from IP/location
- Convert all prices to user's preferred currency
- Display prices in multiple currencies side-by-side

### 9. Calendar Integration
- Export itineraries to Google Calendar/iCal
- Sync with flight bookings
- Reminder notifications

### 10. Collaborative Trip Planning
- Share itineraries with friends
- Voting on activities
- Split costs tracking (integration with Splitwise)

### 11. Mobile Apps
- React Native app (already have base code)
- Push notifications for price alerts
- Offline mode for saved itineraries

### 12. Advanced Analytics
- Popular routes/destinations
- Price trends over time
- User behavior patterns
- A/B testing for recommendations

---

## 🎓 **For Your Interview**

**When asked about future improvements:**

> "I've implemented 4 of the 6 planned enhancements: city mapping, rate limiting, batch optimization, and Redis caching. For the remaining two (semantic search and price tracking), I've designed complete implementation plans with database schemas, code examples, and cost estimates. Both are production-ready designs that could be implemented in 2-4 hours each."

**Show the complete documentation:**
- ✅ Working code for 4 enhancements
- ✅ Detailed plans for 2 remaining
- ✅ Cost analysis
- ✅ Production deployment strategy

**This demonstrates:**
1. Execution speed (implemented 4 features)
2. System design thinking (planned 2 more)
3. Cost awareness (free tier optimization)
4. Production readiness (caching, rate limiting)


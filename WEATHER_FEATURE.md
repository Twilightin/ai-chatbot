# Weather Information Feature Guide

This app has a **built-in weather tool** that the AI can use to get current weather information!

---

## 🌤️ How It Works

The app uses **AI Tool Calling** to automatically fetch weather data when you ask about weather.

### Weather Data Source

- **API**: [Open-Meteo](https://open-meteo.com/) - Free weather API (no API key required!)
- **Geocoding**: Open-Meteo Geocoding API
- **Data**: Current temperature, hourly forecast, sunrise/sunset times

---

## 💬 How to Get Weather Information

Just **ask the AI naturally** about weather! The AI will automatically call the weather tool.

### Example Questions:

1. **By City Name**:

   - "What's the weather in San Francisco?"
   - "Tell me the temperature in Tokyo"
   - "How's the weather in London?"
   - "Is it sunny in Paris right now?"

2. **By Coordinates** (if you know them):

   - "What's the weather at latitude 40.7128, longitude -74.0060?"
   - "Show me the weather at 51.5074° N, 0.1278° W"

3. **User's Location** (using geolocation):
   - "What's the weather here?"
   - "What's my local weather?"
   - The app detects your approximate location from the request

---

## 🔧 How It Works Technically

### 1. AI Tool Registration

**File**: `app/(chat)/api/chat/route.ts`

The weather tool is registered as an available AI tool:

```typescript
tools: {
  getWeather,
  createDocument: createDocument({ session: mockSession, dataStream }),
  updateDocument: updateDocument({ session: mockSession, dataStream }),
  requestSuggestions: requestSuggestions({ session: mockSession, dataStream }),
},
```

### 2. Weather Tool Implementation

**File**: `lib/ai/tools/get-weather.ts`

The tool can accept:

- **City name**: "San Francisco", "New York", "London"
- **Coordinates**: latitude + longitude
- **Auto-detection**: Uses request geolocation

```typescript
export const getWeather = tool({
  description:
    "Get the current weather at a location. You can provide either coordinates or a city name.",
  inputSchema: z.object({
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    city: z.string().describe("City name").optional(),
  }),
  execute: async (input) => {
    // 1. If city provided, geocode to get coordinates
    // 2. Fetch weather from Open-Meteo API
    // 3. Return weather data
  },
});
```

### 3. Geocoding Process

When you provide a city name:

1. **Query**: `https://geocoding-api.open-meteo.com/v1/search?name=CityName`
2. **Response**: Latitude and longitude for the city
3. **Use coordinates** to fetch weather

### 4. Weather Data Fetching

```typescript
const response = await fetch(
  `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&hourly=temperature_2m&daily=sunrise,sunset&timezone=auto`
);
```

### 5. Display Weather

**File**: `components/weather.tsx`

The weather component displays:

- 🌡️ Current temperature
- 🌅 Sunrise/sunset times
- ☀️/🌙 Day/night indicator
- 📊 Hourly temperature chart
- 📍 Location name

---

## 🧪 Try It Now!

### Test 1: Ask about a specific city

```
You: What's the weather in New York?
```

The AI will:

1. Recognize you're asking about weather
2. Call the `getWeather` tool with `city: "New York"`
3. Geocode "New York" to get coordinates
4. Fetch weather data
5. Display formatted weather information

### Test 2: Ask about your location

```
You: What's the weather like here?
```

The AI will:

1. Use geolocation from the request
2. Get your approximate city/coordinates
3. Fetch weather for your location
4. Show results

### Test 3: Multiple cities

```
You: Compare the weather in London and Paris
```

The AI will:

1. Call `getWeather` for London
2. Call `getWeather` for Paris
3. Compare and present both results

---

## 📊 Weather Data Returned

The weather API returns comprehensive data:

```typescript
{
  latitude: 40.7128,
  longitude: -74.0060,
  timezone: "America/New_York",
  cityName: "New York",
  current: {
    time: "2025-11-07T10:00",
    temperature_2m: 15.2,  // Current temperature in °C
  },
  hourly: {
    time: [...],            // Array of timestamps
    temperature_2m: [...],  // Array of temperatures
  },
  daily: {
    sunrise: [...],         // Sunrise times
    sunset: [...],          // Sunset times
  }
}
```

---

## 🎨 Weather Display Features

The `Weather` component shows:

1. **Current Temperature**:

   - Large display with unit (°C or °F)
   - Color-coded (warm colors for hot, cool for cold)

2. **Day/Night Indicator**:

   - ☀️ Sun icon during daytime
   - 🌙 Moon icon during nighttime
   - Based on sunrise/sunset times

3. **Sunrise/Sunset Times**:

   - Local timezone
   - Formatted display

4. **Temperature Chart**:

   - 24-hour hourly forecast
   - Visual temperature trend
   - Interactive display

5. **Location**:
   - City name (if provided)
   - Coordinates
   - Timezone

---

## 🌍 Geolocation Detection

The app automatically detects your location using Vercel's geolocation:

**File**: `app/(chat)/api/chat/route.ts`

```typescript
import { geolocation } from "@vercel/functions";

const { longitude, latitude, city, country } = geolocation(request);

const requestHints: RequestHints = {
  longitude,
  latitude,
  city,
  country,
};
```

This provides context to the AI about where you are, so it can:

- Answer "What's the weather here?" correctly
- Provide local recommendations
- Use appropriate units/timezone

---

## 🔑 No API Key Required!

**Advantages**:

- ✅ Free to use
- ✅ No registration needed
- ✅ No API key management
- ✅ Open-Meteo is open-source
- ✅ High rate limits for free tier

**Open-Meteo Free Tier**:

- 10,000 API calls per day
- No commercial restrictions for non-commercial use
- Real-time weather data
- Historical and forecast data

---

## 🚫 Tool Availability

**Note**: The weather tool is **disabled for reasoning models**:

```typescript
experimental_activeTools:
  selectedChatModel === "chat-model-reasoning"
    ? []  // No tools for reasoning model
    : [
        "getWeather",
        "createDocument",
        "updateDocument",
        "requestSuggestions",
      ],
```

**Why?**

- Reasoning models focus on complex thinking
- Tools can interfere with reasoning process
- Use the standard GPT-4o model for weather queries

---

## 🛠️ Customization Options

### 1. Add More Weather Parameters

Edit `lib/ai/tools/get-weather.ts` to fetch more data:

```typescript
const response = await fetch(
  `https://api.open-meteo.com/v1/forecast?` +
    `latitude=${latitude}&longitude=${longitude}` +
    `&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m` + // Add more
    `&hourly=temperature_2m,precipitation_probability` +
    `&daily=sunrise,sunset,temperature_2m_max,temperature_2m_min` +
    `&timezone=auto`
);
```

Available parameters:

- `relative_humidity_2m` - Humidity
- `precipitation` - Rainfall
- `wind_speed_10m` - Wind speed
- `wind_direction_10m` - Wind direction
- `cloud_cover` - Cloud coverage
- `pressure_msl` - Sea level pressure
- `visibility` - Visibility distance

### 2. Change Temperature Units

Default is Celsius. To use Fahrenheit:

```typescript
const response = await fetch(
  `https://api.open-meteo.com/v1/forecast?` +
    `latitude=${latitude}&longitude=${longitude}` +
    `&current=temperature_2m` +
    `&temperature_unit=fahrenheit` + // Add this
    `&timezone=auto`
);
```

### 3. Add Forecast Days

Get multi-day forecast:

```typescript
const response = await fetch(
  `https://api.open-meteo.com/v1/forecast?` +
    `latitude=${latitude}&longitude=${longitude}` +
    `&current=temperature_2m` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum` +
    `&forecast_days=7` + // 7-day forecast
    `&timezone=auto`
);
```

---

## 📝 Example Conversations

### Example 1: Simple Weather Query

```
You: What's the temperature in Seattle?

AI: Let me check the weather in Seattle for you.
[Calls getWeather tool with city: "Seattle"]

AI: In Seattle, the current temperature is 12°C (54°F).
It's partly cloudy with a high of 15°C today.
```

### Example 2: Comparing Cities

```
You: Should I pack a jacket for my trip from Miami to Boston?

AI: Let me check the weather in both cities.
[Calls getWeather for Miami and Boston]

AI: Miami is currently 28°C (82°F) and sunny, while Boston
is 8°C (46°F) and cloudy. Yes, definitely pack a jacket
for Boston - it's 20 degrees cooler!
```

### Example 3: Local Weather

```
You: Is it a good day for a picnic?

AI: Let me check your local weather.
[Uses geolocation from request, calls getWeather]

AI: It's currently 22°C (72°F) and sunny with no rain
forecast. Sounds perfect for a picnic! Enjoy!
```

---

## 🐛 Troubleshooting

### Weather not working?

1. **Check if you're using the right model**:

   - Use "GPT-4o" (not "GPT-4o (Reasoning)")
   - Reasoning model has tools disabled

2. **Check your question**:

   - Be clear: "What's the weather in Paris?"
   - Not too vague: "weather" alone might not trigger

3. **City not found?**:

   - Try different spelling
   - Use full city name: "New York City" vs "NYC"
   - Include country for ambiguous names: "London, UK" vs "London, Ontario"

4. **Check browser console** (F12):
   - Look for API errors
   - Check network requests to open-meteo.com

---

## 🌐 API Documentation

- **Open-Meteo API**: https://open-meteo.com/en/docs
- **Geocoding API**: https://open-meteo.com/en/docs/geocoding-api
- **All available parameters**: https://open-meteo.com/en/docs#api-documentation

---

## 📦 Related Files

- `lib/ai/tools/get-weather.ts` - Weather tool implementation
- `components/weather.tsx` - Weather display component
- `app/(chat)/api/chat/route.ts` - Tool registration
- `lib/ai/prompts.ts` - System prompts with location hints

---

## 🎯 Summary

**How to use weather**:

1. Ask the AI about weather naturally
2. Mention a city name or ask "here"
3. Make sure you're using the GPT-4o model (not Reasoning)
4. The AI automatically fetches and displays weather data

**No setup required** - it just works! 🌤️

---

**Created**: November 7, 2025  
**API**: Open-Meteo (free, no API key needed)  
**Available**: Automatically via AI tool calling

# 🔮 Live Astrology APIs Integration Guide

Your backend is successfully running on production! All local and staging configurations should now point directly to the production endpoints.

## 📡 Base Production URL

The base URL for all production API services is:
```
https://bc.mantrapuja.com
```

---

## ⚙️ Mobile Application Configuration

To point your mobile app (Expo / React Native) to the production backend, configure the environment variable in your mobile project.

Update the environment file:
* **File Path:** [mobile-app/.env](file:///Applications/MMMPPP/mantrapujaAll/mobile-app/.env)

```env
EXPO_PUBLIC_ADMIN_URL=https://bc.mantrapuja.com
```

### Dynamic URL Resolution in Code
The mobile application uses [lib/api.ts](file:///Applications/MMMPPP/mantrapujaAll/mobile-app/lib/api.ts) to resolve the backend API URL:
```typescript
const getAdminUrl = () => {
  if (process.env.EXPO_PUBLIC_ADMIN_URL) {
    return process.env.EXPO_PUBLIC_ADMIN_URL; // Resolves to https://bc.mantrapuja.com
  }
  // Fallbacks...
};
```

---

## 🚀 API Endpoints Reference

Here are the endpoints, parameters, and fetch methods available in the mobile application via the `api.astrology` helper.

### 1. Rashi / Horoscope API (`/api/astrology/horoscope`)
Fetches daily, weekly, monthly, or yearly predictions for a given zodiac sign.

* **Method:** `GET` / `POST`
* **URL:** `https://bc.mantrapuja.com/api/astrology/horoscope`
* **Parameters:**
  * `sign` (string, required): e.g., `"aries"`, `"taurus"`, `"gemini"`, etc.
  * `period` (string, optional): `"daily"`, `"weekly"`, `"monthly"`, or `"yearly"` (defaults to `"daily"`)

#### **Client Implementation:**
```typescript
import { api } from '../lib/api';

const fetchHoroscope = async () => {
  try {
    const result = await api.astrology.getHoroscopeData('aries', 'daily');
    if (result.success) {
      console.log('Horoscope Content:', result.data.content);
      console.log('Lucky Color:', result.data.lucky_color);
      console.log('Lucky Number:', result.data.lucky_number);
    }
  } catch (error) {
    console.error('Failed to load horoscope:', error);
  }
};
```

---

### 2. Panchang API (`/api/astrology/panchang`)
Fetches live Vedic calendar details for the current date or specified coordinates.

* **Method:** `GET` / `POST`
* **URL:** `https://bc.mantrapuja.com/api/astrology/panchang`
* **Parameters (Optional):**
  * `day`, `month`, `year` (number)
  * `lat` (number): Latitude (defaults to New Delhi: `28.6139`)
  * `lon` (number): Longitude (defaults to New Delhi: `77.2090`)
  * `tzone` (number): Timezone offset (defaults to `5.5`)

#### **Client Implementation:**
```typescript
import { api } from '../lib/api';

const fetchPanchang = async () => {
  try {
    const result = await api.astrology.getPanchangData();
    if (result.success) {
      console.log('Panchang Title:', result.data.title);
      console.log('Tithi:', result.data.panchang_for_today.Tithi);
      console.log('Nakshatra:', result.data.panchang_for_today.Nakshatra);
    }
  } catch (error) {
    console.error('Failed to load Panchang:', error);
  }
};
```

---

### 3. Kundli API (`/api/astrology/kundli`)
Compiles 26 essential Vedic birth charts, planet positions, dashas, and gemstone suggestions in parallel.

* **Method:** `POST`
* **URL:** `https://bc.mantrapuja.com/api/astrology/kundli`
* **Request Body:**
  * `birthData` (object, required):
    * `day`, `month`, `year` (number): Date of birth
    * `hour`, `min` (number): Time of birth
    * `lat` (number): Birthplace latitude
    * `lon` (number): Birthplace longitude
    * `tzone` (number): Birthplace timezone (e.g. `5.5` for India)
    * `gender` (string): `"male"` or `"female"`
  * `language` (string, optional): `"en"` or `"hi"`

#### **Client Implementation:**
```typescript
import { api } from '../lib/api';

const fetchKundli = async () => {
  const birthData = {
    day: 24,
    month: 6,
    year: 1995,
    hour: 14,
    min: 30,
    lat: 28.6139,
    lon: 77.2090,
    tzone: 5.5,
    gender: 'male'
  };

  try {
    const result = await api.astrology.getKundliData(birthData, 'en');
    if (result.success) {
      console.log('Birth Chart Core Details:', result.data.core);
      console.log('Planetary Positions:', result.data.planets);
      console.log('D1 Chart SVG String:', result.data.chart_d1);
    }
  } catch (error) {
    console.error('Failed to generate Kundli:', error);
  }
};
```

---

## 🛠️ Verification in Mobile Terminal
To verify connection from the mobile directory in terminal:
```bash
curl -i https://bc.mantrapuja.com/health
```
This should output:
```json
{"status":"ok","timestamp":"...","service":"Mantra Puja Backend"}
```

# Standalone Astrology API Package

This folder contains clean, self-contained, high-performance implementations of the Panchang, Rashifal (Horoscope), and Janam Kundli middleware APIs. You can copy this folder directly into any project or host it independently to run the services.

---

## Prerequisites & Installation

To run this standalone server, make sure Node.js is installed, then run the following command in this directory:

```bash
npm install express cors axios cheerio
```

---

## Environment Configuration

The server supports the following optional environment variables:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Port on which the API server runs | `4000` |
| `ASTROLOGY_USER_ID` | Your AstrologyAPI User ID | `652693` (Active Key) |
| `ASTROLOGY_API_KEY` | Your AstrologyAPI Key | `ak-78d22f4e9a7680c4ac68ce28053f9d09fd3d56bf` |

To start the server, execute:

```bash
node server.js
```

---

## Endpoints

### 1. Daily Panchang
Scrapes the live day's Vedic Panchang from AstroSage.

*   **URL:** `GET /api/astrology/panchang`
*   **Response Format:**
    ```json
    {
      "success": true,
      "data": {
        "reference_date": "2026-06-12",
        "title": "Aaj Ka Panchang",
        "location": "New Delhi, India",
        "panchang_for_today": {
          "Tithi": "Krishna Dwitiya till 14:15",
          "Nakshatra": "Moola till 23:45",
          ...
        },
        "sun_moon_calculations": {
          "Sunrise": "05:23 AM",
          "Sunset": "07:18 PM",
          ...
        },
        "hindu_month_year": { ... },
        "inauspicious_timings": { ... },
        "auspicious_timings": { ... }
      }
    }
    ```

---

### 2. Rashifal (Horoscope)
Retrieves sun-sign predictions from AstrologyAPI and maps them to standard category scores and remedies.

*   **URL:** `GET /api/astrology/horoscope` (also supports `POST`)
*   **Query Parameters:**
    *   `sign` (Required): Zodiac sign name (`aries`, `taurus`, `gemini`, etc.)
    *   `period` (Optional): Timeframe (`daily`, `weekly`, `monthly`, `yearly`). Defaults to `daily`.
*   **Example Request:**
    `GET http://localhost:4000/api/astrology/horoscope?sign=aries&period=daily`
*   **Response Format:**
    ```json
    {
      "success": true,
      "data": {
        "sign": "aries",
        "period_type": "daily",
        "content": "Personal Life: ... \n\nProfession: ...",
        "date_label": "Aries Daily Horoscope - June 12, 2026",
        "lucky_number": "5",
        "lucky_color": "Red",
        "remedy": "Offer water to the Sun in the morning.",
        "ratings": [
          { "label": "Love", "score": 4 },
          { "label": "Career", "score": 5 },
          ...
        ],
        "sections": [
          { "heading": "Personal Life", "body": "..." },
          ...
        ],
        "reference_date": "2026-06-12"
      }
    }
    ```

---

### 3. Janam Kundli
Fetches and aggregates 26 essential birth chart endpoints in parallel from AstrologyAPI.

*   **URL:** `POST /api/astrology/kundli`
*   **Headers:** `Content-Type: application/json`
*   **Request Body:**
    ```json
    {
      "birthData": {
        "day": 23,
        "month": 4,
        "year": 1995,
        "hour": 10,
        "min": 30,
        "lat": 28.6139,
        "lon": 77.2090,
        "tzone": 5.5,
        "gender": "male"
      },
      "language": "en"
    }
    ```
*   **Response Keys Included:**
    The response contains a unified dictionary with key-value data for:
    *   `core`: Basic ascendant and astrological coordinates details.
    *   `panchang`: Basic day-of-birth Panchang values.
    *   `dasha` / `current_dasha`: Major Vimshottari Dasha intervals and current sub-dasha details.
    *   `gemstone` / `rudraksha`: Recommendations.
    *   `character` / `career` / `health` / `love` / `physical`: Extended predictions reports.
    *   `numero_table` / `numero_report` / `numero_time` / `numero_place_vastu`: Numerology grids and predictions.
    *   `planets`: Celestial coordinate listings.
    *   `manglik` / `sadhesati`: Dosh calculations.
    *   `kp_planets` / `kp_house_cusps` / `sarvashtak`: KP astrology and points.
    *   `chart_d1` / `chart_d9` / `chart_sun` / `chart_moon` / `chart_d2` / `chart_d3` / `chart_d10`: Interactive SVG code strings for birth charts.

import Constants from "expo-constants";
import { supabase } from "./supabase";

// Centralized API Base URL for Production
export const API_BASE_URL = process.env.EXPO_PUBLIC_ADMIN_URL || "https://bc.mantrapuja.com";

// Check if we are in production mode
export const IS_PROD = typeof __DEV__ !== 'undefined' ? !__DEV__ : process.env.NODE_ENV === 'production';

console.log("[API] Production API URL:", API_BASE_URL);

// Development Host Resolution (Fallback to configure EXPO_PUBLIC_ADMIN_URL for local testing)
export const getBackendHosts = () => {
  return [];
};

// Generate URLs for API requests
export const getAstroUrls = (endpoint: string) => {
  return [`${API_BASE_URL}/api/astrology/${endpoint}`];
};

/**
 * Validates the public health check endpoint before executing astrology requests.
 * Logs the results for debugging purposes.
 */
export const validateHealthCheck = async (): Promise<boolean> => {
  const url = `${API_BASE_URL}/health`;

  console.log("[API] Performing health check validation...");
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    console.log("[API] URL:", url);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    console.log("[API] Response Status:", response.status);
    if (response.ok) {
      const data = await response.json();
      console.log("[API] Health Check Response:", data);
      return true;
    }
  } catch (error: any) {
    console.warn("[API] Health Check Error:", error.message || error);
  }
  return false;
};

/**
 * Asynchronously saves API response data to the client-side Supabase cache.
 */
const saveClientCache = async (key: string, params: any, data: any) => {
  try {
    if (key === "panchang") {
      const { error } = await supabase.from('panchangs').upsert({
        reference_date: params.referenceDateStr,
        lat: params.latFixed,
        lon: params.lonFixed,
        tzone: params.tzoneFixed,
        data: data
      }, { onConflict: 'reference_date,lat,lon,tzone' });

      if (error) throw error;
      console.log(`[API Client Cache] Panchang saved to Supabase.`);
    } else if (key === "horoscope") {
      const { error } = await supabase.from('horoscopes').upsert({
        sign: params.sign,
        period_type: params.period,
        content: data.content,
        date_label: data.date_label,
        lucky_number: data.lucky_number,
        lucky_color: data.lucky_color,
        remedy: data.remedy,
        ratings: data.ratings,
        sections: data.sections,
        reference_date: params.refDate
      }, { onConflict: 'sign,period_type,reference_date' });

      if (error) throw error;
      console.log(`[API Client Cache] Horoscope saved to Supabase.`);
    } else if (key === "kundli") {
      const { error } = await supabase.from('kundlis').upsert({
        day: params.day,
        month: params.month,
        year: params.year,
        hour: params.hour,
        min: params.min,
        lat: params.lat,
        lon: params.lon,
        tzone: params.tzone,
        gender: params.gender,
        language: params.language,
        data: data
      }, { onConflict: 'day,month,year,hour,min,lat,lon,tzone,gender,language' });

      if (error) throw error;
      console.log(`[API Client Cache] Kundli saved to Supabase.`);
    } else if (key === "choghadiya") {
      const { error } = await supabase.from('choghadiyas').upsert({
        reference_date: params.referenceDateStr,
        lat: params.latFixed,
        lon: params.lonFixed,
        tzone: params.tzoneFixed,
        data: data
      }, { onConflict: 'reference_date,lat,lon,tzone' });

      if (error) throw error;
      console.log(`[API Client Cache] Choghadiya saved to Supabase.`);
    }
  } catch (err: any) {
    console.warn(`[API Client Cache] Error saving key ${key}:`, err.message || err);
  }
};

/**
 * Centralized fetch client wrapper for astrology APIs.
 * Includes health check validation, timeout handling, logging, and robust error translation.
 */
export const requestAstro = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  // 1. Try Client-side DB cache check first
  let cacheKey: string | null = null;
  let parsedParams: any = null;

  if (endpoint.startsWith("panchang")) {
    try {
      let day = new Date().getDate();
      let month = new Date().getMonth() + 1;
      let year = new Date().getFullYear();
      let lat = 28.6139;
      let lon = 77.2090;
      let tzone = 5.5;

      if (options.body) {
        const bodyObj = JSON.parse(options.body as string);
        if (bodyObj.day) day = Number(bodyObj.day);
        if (bodyObj.month) month = Number(bodyObj.month);
        if (bodyObj.year) year = Number(bodyObj.year);
        if (bodyObj.lat) lat = Number(bodyObj.lat);
        if (bodyObj.lon) lon = Number(bodyObj.lon);
        if (bodyObj.tzone) tzone = Number(bodyObj.tzone);
      }

      const referenceDateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const latFixed = Number(lat.toFixed(1));
      const lonFixed = Number(lon.toFixed(1));
      const tzoneFixed = Number(tzone.toFixed(1));

      console.log(`[API Client Cache] Checking Panchang for date ${referenceDateStr} at Lat: ${latFixed}, Lon: ${lonFixed}...`);

      const { data: existing } = await supabase
        .from('panchangs')
        .select('*')
        .eq('reference_date', referenceDateStr)
        .eq('lat', latFixed)
        .eq('lon', lonFixed)
        .eq('tzone', tzoneFixed)
        .maybeSingle();

      if (existing && existing.data) {
        console.log(`[API Client Cache] HIT for Panchang!`);
        return existing.data;
      }

      // If cache miss, remember params to save later
      cacheKey = "panchang";
      parsedParams = { referenceDateStr, latFixed, lonFixed, tzoneFixed };
    } catch (cacheErr: any) {
      console.warn("[API Client Cache] Panchang read error:", cacheErr.message || cacheErr);
    }
  } else if (endpoint.startsWith("horoscope")) {
    try {
      // Parse query parameters
      const urlQuery = endpoint.split("?")[1] || "";
      const params = new URLSearchParams(urlQuery);
      const sign = (params.get("sign") || "").toLowerCase();
      const period = (params.get("period") || "daily").toLowerCase();

      if (sign) {
        // Calculate refDate
        const getReferenceDate = (p: string) => {
          const now = new Date();
          if (p === 'monthly') {
            return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
          } else if (p === 'yearly') {
            return new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
          } else if (p === 'weekly') {
            const day = now.getDay() || 7;
            if (day !== 1) now.setHours(-24 * (day - 1));
            return now.toISOString().split('T')[0];
          } else {
            return now.toISOString().split('T')[0]; // daily
          }
        };

        const refDate = getReferenceDate(period);
        console.log(`[API Client Cache] Checking Horoscope for sign ${sign} (${period}) on date ${refDate}...`);

        const { data: existing } = await supabase
          .from('horoscopes')
          .select('*')
          .eq('sign', sign)
          .eq('period_type', period)
          .eq('reference_date', refDate)
          .maybeSingle();

        if (existing) {
          console.log(`[API Client Cache] HIT for Horoscope!`);
          return {
            sign: existing.sign,
            period_type: existing.period_type,
            content: existing.content,
            date_label: existing.date_label,
            lucky_number: existing.lucky_number,
            lucky_color: existing.lucky_color,
            remedy: existing.remedy,
            ratings: existing.ratings,
            sections: existing.sections,
            reference_date: existing.reference_date
          };
        }

        cacheKey = "horoscope";
        parsedParams = { sign, period, refDate };
      }
    } catch (cacheErr: any) {
      console.warn("[API Client Cache] Horoscope read error:", cacheErr.message || cacheErr);
    }
  } else if (endpoint.startsWith("kundli")) {
    try {
      if (options.body) {
        const bodyObj = JSON.parse(options.body as string);
        const bData = bodyObj.birthData?.birthData || bodyObj.birthData || bodyObj;
        
        if (bData && bData.day && bData.month && bData.year) {
          const day = Number(bData.day);
          const month = Number(bData.month);
          const year = Number(bData.year);
          const hour = Number(bData.hour);
          const min = Number(bData.min);
          const lat = Number(parseFloat(bData.lat).toFixed(4));
          const lon = Number(parseFloat(bData.lon).toFixed(4));
          const tzone = Number(parseFloat(bData.tzone).toFixed(1));
          const gender = (bData.gender || 'male').toLowerCase();
          const language = (bodyObj.language || 'en').toLowerCase();

          console.log(`[API Client Cache] Checking Kundli for ${day}/${month}/${year} at ${hour}:${min}...`);

          const { data: existing } = await supabase
            .from('kundlis')
            .select('*')
            .eq('day', day)
            .eq('month', month)
            .eq('year', year)
            .eq('hour', hour)
            .eq('min', min)
            .eq('lat', lat)
            .eq('lon', lon)
            .eq('tzone', tzone)
            .eq('gender', gender)
            .eq('language', language)
            .maybeSingle();

          if (existing && existing.data) {
            console.log(`[API Client Cache] HIT for Kundli!`);
            return existing.data;
          }

          cacheKey = "kundli";
          parsedParams = { day, month, year, hour, min, lat, lon, tzone, gender, language };
        }
      }
    } catch (cacheErr: any) {
      console.warn("[API Client Cache] Kundli read error:", cacheErr.message || cacheErr);
    }
  } else if (endpoint.startsWith("choghadiya")) {
    try {
      let day = new Date().getDate();
      let month = new Date().getMonth() + 1;
      let year = new Date().getFullYear();
      let lat = 28.6139;
      let lon = 77.2090;
      let tzone = 5.5;

      if (options.body) {
        const bodyObj = JSON.parse(options.body as string);
        if (bodyObj.day) day = Number(bodyObj.day);
        if (bodyObj.month) month = Number(bodyObj.month);
        if (bodyObj.year) year = Number(bodyObj.year);
        if (bodyObj.lat) lat = Number(bodyObj.lat);
        if (bodyObj.lon) lon = Number(bodyObj.lon);
        if (bodyObj.tzone) tzone = Number(bodyObj.tzone);
      }

      const referenceDateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const latFixed = Number(lat.toFixed(1));
      const lonFixed = Number(lon.toFixed(1));
      const tzoneFixed = Number(tzone.toFixed(1));

      console.log(`[API Client Cache] Checking Choghadiya for date ${referenceDateStr} at Lat: ${latFixed}, Lon: ${lonFixed}...`);

      const { data: existing } = await supabase
        .from('choghadiyas')
        .select('*')
        .eq('reference_date', referenceDateStr)
        .eq('lat', latFixed)
        .eq('lon', lonFixed)
        .eq('tzone', tzoneFixed)
        .maybeSingle();

      if (existing && existing.data) {
        console.log(`[API Client Cache] HIT for Choghadiya!`);
        return existing.data;
      }

      console.log(`[API Client Cache] Miss for Choghadiya, fetching directly from FreeAstrologyAPI...`);

      const res = await fetch("https://json.freeastrologyapi.com/choghadiya-timings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "lroMrRAr4a9O8x3MP7cek3yR9kVvOuVb8wr35hVy"
        },
        body: JSON.stringify({
          year,
          month,
          date: day,
          hours: 12,
          minutes: 0,
          seconds: 0,
          latitude: latFixed,
          longitude: lonFixed,
          timezone: tzoneFixed,
          observation_point: 'topocentric'
        })
      });

      if (!res.ok) {
        throw new Error(`FreeAstrologyAPI HTTP ${res.status}`);
      }

      const apiData = await res.json();
      if (!apiData || !apiData.output) {
        throw new Error("Invalid response format from FreeAstrologyAPI");
      }

      const output = typeof apiData.output === 'string' ? JSON.parse(apiData.output) : apiData.output;
      
      const formatTimePart = (dateTimeStr: string) => {
        if (!dateTimeStr) return '00:00:00';
        const parts = dateTimeStr.split(' ');
        const timePart = parts[1] || '00:00:00';
        return timePart.split('.')[0]; // remove milliseconds
      };

      const daySlots = [];
      for (let i = 1; i <= 8; i++) {
        const slot = (output as any)[String(i)];
        if (slot) {
          daySlots.push({
            time: `${formatTimePart(slot.starts_at)} - ${formatTimePart(slot.ends_at)}`,
            muhurta: slot.name
          });
        }
      }

      const nightSlots = [];
      for (let i = 9; i <= 16; i++) {
        const slot = (output as any)[String(i)];
        if (slot) {
          nightSlots.push({
            time: `${formatTimePart(slot.starts_at)} - ${formatTimePart(slot.ends_at)}`,
            muhurta: slot.name
          });
        }
      }

      const resultData = {
        chaughadiya: {
          day: daySlots,
          night: nightSlots
        }
      };

      // Save cache asynchronously
      saveClientCache("choghadiya", { referenceDateStr, latFixed, lonFixed, tzoneFixed }, resultData).catch((saveErr) => {
        console.warn("[API Client Cache] Save failed:", saveErr.message || saveErr);
      });

      return resultData;

    } catch (cacheErr: any) {
      console.warn("[API Client Cache] Choghadiya direct fetch error:", cacheErr.message || cacheErr);
      throw cacheErr;
    }
  }

  // Perform health check validation first
  const isHealthy = await validateHealthCheck();
  if (!isHealthy) {
    console.warn("[API] Health check validation failed, but attempting request anyway...");
  }

  const urls = getAstroUrls(endpoint);
  let lastError: any = null;

  for (const url of urls) {
    const controller = new AbortController();
    const timeoutSeconds = 25;
    const timeoutId = setTimeout(() => controller.abort(), timeoutSeconds * 1000);

    try {
      console.log("[API] URL:", url);
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
      });
      clearTimeout(timeoutId);

      console.log("[API] Response Status:", res.status);

      if (!res.ok) {
        let errorText = await res.text();
        const trimmed = errorText.trim();
        if (trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html") || trimmed.startsWith("<pre>")) {
          errorText = res.statusText || "HTML Error Response";
        } else if (errorText.length > 200) {
          errorText = errorText.substring(0, 200) + "...";
        }
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const json = await res.json();
      
      // Extract data payload correctly
      const result = (json && typeof json === 'object' && (json as any).success !== undefined)
        ? (json as any).data
        : json;

      // Save to client-side Supabase cache asynchronously
      if (cacheKey && parsedParams) {
        saveClientCache(cacheKey, parsedParams, result).catch((saveErr) => {
          console.warn("[API Client Cache] Save failed:", saveErr.message || saveErr);
        });
      }

      return result;
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.warn("[API] Request failed:", error.message || error);
      
      // Customize message for timeout or abort errors
      if (error.name === "AbortError") {
        lastError = new Error(`Connection timeout after ${timeoutSeconds}s to: ${url}`);
      } else {
        lastError = error;
      }
    }
  }

  throw lastError || new Error(`Failed to request astrology endpoint: ${endpoint}`);
};

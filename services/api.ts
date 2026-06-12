import Constants from "expo-constants";

// Centralized API Base URL for Production
export const API_BASE_URL = "https://mantrapuja.com";

// Check if we are in production mode
export const IS_PROD = typeof __DEV__ !== 'undefined' ? !__DEV__ : process.env.NODE_ENV === 'production';

console.log("[API] Production API URL:", API_BASE_URL);
if (!IS_PROD) {
  console.log("[API] Running in DEVELOPMENT mode. Local/LAN hosts will be resolved.");
}

// Development Host Resolution
export const getBackendHosts = () => {
  const list = ["localhost:4000", "10.0.2.2:4000"];
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.hostUri;
  const ip = hostUri ? hostUri.split(":")[0] : null;
  if (ip) {
    list.unshift(`${ip}:4000`);
  }
  return list;
};

// Generate URLs for API requests
export const getAstroUrls = (endpoint: string) => {
  if (IS_PROD) {
    if (endpoint.startsWith("panchang")) {
      return [`${API_BASE_URL}/api/panchang`];
    }
    if (endpoint.startsWith("horoscope")) {
      return [`${API_BASE_URL}/api/${endpoint}`];
    }
    return [`${API_BASE_URL}/api/astrology/${endpoint}`];
  }
  const hosts = getBackendHosts();
  const list = hosts.map(host => `http://${host}/api/astrology/${endpoint}`);
  
  // Fallback to production URL in development mode if local backend is down
  if (endpoint.startsWith("panchang")) {
    list.push(`${API_BASE_URL}/api/panchang`);
  } else if (endpoint.startsWith("horoscope")) {
    list.push(`${API_BASE_URL}/api/${endpoint}`);
  } else {
    list.push(`${API_BASE_URL}/api/astrology/${endpoint}`);
  }
  return list;
};

/**
 * Validates the public health check endpoint before executing astrology requests.
 * Logs the results for debugging purposes.
 */
export const validateHealthCheck = async (): Promise<boolean> => {
  const healthUrls = IS_PROD 
    ? [`${API_BASE_URL}/api/health`] 
    : [
        ...getBackendHosts().map(host => `http://${host}/health`),
        `${API_BASE_URL}/api/health`
      ];

  console.log("[API] Performing health check validation...");
  
  for (const url of healthUrls) {
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
      console.error("[API] Health Check Error:", error.message || error);
    }
  }
  return false;
};

/**
 * Centralized fetch client wrapper for astrology APIs.
 * Includes health check validation, timeout handling, logging, and robust error translation.
 */
export const requestAstro = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
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
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText || res.statusText}`);
      }

      const json = await res.json();
      
      // If the response is wrapped in success/data (like Kundli or legacy endpoints)
      if (json && typeof json === 'object' && (json as any).success !== undefined) {
        if (!(json as any).success) {
          throw new Error((json as any).msg || (json as any).error || "Request succeeded but API returned success=false");
        }
        return (json as any).data;
      }

      // Otherwise return the JSON directly (for production flat endpoints like Panchang and Horoscope)
      return json;
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error("[API] Error:", error.message || error);
      
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

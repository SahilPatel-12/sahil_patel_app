import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

class MemoryStorage {
  private store: Record<string, string> = {};

  async getItem(key: string): Promise<string | null> {
    return this.store[key] || null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.store[key] = value;
  }

  async removeItem(key: string): Promise<void> {
    delete this.store[key];
  }
}

class WebLocalStorage {
  async getItem(key: string): Promise<string | null> {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return null;
  }

  async setItem(key: string, value: string): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  }

  async removeItem(key: string): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  }
}

// Fallback selector
let fallbackStorage = Platform.OS === 'web' ? new WebLocalStorage() : new MemoryStorage();

export const safeStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      const val = await AsyncStorage.getItem(key);
      return val;
    } catch (err) {
      console.warn('[SafeStorage] AsyncStorage.getItem failed, trying local fallback...', err instanceof Error ? err.message : String(err));
      return await fallbackStorage.getItem(key);
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (err) {
      console.warn('[SafeStorage] AsyncStorage.setItem failed, trying local fallback...', err instanceof Error ? err.message : String(err));
      await fallbackStorage.setItem(key, value);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (err) {
      console.warn('[SafeStorage] AsyncStorage.removeItem failed, trying local fallback...', err instanceof Error ? err.message : String(err));
      await fallbackStorage.removeItem(key);
    }
  }
};

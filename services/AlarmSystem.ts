import { NativeModules, Platform } from 'react-native';

const { MantraAlarmBridge } = NativeModules;

export interface AlarmConfig {
  id: string;
  label: string;
  musicId: string;
  downloadUrl: string;
  md5?: string;
  nextTrigger: number; // timestamp in ms
  repeatType: 'ONCE' | 'DAILY' | 'WEEKDAYS' | 'CUSTOM' | 'SUNRISE' | 'SUNSET' | 'MUHURTA';
  weekdaysMask: number; // Mon=2, Tue=4, Wed=8, etc.
  volume?: number; // 0.0 to 1.0
  fadeInDuration?: number; // seconds
  vibration?: boolean;
  flashlight?: boolean;
  autoDismissDuration?: number;
  snoozeDuration?: number;
  latitude?: number;
  longitude?: number;
}

export interface AlarmDetails extends Omit<AlarmConfig, 'downloadUrl' | 'md5'> {
  localFilePath: string;
  isDownloaded: boolean;
  enabled: boolean;
}

export const AlarmSystem = {
  isBridgeAvailable(): boolean {
    return Platform.OS === 'android' && !!MantraAlarmBridge;
  },

  async createAlarm(config: AlarmConfig): Promise<boolean> {
    if (!this.isBridgeAvailable()) return false;
    try {
      const payload = {
        volume: 1.0,
        fadeInDuration: 0,
        vibration: true,
        flashlight: false,
        autoDismissDuration: 15,
        snoozeDuration: 10,
        latitude: 0.0,
        longitude: 0.0,
        ...config
      };
      return await MantraAlarmBridge.createAlarm(JSON.stringify(payload));
    } catch (e) {
      console.error('Failed to create alarm', e);
      throw e;
    }
  },

  async updateAlarm(config: Partial<AlarmConfig> & { id: string }): Promise<boolean> {
    if (!this.isBridgeAvailable()) return false;
    try {
      return await MantraAlarmBridge.updateAlarm(JSON.stringify(config));
    } catch (e) {
      console.error('Failed to update alarm', e);
      throw e;
    }
  },

  async deleteAlarm(id: string): Promise<boolean> {
    if (!this.isBridgeAvailable()) return false;
    try {
      return await MantraAlarmBridge.deleteAlarm(id);
    } catch (e) {
      console.error('Failed to delete alarm', e);
      throw e;
    }
  },

  async enableAlarm(id: string, enabled: boolean): Promise<boolean> {
    if (!this.isBridgeAvailable()) return false;
    try {
      return await MantraAlarmBridge.enableAlarm(id, enabled);
    } catch (e) {
      console.error('Failed to toggle alarm status', e);
      throw e;
    }
  },

  async getAlarms(): Promise<AlarmDetails[]> {
    if (!this.isBridgeAvailable()) return [];
    try {
      return await MantraAlarmBridge.getAlarms();
    } catch (e) {
      console.error('Failed to get alarms list', e);
      return [];
    }
  },

  async isBatteryOptimizationIgnored(): Promise<boolean> {
    if (!this.isBridgeAvailable()) return true;
    try {
      return await MantraAlarmBridge.isBatteryOptimizationIgnored();
    } catch (e) {
      console.error(e);
      return true;
    }
  },

  async requestBatteryOptimizationWaiver(): Promise<void> {
    if (!this.isBridgeAvailable()) return;
    try {
      await MantraAlarmBridge.requestBatteryOptimizationWaiver();
    } catch (e) {
      console.error(e);
    }
  },

  async checkAlarmPermissions(): Promise<boolean> {
    if (!this.isBridgeAvailable()) return false;
    try {
      return await MantraAlarmBridge.checkAlarmPermissions();
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  async requestAlarmPermissions(): Promise<boolean> {
    if (!this.isBridgeAvailable()) return true;
    try {
      return await MantraAlarmBridge.requestAlarmPermissions();
    } catch (e) {
      console.error(e);
      return false;
    }
  }
};

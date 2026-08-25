import apiClient from './client';

export interface MediaSettingsStatus {
  googleApiKeyConfigured: boolean;
}

export const mediaApi = {
  getSettings: async () => {
    const { data } = await apiClient.get<MediaSettingsStatus>('/settings/media');
    return data;
  }
};


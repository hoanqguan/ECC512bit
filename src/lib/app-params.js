// Stub app-params for local/offline usage
export const appParams = {
  appId: 'local',
  token: null,
  fromUrl: typeof window !== 'undefined' ? window.location.href : '',
  functionsVersion: null,
  appBaseUrl: '',
};
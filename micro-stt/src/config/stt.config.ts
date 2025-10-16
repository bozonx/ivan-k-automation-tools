export interface SttConfig {
  defaultProvider: string;
  allowedProviders: string[];
  maxFileMb: number;
  requestTimeoutSec: number;
  pollIntervalMs: number;
  maxSyncWaitMin: number;
  allowCustomApiKey: boolean;
  assemblyAiApiKey?: string;
}

export const loadSttConfig = (): SttConfig => {
  return {
    defaultProvider: process.env.STT_DEFAULT_PROVIDER || 'assemblyai',
    allowedProviders: (process.env.STT_ALLOWED_PROVIDERS || 'assemblyai')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    maxFileMb: parseInt(process.env.STT_MAX_FILE_MB || '100', 10),
    requestTimeoutSec: parseInt(process.env.STT_REQUEST_TIMEOUT_SEC || '15', 10),
    pollIntervalMs: parseInt(process.env.STT_POLL_INTERVAL_MS || '1500', 10),
    maxSyncWaitMin: parseInt(process.env.STT_MAX_SYNC_WAIT_MIN || '3', 10),
    allowCustomApiKey: (process.env.ALLOW_CUSTOM_API_KEY || 'false') === 'true',
    assemblyAiApiKey: process.env.ASSEMBLYAI_API_KEY,
  };
};

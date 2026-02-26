const now = (): string => new Date().toISOString();

export const logInfo = (message: string, meta?: Record<string, unknown>): void => {
  if (meta) {
    console.log(`[${now()}] INFO ${message}`, meta);
    return;
  }
  console.log(`[${now()}] INFO ${message}`);
};

export const logWarn = (message: string, meta?: Record<string, unknown>): void => {
  if (meta) {
    console.warn(`[${now()}] WARN ${message}`, meta);
    return;
  }
  console.warn(`[${now()}] WARN ${message}`);
};

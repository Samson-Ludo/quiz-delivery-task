const now = () => new Date().toISOString();
export const logInfo = (message, meta) => {
    if (meta) {
        console.log(`[${now()}] INFO ${message}`, meta);
        return;
    }
    console.log(`[${now()}] INFO ${message}`);
};
export const logWarn = (message, meta) => {
    if (meta) {
        console.warn(`[${now()}] WARN ${message}`, meta);
        return;
    }
    console.warn(`[${now()}] WARN ${message}`);
};

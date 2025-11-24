
// OFFLINE SERVICE
// Manages local caching and network resilience

class OfflineService {
    private isOnlineVal: boolean = navigator.onLine;
    private cachePrefix = 'architex_cache_';

    constructor() {
        window.addEventListener('online', () => {
            this.isOnlineVal = true;
            console.log("[OfflineService] Connection Restored. Syncing...");
            this.sync();
        });
        window.addEventListener('offline', () => {
            this.isOnlineVal = false;
            console.warn("[OfflineService] Connection Lost. Entering Offline Mode.");
        });
    }

    public isOnline(): boolean {
        return this.isOnlineVal;
    }

    public saveToCache<T>(key: string, data: T): void {
        try {
            localStorage.setItem(`${this.cachePrefix}${key}`, JSON.stringify({
                timestamp: Date.now(),
                data: data
            }));
        } catch (e) {
            console.warn("[OfflineService] Quota exceeded or storage error", e);
        }
    }

    public getFromCache<T>(key: string): T | null {
        try {
            const raw = localStorage.getItem(`${this.cachePrefix}${key}`);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            // In a real app, we might check timestamp validity here
            return parsed.data as T;
        } catch (e) {
            return null;
        }
    }

    /**
     * Wraps an async fetch function with offline resilience.
     * If online -> fetch and cache.
     * If offline -> return cache.
     */
    public async wrapFetch<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
        if (this.isOnlineVal) {
            try {
                const data = await fetchFn();
                this.saveToCache(key, data);
                return data;
            } catch (e) {
                console.warn("[OfflineService] Fetch failed, falling back to cache", e);
                const cached = this.getFromCache<T>(key);
                if (cached) return cached;
                throw e;
            }
        } else {
            console.log(`[OfflineService] Returning cached data for ${key}`);
            const cached = this.getFromCache<T>(key);
            if (cached) return cached;
            throw new Error("No offline data available");
        }
    }

    private sync() {
        // Placeholder for syncing pending write actions
        // e.g. queued orders, messages
    }
}

export const offlineService = new OfflineService();

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface ApiKey {
    id: string;
    name: string;              // e.g. "Personal Key", "Project Alpha"
    key: string;
    usageCount: number;
    isRateLimited: boolean;
    rateLimitUntil?: number;   // timestamp when rate limit expires
}

export interface FeatureModelConfig {
    featureId: string;         // e.g. 'chatbot', 'live_conversation', etc.
    modelId: string;           // which Gemini model to use
    apiKeyId: string | 'auto'; // 'auto' = use smart rotating key
}

interface ApiKeyContextType {
    apiKeys: ApiKey[];
    featureConfigs: FeatureModelConfig[];
    addApiKey: (name: string, key: string) => void;
    removeApiKey: (id: string) => void;
    updateApiKey: (id: string, updates: Partial<Omit<ApiKey, 'id'>>) => void;
    getActiveApiKey: (featureId?: string) => string | null;
    markKeyAsRateLimited: (keyId: string) => void;
    setFeatureConfig: (featureId: string, modelId: string, apiKeyId: string) => void;
    getFeatureConfig: (featureId: string, defaultModel: string) => { modelId: string; apiKeyId: string };
}

const ApiKeyContext = createContext<ApiKeyContextType | null>(null);

const STORAGE_KEY = 'gemini_api_keys_v2';
const FEATURE_CONFIG_KEY = 'gemini_feature_configs_v2';

const DEFAULT_FEATURE_CONFIGS: FeatureModelConfig[] = [
    { featureId: 'chatbot',            modelId: 'gemini-2.5-flash',    apiKeyId: 'auto' },
    { featureId: 'fast_chat',          modelId: 'gemini-2.5-flash-lite', apiKeyId: 'auto' },
    { featureId: 'live_conversation',  modelId: 'gemini-2.5-flash-native-audio-preview-09-2025', apiKeyId: 'auto' },
    { featureId: 'image_generator',   modelId: 'imagen-4.0-generate-001', apiKeyId: 'auto' },
    { featureId: 'image_editor',      modelId: 'gemini-2.5-flash-image', apiKeyId: 'auto' },
    { featureId: 'image_analyzer',    modelId: 'gemini-2.5-flash',    apiKeyId: 'auto' },
    { featureId: 'grounding_search',  modelId: 'gemini-2.5-flash',    apiKeyId: 'auto' },
    { featureId: 'text_to_speech',    modelId: 'gemini-2.5-flash-preview-tts', apiKeyId: 'auto' },
    { featureId: 'audio_transcriber', modelId: 'gemini-2.5-flash',    apiKeyId: 'auto' },
    { featureId: 'complex_task',      modelId: 'gemini-2.5-pro',      apiKeyId: 'auto' },
    { featureId: 'document_processor',modelId: 'gemini-2.5-pro',      apiKeyId: 'auto' },
    { featureId: 'video_analyzer',    modelId: 'gemini-2.5-pro',      apiKeyId: 'auto' },
    { featureId: 'floating_chat',     modelId: 'gemini-2.5-flash',    apiKeyId: 'auto' },
    { featureId: 'workflow',          modelId: 'gemini-2.5-pro',      apiKeyId: 'auto' },
];

export const ApiKeyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [apiKeys, setApiKeys] = useState<ApiKey[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) return JSON.parse(stored);
        } catch { /* ignore */ }
        
        // Seed with env key if available
        const envKey = process.env.API_KEY || '';
        if (envKey) {
            return [{
                id: 'env_default',
                name: 'Default Key (.env)',
                key: envKey,
                usageCount: 0,
                isRateLimited: false,
            }];
        }
        return [];
    });

    const [featureConfigs, setFeatureConfigs] = useState<FeatureModelConfig[]>(() => {
        try {
            const stored = localStorage.getItem(FEATURE_CONFIG_KEY);
            if (stored) {
                const parsed: FeatureModelConfig[] = JSON.parse(stored);
                // Merge with defaults (add any new features)
                const merged = [...DEFAULT_FEATURE_CONFIGS];
                parsed.forEach(saved => {
                    const idx = merged.findIndex(d => d.featureId === saved.featureId);
                    if (idx >= 0) merged[idx] = saved;
                });
                return merged;
            }
        } catch { /* ignore */ }
        return DEFAULT_FEATURE_CONFIGS;
    });

    // Persist to localStorage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(apiKeys));
    }, [apiKeys]);

    useEffect(() => {
        localStorage.setItem(FEATURE_CONFIG_KEY, JSON.stringify(featureConfigs));
    }, [featureConfigs]);

    const addApiKey = useCallback((name: string, key: string) => {
        const id = `key_${Date.now()}`;
        setApiKeys(prev => [...prev, { id, name, key, usageCount: 0, isRateLimited: false }]);
    }, []);

    const removeApiKey = useCallback((id: string) => {
        setApiKeys(prev => prev.filter(k => k.id !== id));
    }, []);

    const updateApiKey = useCallback((id: string, updates: Partial<Omit<ApiKey, 'id'>>) => {
        setApiKeys(prev => prev.map(k => k.id === id ? { ...k, ...updates } : k));
    }, []);

    const markKeyAsRateLimited = useCallback((keyId: string) => {
        // Mark as rate limited for 60 seconds
        const limitUntil = Date.now() + 60_000;
        setApiKeys(prev => prev.map(k => 
            k.id === keyId 
                ? { ...k, isRateLimited: true, rateLimitUntil: limitUntil }
                : k
        ));
        // Auto-clear after 60s
        setTimeout(() => {
            setApiKeys(prev => prev.map(k => 
                k.id === keyId ? { ...k, isRateLimited: false, rateLimitUntil: undefined } : k
            ));
        }, 60_000);
    }, []);

    const getActiveApiKey = useCallback((featureId?: string): string | null => {
        if (apiKeys.length === 0) return null;

        const now = Date.now();
        
        // Check if feature has a specific key assigned
        if (featureId) {
            const config = featureConfigs.find(f => f.featureId === featureId);
            if (config && config.apiKeyId !== 'auto') {
                const specificKey = apiKeys.find(k => k.id === config.apiKeyId && (!k.isRateLimited || (k.rateLimitUntil && now > k.rateLimitUntil)));
                if (specificKey) {
                    // Increment usage
                    setApiKeys(prev => prev.map(k => k.id === specificKey.id ? { ...k, usageCount: k.usageCount + 1 } : k));
                    return specificKey.key;
                }
            }
        }

        // Auto mode: find first non-rate-limited key with lowest usage
        const available = apiKeys
            .filter(k => !k.isRateLimited || (k.rateLimitUntil && now > k.rateLimitUntil))
            .sort((a, b) => a.usageCount - b.usageCount);

        if (available.length === 0) return null;
        const chosen = available[0];
        setApiKeys(prev => prev.map(k => k.id === chosen.id ? { ...k, usageCount: k.usageCount + 1 } : k));
        return chosen.key;
    }, [apiKeys, featureConfigs]);

    const setFeatureConfig = useCallback((featureId: string, modelId: string, apiKeyId: string) => {
        setFeatureConfigs(prev => {
            const idx = prev.findIndex(f => f.featureId === featureId);
            if (idx >= 0) {
                const updated = [...prev];
                updated[idx] = { featureId, modelId, apiKeyId };
                return updated;
            }
            return [...prev, { featureId, modelId, apiKeyId }];
        });
    }, []);

    const getFeatureConfig = useCallback((featureId: string, defaultModel: string): { modelId: string; apiKeyId: string } => {
        const config = featureConfigs.find(f => f.featureId === featureId);
        return {
            modelId: config?.modelId || defaultModel,
            apiKeyId: config?.apiKeyId || 'auto',
        };
    }, [featureConfigs]);

    return (
        <ApiKeyContext.Provider value={{
            apiKeys,
            featureConfigs,
            addApiKey,
            removeApiKey,
            updateApiKey,
            getActiveApiKey,
            markKeyAsRateLimited,
            setFeatureConfig,
            getFeatureConfig,
        }}>
            {children}
        </ApiKeyContext.Provider>
    );
};

export const useApiKeys = (): ApiKeyContextType => {
    const ctx = useContext(ApiKeyContext);
    if (!ctx) throw new Error('useApiKeys must be used within ApiKeyProvider');
    return ctx;
};

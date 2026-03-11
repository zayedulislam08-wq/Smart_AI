import re

filepath = 'services/geminiService.ts'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace all occurrences of destructuring and trackModelUsage
content = re.sub(
    r'const \{\s*ai,\s*model\s*\} = getAiForFeature\((.*?)\);\s*trackModelUsage\(model\);',
    r'const { ai, model, keyId } = getAiForFeature(\1);\n    trackModelUsage(model, keyId);',
    content
)

# Replace trackModelUsage definition
old_tracker_def = """export const trackModelUsage = (model: string) => {
    const today = new Date().toISOString().split('T')[0];
    const trackingKey = `gemini_usage_${today}`;
    
    try {
        const stored = localStorage.getItem(trackingKey);
        const usageData = stored ? JSON.parse(stored) : {};
        usageData[model] = (usageData[model] || 0) + 1;
        localStorage.setItem(trackingKey, JSON.stringify(usageData));
    } catch(e) {
        console.error("Failed to track model usage", e);
    }
};"""

new_tracker_def = """import { GEMINI_MODELS, ApiKeyConfig } from '../constants';

export const trackModelUsage = (model: string, keyId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const trackingKey = `gemini_usage_${today}_${keyId}`;
    
    try {
        const stored = localStorage.getItem(trackingKey);
        const usageData = stored ? JSON.parse(stored) : {};
        usageData[model] = (usageData[model] || 0) + 1;
        localStorage.setItem(trackingKey, JSON.stringify(usageData));
        
        // Broadcast usage event for Header/Dashboard mapping
        window.dispatchEvent(new CustomEvent('gemini-usage-update', { 
            detail: { model, keyId }
        }));
    } catch(e) {
        console.error("Failed to track model usage", e);
    }
};"""

content = content.replace(old_tracker_def, new_tracker_def)

# Replace getAiForFeature definition
old_get_ai = """const getAiForFeature = (featureId: string, fallbackModel: string) => {
    let apiKey = '';
    let customModel = fallbackModel;
    
    // API KEY RESOLUTION
    const storedKeys = localStorage.getItem('gemini_api_keys_by_feature');
    if (storedKeys) {
        try {
            const keysObj = JSON.parse(storedKeys);
            if (keysObj[featureId] && keysObj[featureId].trim() !== '') {
                apiKey = keysObj[featureId].trim();
            }
        } catch (e) {
            console.error("Failed to parse gemini_api_keys_by_feature from localStorage");
        }
    }
    
    // MODEL RESOLUTION
    const storedModels = localStorage.getItem('gemini_models_by_feature');
    if (storedModels) {
        try {
            const modelsObj = JSON.parse(storedModels);
            if (modelsObj[featureId] && modelsObj[featureId].trim() !== '') {
                customModel = modelsObj[featureId].trim();
            }
        } catch (e) {
            console.error("Failed to parse gemini_models_by_feature from localStorage");
        }
    }
    
    if (!apiKey) {
        apiKey = localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY;
    }

    if (!apiKey) {
        throw new Error(`API Key is missing for feature ${featureId}. Please set it in Settings or via VITE_GEMINI_API_KEY environment variable.`);
    }
    return { ai: new GoogleGenAI({ apiKey }), model: customModel };
};"""

new_get_ai = """const getAiForFeature = (featureId: string, fallbackModel: string) => {
    let customKey = '';
    let customModel = fallbackModel;
    
    // 1. Get Custom Feature Key
    const storedKeys = localStorage.getItem('gemini_api_keys_by_feature');
    if (storedKeys) {
        try {
            const keysObj = JSON.parse(storedKeys);
            if (keysObj[featureId] && keysObj[featureId].trim() !== '') {
                customKey = keysObj[featureId].trim();
            }
        } catch (e) {}
    }
    
    // 2. Get Custom Feature Model
    const storedModels = localStorage.getItem('gemini_models_by_feature');
    if (storedModels) {
        try {
            const modelsObj = JSON.parse(storedModels);
            if (modelsObj[featureId] && modelsObj[featureId].trim() !== '') {
                customModel = modelsObj[featureId].trim();
            }
        } catch (e) {}
    }
    
    // 3. Gather Available Keys
    const allKeys: ApiKeyConfig[] = [];
    if (customKey) {
        allKeys.push({ id: `custom_${featureId}`, name: `Feature: ${featureId}`, key: customKey });
    }
    
    const storedConfigs = localStorage.getItem('gemini_api_configs');
    if (storedConfigs) {
        try {
            const globalKeys = JSON.parse(storedConfigs).filter((k: ApiKeyConfig) => k.key.trim() !== '');
            allKeys.push(...globalKeys);
        } catch (e) {}
    }
    
    const legacyGlobalKey = localStorage.getItem('gemini_api_key');
    if (legacyGlobalKey) allKeys.push({ id: 'legacy_global', name: 'Legacy Default', key: legacyGlobalKey });
    
    const envKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (envKey) allKeys.push({ id: 'env_default', name: 'ENV Default', key: envKey });
    
    const uniqueKeysMap = new Map();
    for (const k of allKeys) {
        if (!uniqueKeysMap.has(k.key)) uniqueKeysMap.set(k.key, k);
    }
    const availableKeys = Array.from(uniqueKeysMap.values());
    
    if (availableKeys.length === 0) {
        throw new Error(`No API Keys found to execute feature: ${featureId}. Please add keys in Settings.`);
    }

    // 4. Build Model Chain (Target first, then logical fallbacks)
    const modelChain = [customModel];
    if (!customModel.includes('imagen') && !customModel.includes('veo') && !customModel.includes('audio')) {
        if (customModel !== 'gemini-3.1-flash-lite') modelChain.push('gemini-3.1-flash-lite');
        if (customModel !== 'gemini-3-flash') modelChain.push('gemini-3-flash');
        if (customModel !== 'gemini-2.5-flash') modelChain.push('gemini-2.5-flash');
        if (customModel !== 'gemini-2.5-flash-lite') modelChain.push('gemini-2.5-flash-lite');
    }
    
    // 5. Smart Routing Logic - try finding a Model+Key pair not exhausted
    const today = new Date().toISOString().split('T')[0];
    
    for (const model of modelChain) {
        let rpdLimit: number | 'Unlimited' = 20; // safe default fallback
        if (GEMINI_MODELS[model]) {
            rpdLimit = GEMINI_MODELS[model].limits.rpd;
        }

        for (const keyConfig of availableKeys) {
            if (rpdLimit === 'Unlimited') {
                return { ai: new GoogleGenAI({ apiKey: keyConfig.key }), model, keyId: keyConfig.id, keyName: keyConfig.name };
            }
            
            const trackingKey = `gemini_usage_${today}_${keyConfig.id}`;
            let usageCount = 0;
            try {
                const stored = localStorage.getItem(trackingKey);
                if (stored) {
                    usageCount = JSON.parse(stored)[model] || 0;
                }
            } catch (e) {}
            
            // Auto-switch if within 2 requests of hitting the limit
            if (usageCount < (Number(rpdLimit) - 2)) {
                return { ai: new GoogleGenAI({ apiKey: keyConfig.key }), model, keyId: keyConfig.id, keyName: keyConfig.name };
            }
        }
    }
    
    // 6. If ALL exhausted, return the first key and primary target model anyway. Let the API 429 happen.
    return { ai: new GoogleGenAI({ apiKey: availableKeys[0].key }), model: customModel, keyId: availableKeys[0].id, keyName: availableKeys[0].name };
};"""

content = content.replace(old_get_ai, new_get_ai)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("geminiService.ts refactored successfully")

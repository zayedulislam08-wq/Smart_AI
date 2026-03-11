import React, { useState } from 'react';
import { useApiKeys, type ApiKey } from '../contexts/ApiKeyContext';
import { GEMINI_MODELS } from '../constants';
import { SettingsIcon } from './icons/Icons';

// ─── Icons ──────────────────────────────────────────────────────────────────
const KeyIcon: React.FC<{ className?: string }> = (p) => (
    <svg {...p} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
);
const EyeIcon: React.FC<{ className?: string }> = (p) => (
    <svg {...p} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);
const EyeOffIcon: React.FC<{ className?: string }> = (p) => (
    <svg {...p} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
);
const PlusIcon: React.FC<{ className?: string }> = (p) => (
    <svg {...p} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);
const TrashIcon: React.FC<{ className?: string }> = (p) => (
    <svg {...p} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);
const SaveIcon: React.FC<{ className?: string }> = (p) => (
    <svg {...p} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
    </svg>
);
const CheckCircleIcon: React.FC<{ className?: string }> = (p) => (
    <svg {...p} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const ShieldIcon: React.FC<{ className?: string }> = (p) => (
    <svg {...p} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
);

// ─── All models for dropdown ─────────────────────────────────────────────────
const ALL_MODELS = Object.values(GEMINI_MODELS);

// ─── Feature labels ──────────────────────────────────────────────────────────
const FEATURES = [
    { id: 'chatbot',             label: 'AI Chatbot',             defaultModel: 'gemini-2.5-flash' },
    { id: 'fast_chat',           label: 'Low-Latency Chat',       defaultModel: 'gemini-2.5-flash-lite' },
    { id: 'live_conversation',   label: 'Live Conversation',      defaultModel: 'gemini-2.5-flash-native-audio-preview-09-2025' },
    { id: 'image_generator',     label: 'Image Generation',       defaultModel: 'imagen-4.0-generate-001' },
    { id: 'image_editor',        label: 'Image Editor',           defaultModel: 'gemini-2.5-flash-image' },
    { id: 'image_analyzer',      label: 'Image Analyzer',         defaultModel: 'gemini-2.5-flash' },
    { id: 'grounding_search',    label: 'Web & Maps Search',      defaultModel: 'gemini-2.5-flash' },
    { id: 'text_to_speech',      label: 'Text-to-Speech',         defaultModel: 'gemini-2.5-flash-preview-tts' },
    { id: 'audio_transcriber',   label: 'Audio Transcription',    defaultModel: 'gemini-2.5-flash' },
    { id: 'complex_task',        label: 'Thinking Mode',          defaultModel: 'gemini-2.5-pro' },
    { id: 'document_processor',  label: 'Document Processor',     defaultModel: 'gemini-2.5-pro' },
    { id: 'video_analyzer',      label: 'Video Analyzer',         defaultModel: 'gemini-2.5-pro' },
    { id: 'floating_chat',       label: 'Floating Chat',          defaultModel: 'gemini-2.5-flash' },
    { id: 'workflow',            label: 'Workflow Builder',        defaultModel: 'gemini-2.5-pro' },
];

// ─── API Key Card ─────────────────────────────────────────────────────────────
const ApiKeyCard: React.FC<{ apiKey: ApiKey; onRemove: () => void; onRename: (name: string) => void }> = ({ apiKey, onRemove, onRename }) => {
    const [showKey, setShowKey] = useState(false);
    const [editing, setEditing] = useState(false);
    const [nameInput, setNameInput] = useState(apiKey.name);
    const masked = apiKey.key.length > 12
        ? `${apiKey.key.slice(0, 8)}${'•'.repeat(20)}${apiKey.key.slice(-4)}`
        : '•'.repeat(apiKey.key.length);

    const handleRename = () => {
        if (nameInput.trim()) onRename(nameInput.trim());
        setEditing(false);
    };

    return (
        <div className={`rounded-2xl border p-4 flex flex-col gap-3 transition-all ${apiKey.isRateLimited
            ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10'
            : 'border-gray-200 dark:border-white/10 bg-white dark:bg-[#111]'}`}>

            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${apiKey.isRateLimited ? 'bg-red-500' : 'bg-blue-500'}`}>
                        <KeyIcon className="w-4 h-4 text-white" />
                    </div>
                    {editing ? (
                        <input autoFocus
                            className="text-sm font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 border border-blue-400 rounded-lg px-2 py-1 outline-none w-44"
                            value={nameInput}
                            onChange={e => setNameInput(e.target.value)}
                            onBlur={handleRename}
                            onKeyDown={e => e.key === 'Enter' && handleRename()}
                        />
                    ) : (
                        <button onClick={() => setEditing(true)} className="text-sm font-semibold text-gray-900 dark:text-white hover:text-blue-500 transition-colors text-left truncate" title="Click to rename">
                            {apiKey.name}
                        </button>
                    )}
                    {apiKey.isRateLimited && (
                        <span className="text-[10px] bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-full font-bold shrink-0">RATE LIMITED</span>
                    )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[11px] text-gray-400 tabular-nums">{apiKey.usageCount} calls</span>
                    <button onClick={() => setShowKey(!showKey)} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition-colors">
                        {showKey ? <EyeOffIcon className="w-4 h-4"/> : <EyeIcon className="w-4 h-4"/>}
                    </button>
                    <button onClick={onRemove} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors">
                        <TrashIcon className="w-4 h-4"/>
                    </button>
                </div>
            </div>

            <div className="font-mono text-xs bg-gray-100 dark:bg-gray-900 rounded-xl px-3 py-2 text-gray-500 dark:text-gray-400 break-all select-all">
                {showKey ? apiKey.key : masked}
            </div>
        </div>
    );
};

// ─── Settings Page ────────────────────────────────────────────────────────────
export const Settings: React.FC = () => {
    const { apiKeys, addApiKey, removeApiKey, updateApiKey, featureConfigs, setFeatureConfig } = useApiKeys();

    // Local draft state for model config (committed on Save)
    const [draft, setDraft] = useState<Record<string, { modelId: string; apiKeyId: string }>>(() => {
        const out: Record<string, { modelId: string; apiKeyId: string }> = {};
        FEATURES.forEach(f => {
            const cfg = featureConfigs.find(c => c.featureId === f.id);
            out[f.id] = { modelId: cfg?.modelId || f.defaultModel, apiKeyId: cfg?.apiKeyId || 'auto' };
        });
        return out;
    });

    const [newKeyName, setNewKeyName] = useState('');
    const [newKeyValue, setNewKeyValue] = useState('');
    const [addError, setAddError] = useState('');
    const [activeTab, setActiveTab] = useState<'keys' | 'models'>('keys');
    const [saveState, setSaveState] = useState<'idle' | 'saved'>('idle');

    const hasActiveKey = apiKeys.some(k => !k.isRateLimited);

    const handleAddKey = () => {
        if (!newKeyName.trim()) { setAddError('Please enter a name for this key.'); return; }
        if (!newKeyValue.trim() || !newKeyValue.startsWith('AIza')) { setAddError('Invalid API key. Keys start with "AIza".'); return; }
        addApiKey(newKeyName.trim(), newKeyValue.trim());
        setNewKeyName(''); setNewKeyValue(''); setAddError('');
    };

    const handleSaveModelConfig = () => {
        Object.entries(draft).forEach(([featureId, cfg]) => {
            setFeatureConfig(featureId, cfg.modelId, cfg.apiKeyId);
        });
        setSaveState('saved');
        setTimeout(() => setSaveState('idle'), 3000);
    };

    const Tab: React.FC<{ id: 'keys' | 'models'; label: string }> = ({ id, label }) => (
        <button onClick={() => setActiveTab(id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === id
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}>
            {label}
        </button>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-10">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                    <SettingsIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Settings & Configuration</h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Manage API keys, models, and smart routing</p>
                </div>
            </div>

            {/* Status Banner */}
            <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium ${hasActiveKey
                ? 'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                : 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'}`}>
                <ShieldIcon className="w-4 h-4 shrink-0" />
                {hasActiveKey
                    ? `✓ ${apiKeys.filter(k => !k.isRateLimited).length} active API key(s) — Smart rotation enabled`
                    : '✗ No active API key. Add one below to use AI features.'}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-white/5 rounded-2xl w-fit">
                <Tab id="keys" label={`API Keys (${apiKeys.length})`} />
                <Tab id="models" label="Model Config" />
            </div>

            {/* ── API KEYS TAB ── */}
            {activeTab === 'keys' && (
                <div className="space-y-4">
                    {/* Add New Key Form */}
                    <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-white/10 p-5 space-y-4">
                        <h2 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                            <PlusIcon className="w-4 h-4 text-blue-500" /> Add New API Key
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input
                                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                placeholder='Key name (e.g. "Personal Key")'
                                value={newKeyName}
                                onChange={e => { setNewKeyName(e.target.value); setAddError(''); }}
                            />
                            <input
                                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-mono"
                                placeholder="AIzaSy... (Gemini API key)"
                                value={newKeyValue}
                                onChange={e => { setNewKeyValue(e.target.value); setAddError(''); }}
                                onKeyDown={e => e.key === 'Enter' && handleAddKey()}
                            />
                        </div>
                        {addError && <p className="text-xs text-red-500">{addError}</p>}
                        <div className="flex items-center gap-3 flex-wrap">
                            <button onClick={handleAddKey}
                                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all hover:scale-105 active:scale-95 shadow-md shadow-blue-500/20">
                                <PlusIcon className="w-4 h-4" /> Add Key
                            </button>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500">
                                Get free key at{' '}
                                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">aistudio.google.com</a>
                                {' '}— auto-rotates on rate limit.
                            </p>
                        </div>
                    </div>

                    {/* Existing Keys */}
                    {apiKeys.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 dark:text-gray-600">
                            <KeyIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">No API keys yet. Add one above.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {apiKeys.map(k => (
                                <ApiKeyCard key={k.id} apiKey={k} onRemove={() => removeApiKey(k.id)} onRename={name => updateApiKey(k.id, { name })} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── MODEL CONFIG TAB ── */}
            {activeTab === 'models' && (
                <div className="space-y-4">
                    {/* Toast notification */}
                    {saveState === 'saved' && (
                        <div className="flex items-center gap-2 px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl text-green-700 dark:text-green-400 text-sm font-medium animate-in slide-in-from-top-2 duration-300">
                            <CheckCircleIcon className="w-4 h-4 shrink-0" />
                            ✓ Model configuration saved successfully!
                        </div>
                    )}

                    <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 dark:border-white/5">
                            <h2 className="font-bold text-gray-900 dark:text-white text-sm">Per-Feature Model & API Key</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">All {ALL_MODELS.length} available Gemini models are shown for each feature.</p>
                        </div>
                        <div className="divide-y divide-gray-50 dark:divide-white/5">
                            {FEATURES.map(f => {
                                const current = draft[f.id] || { modelId: f.defaultModel, apiKeyId: 'auto' };
                                return (
                                    <div key={f.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-white/2 transition-colors">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{f.label}</p>
                                            <p className="text-[11px] text-gray-400 truncate">{current.modelId}</p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                                            {/* ALL models dropdown */}
                                            <select
                                                value={current.modelId}
                                                onChange={e => setDraft(prev => ({ ...prev, [f.id]: { ...current, modelId: e.target.value } }))}
                                                className="text-xs bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium max-w-[200px]"
                                            >
                                                {ALL_MODELS.map(m => (
                                                    <option key={m.id} value={m.id}>{m.label}</option>
                                                ))}
                                            </select>
                                            {/* API Key selector */}
                                            <select
                                                value={current.apiKeyId}
                                                onChange={e => setDraft(prev => ({ ...prev, [f.id]: { ...current, apiKeyId: e.target.value } }))}
                                                className="text-xs bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="auto">🔄 Auto Rotation</option>
                                                {apiKeys.map(k => (
                                                    <option key={k.id} value={k.id}>{k.name}{k.isRateLimited ? ' ⚠️' : ''}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end">
                        <button
                            onClick={handleSaveModelConfig}
                            className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95 ${
                                saveState === 'saved'
                                    ? 'bg-green-500 text-white shadow-green-500/30'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                            }`}
                        >
                            {saveState === 'saved'
                                ? <><CheckCircleIcon className="w-4 h-4" /> Saved!</>
                                : <><SaveIcon className="w-4 h-4" /> Save Model Config</>
                            }
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

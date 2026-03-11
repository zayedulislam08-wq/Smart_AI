import React, { useState, useCallback } from 'react';
import { SERVICES, GEMINI_MODELS, ServiceId } from '../constants';
import { generateContent, generateImage } from '../services/geminiService';
import { useApiKeys } from '../contexts/ApiKeyContext';
import { LoadingSpinner } from './common/LoadingSpinner';

// ─── Icons ─────────────────────────────────────────────────────────────────
const AppsIcon: React.FC<{ className?: string }> = (p) => (
    <svg {...p} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
);
const ChevronDownIcon: React.FC<{ className?: string }> = (p) => (
    <svg {...p} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);
const CloseIcon: React.FC<{ className?: string }> = (p) => (
    <svg {...p} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);
const SendIcon: React.FC<{ className?: string }> = (p) => (
    <svg {...p} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
);

const ALL_MODELS = Object.values(GEMINI_MODELS);

// Text-capable models
const TEXT_MODELS = ALL_MODELS.filter(m =>
    !m.id.includes('imagen') && !m.id.includes('veo') && !m.id.includes('tts') &&
    !m.id.includes('-image') && !m.id.includes('audio-preview') && !m.id.includes('embedding')
);

// Image-capable models
const IMAGE_MODELS = ALL_MODELS.filter(m => m.id.includes('imagen') || m.id.includes('-image'));

type ToolId = string;

interface FloatingToolsProps {
    onLaunchService?: (serviceId: ServiceId) => void;
    /** Position read from settings (saved in localStorage) */
    position?: 'left' | 'right';
}

export const FloatingTools: React.FC<FloatingToolsProps> = ({ onLaunchService, position: posProp }) => {
    // Read position from localStorage (FloatingButtonBehavior settings)
    const savedPos = (() => {
        try { return (JSON.parse(localStorage.getItem('fbt_settings') || '{}')?.toolsPosition as 'left' | 'right') || 'left'; } catch { return 'left'; }
    })();
    const position = posProp || savedPos;

    const [isOpen, setIsOpen] = useState(false);
    const [selectedTool, setSelectedTool] = useState<ToolId>(SERVICES[0]?.id || '');
    const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
    const [prompt, setPrompt] = useState('');
    const [result, setResult] = useState<{ text?: string; imageBase64?: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { getActiveApiKey } = useApiKeys();

    const service = SERVICES.find(s => s.id === selectedTool);

    // Categorize current tool
    const isImageGen = selectedTool === ServiceId.IMAGE_GENERATOR;
    const isVoice = selectedTool === ServiceId.LIVE_CONVERSATION;
    const isTextBased = !isImageGen && !isVoice;
    const models = isImageGen ? IMAGE_MODELS : TEXT_MODELS;

    const getPlaceholder = () => {
        switch (selectedTool) {
            case ServiceId.CHATBOT: return 'Ask Gemini anything...';
            case ServiceId.FAST_CHAT: return 'Quick question...';
            case ServiceId.IMAGE_GENERATOR: return 'Describe the image to generate...';
            case ServiceId.IMAGE_ANALYZER: return 'What do you want to know about this image?';
            case ServiceId.GROUNDING_SEARCH: return 'Search the web with Gemini...';
            case ServiceId.TEXT_TO_SPEECH: return 'Enter text to convert to speech...';
            case ServiceId.AUDIO_TRANSCRIBER: return 'Describe what to transcribe...';
            case ServiceId.COMPLEX_TASK_SOLVER: return 'Describe the complex problem...';
            case ServiceId.DOCUMENT_PROCESSOR: return 'Paste document text and ask what to do...';
            case ServiceId.VIDEO_ANALYZER: return 'Ask about a video...';
            case ServiceId.WORKFLOW: return 'Describe a goal to build a workflow...';
            default: return 'Type your prompt...';
        }
    };

    const handleRun = useCallback(async () => {
        if (!prompt.trim()) return;
        setIsLoading(true);
        setError(null);
        setResult(null);
        try {
            const apiKey = getActiveApiKey('floating_chat');
            if (isImageGen) {
                const base64 = await generateImage(prompt, '1:1', undefined, undefined, selectedModel, apiKey);
                setResult({ imageBase64: base64 });
            } else {
                // Wrap prompt with service-specific instruction
                const systemHints: Record<string, string> = {
                    [ServiceId.GROUNDING_SEARCH]: 'Search and answer with up-to-date info: ',
                    [ServiceId.COMPLEX_TASK_SOLVER]: 'Think step by step and solve: ',
                    [ServiceId.WORKFLOW]: 'Create a step-by-step workflow for: ',
                    [ServiceId.TEXT_TO_SPEECH]: 'You are a TTS script writer. Create a voiceover for: ',
                };
                const prefix = systemHints[selectedTool] || '';
                const res = await generateContent(selectedModel, prefix + prompt, undefined, apiKey);
                setResult({ text: res.text || 'No response.' });
            }
        } catch (err: any) {
            const m = err?.message || '';
            setError(m.includes('API key') || m.includes('key') ? 'No API key. Add one in Settings → API Keys.' : m || 'Error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [prompt, selectedTool, selectedModel, getActiveApiKey, isImageGen]);

    const posClass = position === 'right' ? 'right-[5.5rem]' : 'left-6 md:left-6';
    const panelAlignClass = position === 'right' ? 'items-end' : 'items-start';

    return (
        <div className={`fixed bottom-6 ${posClass} z-50 flex flex-col ${panelAlignClass} pointer-events-none`}>

            {/* Panel */}
            {isOpen && (
                <div className="pointer-events-auto w-[92vw] md:w-[380px] max-h-[75vh] bg-white dark:bg-gray-900 rounded-[2rem] shadow-2xl border border-gray-200 dark:border-gray-800 mb-4 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                    {/* Purple Header with tool selector */}
                    <div className="bg-gradient-to-r from-violet-500 to-purple-700 px-4 py-3 shrink-0 text-white">
                        <div className="flex items-center justify-between mb-2.5">
                            <div className="flex items-center gap-2">
                                <AppsIcon className="w-4 h-4 text-purple-200" />
                                <span className="font-bold text-sm">AI Tools Panel</span>
                            </div>
                            <button onClick={() => { setIsOpen(false); setResult(null); }} className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                                <CloseIcon className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Tool + Model selectors side by side in header */}
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <select
                                    value={selectedTool}
                                    onChange={e => { setSelectedTool(e.target.value); setResult(null); setError(null); setPrompt(''); }}
                                    className="w-full text-xs font-semibold bg-white/15 border border-white/20 text-white rounded-xl px-3 py-2 pr-6 focus:outline-none appearance-none cursor-pointer"
                                >
                                    {SERVICES.map(s => (
                                        <option key={s.id} value={s.id} className="text-gray-900 bg-white">{s.name}</option>
                                    ))}
                                </select>
                                <ChevronDownIcon className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-white/70 pointer-events-none" />
                            </div>
                            {!isVoice && (
                                <div className="relative">
                                    <select
                                        value={selectedModel}
                                        onChange={e => setSelectedModel(e.target.value)}
                                        className="text-[11px] bg-white/15 border border-white/20 text-white rounded-xl px-2.5 py-2 pr-5 focus:outline-none appearance-none cursor-pointer max-w-[120px]"
                                    >
                                        {models.map(m => (
                                            <option key={m.id} value={m.id} className="text-gray-900 bg-white text-xs">{m.label}</option>
                                        ))}
                                    </select>
                                    <ChevronDownIcon className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 text-white/70 pointer-events-none" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto flex flex-col">
                        {/* Live voice notice */}
                        {isVoice ? (
                            <div className="flex flex-col items-center justify-center p-8 gap-4 text-center">
                                <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                    <svg className="w-8 h-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800 dark:text-white mb-1">Live Conversation</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Use the green phone button (bottom right) for real-time voice chat with Gemini Native Audio.</p>
                                </div>
                                <button
                                    onClick={() => { onLaunchService?.(ServiceId.LIVE_CONVERSATION); setIsOpen(false); }}
                                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-2xl transition-all hover:scale-105"
                                >
                                    Open Full Live Conversation
                                </button>
                            </div>
                        ) : (
                            <div className="p-4 space-y-3">
                                {/* Prompt input */}
                                <div>
                                    <textarea
                                        value={prompt}
                                        onChange={e => setPrompt(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleRun(); }}
                                        placeholder={getPlaceholder()}
                                        rows={3}
                                        className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1 text-right">Ctrl+Enter to run</p>
                                </div>

                                {/* Error */}
                                {error && (
                                    <div className="px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 rounded-xl text-xs text-red-600 dark:text-red-400">
                                        ⚠️ {error}
                                    </div>
                                )}

                                {/* Result */}
                                {result && (
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                                        {result.imageBase64 && (
                                            <img
                                                src={`data:image/jpeg;base64,${result.imageBase64}`}
                                                alt="Generated"
                                                className="w-full rounded-2xl"
                                            />
                                        )}
                                        {result.text && (
                                            <div className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                                                {result.text}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Run button (if not voice) */}
                    {!isVoice && (
                        <div className="px-4 pb-4 shrink-0 flex gap-2">
                            <button
                                onClick={handleRun}
                                disabled={!prompt.trim() || isLoading}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-semibold rounded-2xl shadow-md shadow-purple-500/30 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                            >
                                {isLoading ? <LoadingSpinner className="w-4 h-4" /> : <SendIcon className="w-4 h-4" />}
                                {isLoading ? 'Running...' : 'Run'}
                            </button>
                            <button
                                onClick={() => { onLaunchService?.(service?.id as ServiceId); setIsOpen(false); }}
                                title="Open full page"
                                className="px-3 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-2xl text-xs font-medium transition-colors"
                            >
                                Full ↗
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* FAB */}
            <button
                onClick={() => { setIsOpen(!isOpen); setResult(null); }}
                className={`pointer-events-auto flex items-center justify-center w-14 h-14 rounded-[20px] shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 ${
                    isOpen
                        ? 'bg-gray-800 dark:bg-white text-white dark:text-gray-900'
                        : 'bg-gradient-to-br from-violet-500 to-purple-700 text-white shadow-purple-500/30'
                }`}
            >
                {isOpen ? <CloseIcon className="w-6 h-6" /> : <AppsIcon className="w-6 h-6" />}
            </button>
        </div>
    );
};

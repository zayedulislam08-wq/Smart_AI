import React, { useState, useMemo } from 'react';
import { SERVICES, GEMINI_MODELS, type ServiceId } from '../constants';

// ─── Icon ────────────────────────────────────────────────────────────────────
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
const ExternalLinkIcon: React.FC<{ className?: string }> = (p) => (
    <svg {...p} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
);

// Feature descriptions per service
const SERVICE_FEATURES: Record<string, string[]> = {
    chatbot:            ['💬 Multi-turn conversation', '📚 Context memory', '📁 File attachment', '🧠 Uses Gemini Flash/Pro'],
    fast_chat:          ['⚡ Ultra-low latency', '💬 Quick Q&A', '🔄 Fast response', '🏎️ Uses Flash Lite'],
    live_conversation:  ['🎙️ Real-time voice input', '🔊 AI audio output', '📝 Live transcript', '🌍 Multilingual'],
    image_generator:    ['🎨 Text → Image', '📐 Multiple aspect ratios', '🖌️ Style control', '✏️ Negative prompts'],
    image_editor:       ['🖼️ Edit with text prompt', '🔄 Inpainting', '🌈 Style transfer', '📤 Download result'],
    image_analyzer:     ['🔍 Describe photos', '📋 Extract text (OCR)', '🏷️ Object detection', '❓ Visual Q&A'],
    grounding_search:   ['🌐 Live web search', '🗺️ Google Maps lookup', '📡 Real-time data', '🔗 Source citations'],
    text_to_speech:     ['🎤 6+ voices', '🎭 Multi-speaker scripts', '🎵 Emotion control', '📢 Audio download'],
    audio_transcriber:  ['🎙️ Mic recording', '📂 File upload', '🌍 Translation', '✨ AI summary'],
    complex_task:       ['🧠 Thinking mode (Pro)', '📊 Step-by-step reasoning', '💡 Adjustable budget', '🔬 Deep analysis'],
    document_processor: ['📄 PDF/DOCX editing', '📋 Reformat', '📤 Export CSV/MD', '🖨️ Print/download'],
    video_analyzer:     ['🎬 Video upload', '📝 Summarize', '🔤 Subtitles', '🎯 Key moments'],
};

// Map ServiceId enum values → feature keys
const SERVICE_ID_TO_FEATURE: Record<string, string> = {
    chatbot:             'chatbot',
    fast_chat:           'fast_chat',
    live_conversation:   'live_conversation',
    image_generator:     'image_generator',
    image_editor:        'image_editor',
    image_analyzer:      'image_analyzer',
    grounding_search:    'grounding_search',
    audio_transcriber:   'audio_transcriber',
    complex_task_solver: 'complex_task',
    text_to_speech:      'text_to_speech',
    document_processor:  'document_processor',
    video_analyzer:      'video_analyzer',
};

const ALL_MODELS = Object.values(GEMINI_MODELS);

export interface FloatingToolsProps {
    onLaunchService?: (serviceId: ServiceId) => void;
}

export const FloatingTools: React.FC<FloatingToolsProps> = ({ onLaunchService }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedServiceId, setSelectedServiceId] = useState<string>(SERVICES[0]?.id || '');
    const [selectedModelId, setSelectedModelId] = useState<string>('gemini-2.5-flash');
    const [showModelDropdown, setShowModelDropdown] = useState(false);

    const selectedService = useMemo(
        () => SERVICES.find(s => s.id === selectedServiceId),
        [selectedServiceId]
    );

    const featureKey = selectedService ? SERVICE_ID_TO_FEATURE[selectedService.id] : '';
    const features = featureKey ? SERVICE_FEATURES[featureKey] || [] : [];
    const currentModel = GEMINI_MODELS[selectedModelId];

    return (
        <div className="fixed bottom-[5.5rem] left-6 z-50 flex flex-col items-start pointer-events-none">

            {/* Panel */}
            {isOpen && (
                <div className="pointer-events-auto w-[92vw] md:w-[370px] max-h-[74vh] bg-white dark:bg-gray-900 rounded-[2rem] shadow-2xl border border-gray-200 dark:border-gray-800 mb-4 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-violet-500 to-purple-700 px-4 py-3.5 shrink-0 flex items-center justify-between text-white">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center border border-white/30">
                                <AppsIcon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm leading-tight">AI Tools Panel</h3>
                                <p className="text-[11px] text-purple-200">Select a service to explore</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                            <CloseIcon className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Service Selector */}
                    <div className="px-4 pt-4 pb-2 shrink-0 border-b border-gray-100 dark:border-gray-800">
                        <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider block mb-1.5">Choose AI Service</label>
                        <div className="relative">
                            <select
                                value={selectedServiceId}
                                onChange={e => setSelectedServiceId(e.target.value)}
                                className="w-full text-sm font-semibold bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-200 rounded-xl px-4 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer"
                            >
                                {SERVICES.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                            <ChevronDownIcon className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-purple-500 pointer-events-none" />
                        </div>
                    </div>

                    {/* Service Info + Features */}
                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                        {selectedService && (
                            <>
                                {/* Service description */}
                                <div className="flex items-start gap-2.5">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shrink-0 shadow-md shadow-purple-500/25">
                                        <selectedService.Icon className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-gray-800 dark:text-gray-100">{selectedService.name}</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{selectedService.description}</p>
                                    </div>
                                </div>

                                {/* Features list */}
                                {features.length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider mb-2">Key Features</p>
                                        <div className="grid grid-cols-1 gap-1.5">
                                            {features.map((feat, i) => (
                                                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-white/5 rounded-xl text-xs text-gray-700 dark:text-gray-300">
                                                    {feat}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Model override selector */}
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider mb-1.5">Model Override</p>
                                    <div className="relative">
                                        <select
                                            value={selectedModelId}
                                            onChange={e => setSelectedModelId(e.target.value)}
                                            className="w-full text-xs font-medium bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl px-3 py-2 pr-7 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer"
                                        >
                                            {ALL_MODELS.map(m => (
                                                <option key={m.id} value={m.id}>{m.label}</option>
                                            ))}
                                        </select>
                                        <ChevronDownIcon className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    </div>
                                    {currentModel && (
                                        <p className="text-[10px] text-gray-400 mt-1 px-1">{currentModel.description} · RPM: {currentModel.limits.rpm} · RPD: {currentModel.limits.rpd}</p>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Launch button */}
                    <div className="px-4 py-4 border-t border-gray-100 dark:border-gray-800 shrink-0">
                        <button
                            onClick={() => {
                                if (selectedService && onLaunchService) {
                                    onLaunchService(selectedService.id as ServiceId);
                                }
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-semibold rounded-2xl shadow-lg shadow-purple-500/30 transition-all hover:scale-[1.02] active:scale-95"
                        >
                            <ExternalLinkIcon className="w-4 h-4" />
                            Open {selectedService?.name || 'Service'}
                        </button>
                    </div>
                </div>
            )}

            {/* FAB — Left side */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`pointer-events-auto flex items-center justify-center w-14 h-14 rounded-[20px] shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 ${
                    isOpen
                        ? 'bg-gray-800 dark:bg-white text-white dark:text-gray-900'
                        : 'bg-gradient-to-br from-violet-500 to-purple-700 text-white shadow-purple-500/30'
                }`}
            >
                {isOpen ? (
                    <CloseIcon className="w-6 h-6" />
                ) : (
                    <AppsIcon className="w-6 h-6" />
                )}
            </button>
        </div>
    );
};

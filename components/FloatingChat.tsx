import React, { useState, useRef, useEffect } from 'react';
import { BotIcon, CloseIcon, SendIcon, SparklesIcon, PaperclipIcon } from './icons/Icons';
import { generateContent } from '../services/geminiService';
import { LoadingSpinner } from './common/LoadingSpinner';
import { GEMINI_MODELS } from '../constants';
import { useApiKeys } from '../contexts/ApiKeyContext';

// All text-capable models for chat (exclude media-only models)
const CHAT_MODELS = Object.values(GEMINI_MODELS).filter(m =>
    !m.id.includes('imagen') &&
    !m.id.includes('veo') &&
    !m.id.includes('tts') &&
    !m.id.includes('image') &&
    !m.id.includes('audio-preview') &&
    !m.id.includes('embedding')
);

export const FloatingChat: React.FC = () => {
    const { getActiveApiKey } = useApiKeys();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
    const [input, setInput] = useState('');
    const [selectedModel, setSelectedModel] = useState(CHAT_MODELS[0]?.id || 'gemini-2.5-flash');
    const [isLoading, setIsLoading] = useState(false);
    const [attachedFile, setAttachedFile] = useState<File | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [input]);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([{ role: 'model', text: 'Hi there! Ask me anything or drop a file.' }]);
        }
    }, [isOpen, messages.length]);

    const handleSend = async () => {
        if (!input.trim() && !attachedFile) return;
        const userText = input;
        setInput('');
        const newMessages = [...messages, { role: 'user' as const, text: userText }];
        setMessages(newMessages);
        setIsLoading(true);
        try {
            const historyText = newMessages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n');
            const prompt = `${historyText}\n\nAssistant:`;
            const apiKey = getActiveApiKey('floating_chat');
            const responseObj = await generateContent(selectedModel, prompt, undefined, apiKey);
            setMessages(prev => [...prev, { role: 'model', text: responseObj.text || 'No response.' }]);
        } catch (error: any) {
            const msg = error?.message?.includes('API key') || error?.message?.includes('key')
                ? 'No API key found. Please add one in Settings → API Keys.'
                : 'Error: ' + (error?.message || 'Unknown error occurred.');
            setMessages(prev => [...prev, { role: 'model', text: msg }]);
        } finally {
            setIsLoading(false);
            setAttachedFile(null);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">

            {/* Chat Window */}
            {isOpen && (
                <div className="pointer-events-auto w-[90vw] md:w-[400px] h-[600px] max-h-[80vh] bg-white dark:bg-gray-900 rounded-[2rem] shadow-2xl border border-gray-200 dark:border-gray-800 mb-4 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3.5 shrink-0 flex items-center justify-between text-white shadow-md">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/30">
                                <SparklesIcon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-base leading-tight">Gemini Assistant</h3>
                                <div className="text-[11px] text-blue-100 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                    Online
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Model selector */}
                            <select
                                value={selectedModel}
                                onChange={e => setSelectedModel(e.target.value)}
                                className="text-[11px] bg-white/15 border border-white/20 text-white rounded-lg px-2 py-1 focus:outline-none appearance-none cursor-pointer max-w-[130px] truncate"
                            >
                                {CHAT_MODELS.map(m => (
                                    <option key={m.id} value={m.id} className="text-gray-900 bg-white text-xs">{m.label}</option>
                                ))}
                            </select>
                            <button onClick={() => setIsOpen(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                                <CloseIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-[#0a0a0a] space-y-3">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm leading-relaxed whitespace-pre-wrap ${
                                    msg.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-tr-sm'
                                        : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-sm'
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                                    <div className="flex items-center gap-1.5">
                                        {[0, 150, 300].map(d => (
                                            <div key={d} className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shrink-0">
                        {attachedFile && (
                            <div className="mb-2 flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-xl border border-blue-100 dark:border-blue-900/50">
                                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 truncate">{attachedFile.name}</span>
                                <button onClick={() => setAttachedFile(null)} className="ml-2 text-blue-400 hover:text-blue-600">
                                    <CloseIcon className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}
                        <div className="flex items-end gap-2 bg-gray-50 dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 px-2 py-1.5 focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500 transition-all">
                            <input type="file" className="hidden" ref={fileInputRef} onChange={e => setAttachedFile(e.target.files?.[0] || null)} />
                            <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-400 hover:text-blue-500 transition-colors shrink-0">
                                <PaperclipIcon className="w-5 h-5" />
                            </button>
                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Message Gemini..."
                                className="flex-1 max-h-[120px] min-h-[40px] bg-transparent border-none focus:ring-0 text-sm pt-2 pb-1 text-gray-800 dark:text-gray-100 resize-none outline-none"
                                rows={1}
                            />
                            <button
                                onClick={handleSend}
                                disabled={(!input.trim() && !attachedFile) || isLoading}
                                className={`p-2 shrink-0 rounded-full transition-all duration-200 ${(input.trim() || attachedFile) && !isLoading ? 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'}`}
                            >
                                {isLoading ? <LoadingSpinner className="w-5 h-5" /> : <SendIcon className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* FAB */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`pointer-events-auto flex items-center justify-center w-14 h-14 rounded-[20px] shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 ${
                    isOpen
                        ? 'bg-gray-800 dark:bg-white text-white dark:text-gray-900'
                        : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-blue-500/30'
                }`}
            >
                {isOpen ? <CloseIcon className="w-6 h-6" /> : (
                    <div className="relative">
                        <SparklesIcon className="w-6 h-6" />
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 border-2 border-indigo-600 rounded-full" />
                    </div>
                )}
            </button>
        </div>
    );
};

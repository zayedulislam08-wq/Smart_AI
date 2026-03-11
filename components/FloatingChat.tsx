import React, { useState, useRef, useEffect } from 'react';
import { BotIcon, CloseIcon, SendIcon, SparklesIcon, PaperclipIcon } from './icons/Icons';
import { generateContent } from '../services/geminiService';
import { LoadingSpinner } from './common/LoadingSpinner';
import { GEMINI_MODELS } from '../constants';
import { useApiKeys } from '../contexts/ApiKeyContext';

// All text-capable models for chat
const CHAT_MODELS = Object.values(GEMINI_MODELS).filter(m =>
    !m.id.includes('imagen') &&
    !m.id.includes('veo') &&
    !m.id.includes('tts') &&
    !m.id.includes('image') &&
    !m.id.includes('audio-preview') &&
    !m.id.includes('embedding')
);

export const FloatingChat: React.FC = () => {
    const { getActiveApiKey, getFeatureConfig } = useApiKeys();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
    const [input, setInput] = useState('');
    const [selectedModel, setSelectedModel] = useState(CHAT_MODELS[0]?.id || 'gemini-2.5-flash');
    const [isLoading, setIsLoading] = useState(false);
    const [showModelDropdown, setShowModelDropdown] = useState(false);
    const [attachedFile, setAttachedFile] = useState<File | null>(null);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [input]);

    // Initialize with a welcome message if empty
    useEffect(() => {
        if (isOpen && messages.length === 0) {
             setMessages([{ role: 'model', text: 'Hi there! Experience the power of Gemini. Ask me anything, or drop a file.' }]);
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
            const prompt = `Context of conversation:\n${historyText}\n\nRespond to the last message logically and concisely.`;
            const apiKey = getActiveApiKey('floating_chat');
            const responseObj = await generateContent(selectedModel, prompt, undefined, apiKey);
            setMessages(prev => [...prev, { role: 'model', text: responseObj.text || "No response generated." }]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'model', text: "I'm sorry, I encountered an error. Please check your API key or connection." }]);
        } finally {
            setIsLoading(false);
            setAttachedFile(null); // Clear file after sending
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const toggleOpen = () => setIsOpen(!isOpen);

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
            
            {/* The Chat Window */}
            {isOpen && (
                <div className="pointer-events-auto w-[90vw] md:w-[400px] h-[600px] max-h-[80vh] bg-white dark:bg-gray-900 rounded-[2rem] shadow-2xl border border-gray-200 dark:border-gray-800 mb-4 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                    
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 shrink-0 flex items-center justify-between text-white relative shadow-md">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/30">
                                <SparklesIcon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg leading-tight">Gemini Assistant</h3>
                                <div className="text-xs text-blue-100 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                                    Online
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                             {/* Model Selector Dropdown */}
                             <div className="relative">
                                <button 
                                    onClick={() => setShowModelDropdown(!showModelDropdown)}
                                    className="px-2.5 py-1.5 bg-black/20 hover:bg-black/30 rounded-lg text-xs font-semibold backdrop-blur-sm transition-colors border border-white/10"
                                >
                                    {MODELS.find(m => m.id === selectedModel)?.label.split(' ')[0]}
                                </button>
                                
                                {showModelDropdown && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setShowModelDropdown(false)}></div>
                                        <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl z-20 overflow-hidden border border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-top-2">
                                            <div className="px-3 py-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-100 dark:border-gray-700">Select Model</div>
                                            {MODELS.map(model => (
                                                <button
                                                    key={model.id}
                                                    onClick={() => { setSelectedModel(model.id); setShowModelDropdown(false); }}
                                                    className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${selectedModel === model.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-700 dark:text-gray-300'}`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span>{model.label}</span>
                                                        {selectedModel === model.id && <span className="text-blue-500 text-xs">✓</span>}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            <button onClick={toggleOpen} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer">
                                <CloseIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-[#0a0a0a] space-y-4 custom-scrollbar">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                                <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                                    msg.role === 'user' 
                                        ? 'bg-blue-600 text-white rounded-tr-sm' 
                                        : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-sm'
                                }`}>
                                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap font-sans">{msg.text}</p>
                                </div>
                            </div>
                        ))}
                        
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-tl-sm p-4 shadow-sm max-w-[85%]">
                                    <div className="flex items-center gap-1.5 h-6">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
                        
                        {/* Attachment Preview (if any) */}
                        {attachedFile && (
                            <div className="mb-3 flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900/50">
                                <div className="flex items-center gap-2 overflow-hidden">
                                     <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-800 flex items-center justify-center shrink-0">
                                         <PaperclipIcon className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                                     </div>
                                    <span className="text-sm font-semibold text-blue-800 dark:text-blue-300 truncate">{attachedFile.name}</span>
                                </div>
                                <button onClick={() => setAttachedFile(null)} className="p-1 text-blue-400 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-full transition-colors shrink-0">
                                    <CloseIcon className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        <div className="flex items-end gap-2 bg-gray-50 dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 p-1.5 transition-all focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500 relative">
                            
                            <input 
                                type="file" 
                                className="hidden" 
                                ref={fileInputRef} 
                                onChange={(e) => setAttachedFile(e.target.files?.[0] || null)}
                            />
                            
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2.5 text-gray-400 hover:text-blue-500 transition-colors shrink-0 outline-none"
                                title="Attach simple file context"
                            >
                                <PaperclipIcon className="w-5 h-5" />
                            </button>

                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Message Gemini..."
                                className="flex-1 max-h-[120px] min-h-[44px] bg-transparent border-none focus:ring-0 text-[15px] pt-3 pb-2 px-1 text-gray-800 dark:text-gray-100 resize-none outline-none scrollbar-hide"
                                rows={1}
                            />

                            <button
                                onClick={handleSend}
                                disabled={(!input.trim() && !attachedFile) || isLoading}
                                className={`p-2.5 shrink-0 rounded-full transition-all duration-300 ${
                                    (input.trim() || attachedFile) && !isLoading
                                        ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700 hover:scale-105 active:scale-95'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                                }`}
                            >
                                {isLoading ? <LoadingSpinner className="w-5 h-5" /> : <SendIcon className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                </div>
            )}

            {/* Floating FAB Button */}
            <button
                onClick={toggleOpen}
                className={`pointer-events-auto flex items-center justify-center w-[60px] h-[60px] rounded-[24px] shadow-2xl transition-all duration-300 z-50 group hover:scale-105 active:scale-95 ${
                    isOpen 
                    ? 'bg-gray-800 hover:bg-gray-900 text-white dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 border border-gray-700/50 dark:border-white/20' 
                    : 'bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-blue-500/30'
                }`}
            >
                {isOpen ? (
                    <CloseIcon className="w-7 h-7 transform rotate-90 group-hover:rotate-180 transition-transform duration-300" />
                ) : (
                    <div className="relative">
                        <SparklesIcon className="w-7 h-7" />
                        <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-indigo-600 rounded-full"></span>
                    </div>
                )}
            </button>
        </div>
    );
};

import React, { useState, useEffect, useRef } from 'react';
import type { Chat } from '@google/genai';
import { createChat } from '../services/geminiService';
import { fileToBase64, getFileType } from '../utils/helpers';
import type { ChatMessage, MessagePart } from '../types';
import { ActionButton } from './common/ActionButton';
import { BotIcon, UserIcon, SendIcon, CloseIcon, PdfIcon, AudioWaveIcon, SparklesIcon, SettingsIcon } from './icons/Icons';
import { SuggestionChips } from './common/SuggestionChips';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const parseResponse = (responseText: string): { answer: string; suggestions: string[] } => {
    const suggestionsKeyword = "SUGGESTIONS:";
    const suggestionIndex = responseText.lastIndexOf(suggestionsKeyword);
    
    if (suggestionIndex === -1) {
        return { answer: responseText, suggestions: [] };
    }
    
    const answer = responseText.substring(0, suggestionIndex).trim();
    const suggestionsText = responseText.substring(suggestionIndex + suggestionsKeyword.length).trim();
    
    const suggestions = suggestionsText.split('\n')
        .map(s => s.replace(/^[*-]?\s*\d*\.\s*/, '').trim())
        .filter(s => s.length > 0);
        
    return { answer, suggestions };
};

export const Chatbot: React.FC = () => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [systemInstruction, setSystemInstruction] = useState('');
    const [showSettings, setShowSettings] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    
    const [attachedFile, setAttachedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const initChat = () => {
        setChat(createChat('gemini-2.5-flash', systemInstruction || undefined));
        setMessages([]);
        setSuggestions([]);
    };

    useEffect(() => {
        initChat();
    }, []); 

    const applySystemInstruction = () => {
        initChat();
        setShowSettings(false);
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading, suggestions]);

    // Auto-resize textarea
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
            inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
        }
    }, [input]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setAttachedFile(file);
            const mimeType = getFileType(file);
            if (mimeType.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => setFilePreview(reader.result as string);
                reader.readAsDataURL(file);
            } else {
                setFilePreview(null);
            }
        }
    };

    const removeFile = () => {
        setAttachedFile(null);
        setFilePreview(null);
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSend = async (prompt: string = input) => {
        if ((!prompt.trim() && !attachedFile) || !chat || isLoading) return;

        setIsLoading(true);
        setError(null);
        setSuggestions([]);

        const userParts: MessagePart[] = [{ text: `${prompt}\n\nAfter answering, please suggest 3 short follow-up questions the user might have, formatted under a "SUGGESTIONS:" heading.` }];

        if (attachedFile) {
            try {
                const base64Data = await fileToBase64(attachedFile);
                const mimeType = getFileType(attachedFile);

                if (!mimeType) {
                    throw new Error("Could not determine file type. Please try a valid file.");
                }

                userParts.unshift({
                    inlineData: {
                        mimeType: mimeType,
                        data: base64Data
                    }
                });
            } catch (e: any) {
                console.error("Error converting file to base64", e);
                setError(e.message || "Failed to process file.");
                setIsLoading(false);
                return;
            }
        }
        
        const userMessage: ChatMessage = { role: 'user', parts: userParts };
        setMessages(prev => [...prev, userMessage]);
        
        setInput('');
        if (inputRef.current) inputRef.current.style.height = 'auto';
        removeFile();
        
        try {
            const response = await chat.sendMessage({ message: userParts });
            const { answer, suggestions: newSuggestions } = parseResponse(response.text || "");
            const modelMessage: ChatMessage = { role: 'model', parts: [{ text: answer }] };
            setMessages(prev => [...prev, modelMessage]);
            setSuggestions(newSuggestions);
        } catch (e) {
            console.error(e);
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        setInput(suggestion);
        handleSend(suggestion);
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };
    
    return (
        <div className="flex flex-col h-full bg-white dark:bg-[#131415] sm:rounded-3xl sm:shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:border border-gray-100 dark:border-gray-800 relative font-sans overflow-hidden -mx-4 sm:mx-0">
            
            {/* Minimal App-like Header for Chat */}
            <div className="absolute top-0 left-0 right-0 px-4 sm:px-6 py-3 flex justify-between items-center z-20 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
                <div 
                    className="flex flex-col cursor-pointer group" 
                    onClick={() => setShowSettings(!showSettings)}
                >
                    <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">Smart Assistant</span>
                        <SettingsIcon className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-xs text-green-500 font-medium tracking-wide flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        Online
                    </span>
                </div>
                <div className="flex gap-2">
                    {messages.length > 0 && (
                        <button 
                            onClick={initChat}
                            className="text-xs font-semibold px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 rounded-full transition-colors flex items-center gap-1"
                        >
                            <SparklesIcon className="w-3.5 h-3.5" /> New Chat
                        </button>
                    )}
                </div>
            </div>

            {/* Settings Modal */}
            {showSettings && (
                <div className="absolute top-16 left-4 z-30 w-72 sm:w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 p-5 animate-in fade-in zoom-in-95 duration-200">
                    <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Bot Persona</h3>
                    <textarea 
                        value={systemInstruction} 
                        onChange={(e) => setSystemInstruction(e.target.value)}
                        placeholder="e.g. You are a helpful code reviewer..."
                        className="w-full h-24 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none mb-4 text-gray-800 dark:text-gray-200"
                    />
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setShowSettings(false)} className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">Cancel</button>
                        <button onClick={applySystemInstruction} className="px-4 py-1.5 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 shadow-sm shadow-blue-500/20">Apply</button>
                    </div>
                </div>
            )}

            {/* Scrollable Chat Area */}
            <div className="flex-grow overflow-y-auto pt-20 pb-20 px-4 sm:px-6 custom-scrollbar bg-gray-50/50 dark:bg-transparent">
                <div className="max-w-3xl mx-auto flex flex-col gap-6 w-full">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center mt-8 animate-in fade-in duration-700">
                            <div className="mb-6 relative">
                                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400 to-blue-500 blur-2xl opacity-20 rounded-full"></div>
                                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl rotate-12 flex items-center justify-center shadow-lg shadow-blue-500/30">
                                     <SparklesIcon className="w-8 h-8 text-white -rotate-12" />
                                </div>
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                                How can I help you?
                            </h2>
                            <p className="text-base text-gray-500 dark:text-gray-400 mb-8 max-w-sm">
                                I'm your AI assistant, ready to write code, analyze data, and accelerate your workflow.
                            </p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                                {[
                                    { icon: "📷", label: "Analyze image", prompt: "Explain what's in this image" },
                                    { icon: "💻", label: "Write Code", prompt: "Write a React hook to fetch data" },
                                    { icon: "📝", label: "Summarize", prompt: "Summarize this article for me" },
                                    { icon: "💡", label: "Ideas", prompt: "Give me 5 creative ideas for a tech project" }
                                ].map((item, i) => (
                                    <button 
                                        key={i}
                                        onClick={() => handleSend(item.prompt)} 
                                        className="p-3.5 bg-white dark:bg-gray-800/80 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-2xl transition-all text-left flex items-center gap-3 border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md group"
                                    >
                                        <div className="text-xl w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-900 flex items-center justify-center group-hover:scale-105 transition-transform">{item.icon}</div>
                                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        messages.map((msg, index) => (
                            <div key={index} className={`flex w-full animate-in slide-in-from-bottom-2 duration-300 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    
                                    {/* AI Avatar Label (Optional, for premium messaging look) */}
                                    {msg.role === 'model' && index > 0 && messages[index-1].role === 'user' && (
                                        <div className="flex items-center gap-1.5 ml-1 mb-1.5 opacity-60">
                                            <SparklesIcon className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                                            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Assistant</span>
                                        </div>
                                    )}

                                    <div className={`px-4 sm:px-5 py-3 shadow-sm ${
                                        msg.role === 'user' 
                                        ? 'bg-gradient-to-br from-blue-600 to-cyan-600 text-white rounded-3xl rounded-br-sm' 
                                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-3xl rounded-bl-sm border border-gray-100 dark:border-gray-700/50'
                                    }`}>
                                        {msg.parts.map((part, i) => {
                                            if ('text' in part) {
                                                const text = part.text.split("SUGGESTIONS:")[0];
                                                return (
                                                    <div key={i} className={`markdown-body text-[15px] leading-relaxed ${
                                                        msg.role === 'model' 
                                                        ? 'prose dark:prose-invert max-w-none prose-p:my-2 prose-pre:bg-gray-50 text-gray-800 dark:text-gray-200 dark:prose-pre:bg-gray-900/50 prose-pre:rounded-xl prose-pre:border border-gray-200 dark:border-gray-700/50 prose-code:text-pink-500 prose-a:text-blue-500' 
                                                        : 'whitespace-pre-wrap font-medium'
                                                    }`}>
                                                        {msg.role === 'model' ? (
                                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
                                                        ) : (
                                                            text
                                                        )}
                                                    </div>
                                                );
                                            }
                                            if ('inlineData' in part) {
                                                const mime = part.inlineData.mimeType;
                                                if (mime.startsWith('image/')) {
                                                    return (
                                                        <div key={i} className="rounded-2xl overflow-hidden mb-2 max-w-[240px]">
                                                            <img src={`data:${mime};base64,${part.inlineData.data}`} alt="upload rounded-2xl" className="w-full h-auto object-cover" />
                                                        </div>
                                                    )
                                                } else {
                                                    return (
                                                        <div key={i} className={`flex items-center gap-3 p-3 rounded-2xl mb-2 ${msg.role === 'user' ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                                            {mime.includes('pdf') ? <PdfIcon className="w-5 h-5"/> : <AudioWaveIcon className="w-5 h-5"/>}
                                                            <div className="flex flex-col overflow-hidden">
                                                                <span className="text-[10px] font-bold uppercase opacity-70">Attachment</span>
                                                                <span className="text-sm font-semibold truncate">{mime.split('/')[1].toUpperCase()}</span>
                                                            </div>
                                                        </div>
                                                    )
                                                }
                                            }
                                            return null;
                                        })}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}

                    {isLoading && (
                        <div className="flex justify-start animate-in slide-in-from-bottom-2">
                             <div className="bg-white dark:bg-gray-800 rounded-3xl rounded-bl-sm border border-gray-100 dark:border-gray-700/50 px-5 py-4 shadow-sm">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {suggestions.length > 0 && !isLoading && (
                        <div className="mt-2 text-center animate-in fade-in slide-in-from-bottom-2">
                            <SuggestionChips suggestions={suggestions} onSuggestionClick={handleSuggestionClick} />
                        </div>
                    )}
                    
                    <div ref={messagesEndRef} className="h-6" />
                </div>
            </div>

            {/* Fixed Bottom Input Area */}
            <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-[#131415] border-t border-gray-100 dark:border-gray-800/80 p-3 sm:p-4 z-20">
                <div className="max-w-3xl mx-auto relative">
                    
                    {/* Floating Errors */}
                    {error && (
                        <div className="absolute bottom-full left-0 mb-3 w-full">
                            <div className="bg-red-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg shadow-red-500/20 inline-flex items-center gap-2">
                                <span>⚠️</span> {error}
                            </div>
                        </div>
                    )}

                    {/* Floating Attachment Preview */}
                    {attachedFile && (
                        <div className="absolute bottom-full left-0 mb-3 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-2 pr-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl shadow-black/5">
                                {filePreview ? (
                                    <img src={filePreview} alt="Preview" className="h-10 w-10 object-cover rounded-xl" />
                                ) : (
                                    <div className="h-10 w-10 bg-blue-50 dark:bg-blue-900/30 text-blue-500 rounded-xl flex items-center justify-center">
                                        {attachedFile.type.includes('pdf') ? <PdfIcon className="w-5 h-5"/> : <AudioWaveIcon className="w-5 h-5"/>}
                                    </div>
                                )}
                                <div className="flex flex-col min-w-[100px] max-w-[150px]">
                                    <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{attachedFile.name}</span>
                                    <span className="text-[10px] text-gray-500 uppercase font-medium">{Math.round(attachedFile.size / 1024)} KB</span>
                                </div>
                                <button onClick={removeFile} className="ml-2 w-7 h-7 bg-gray-100 dark:bg-gray-700 hover:bg-red-100 hover:text-red-500 text-gray-500 rounded-full flex items-center justify-center transition-colors">
                                    <CloseIcon className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Chat Input Pill */}
                    <div className={`flex items-end gap-2 bg-gray-100/80 dark:bg-gray-800/50 backdrop-blur-md rounded-3xl p-1.5 pl-3 transition-all ${isLoading ? 'opacity-50 pointer-events-none' : ''} border border-transparent focus-within:border-cyan-500/30 focus-within:bg-white dark:focus-within:bg-gray-800 focus-within:shadow-sm`}>
                        <div className="flex items-center pb-1.5">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/*,application/pdf,audio/*"
                            />
                            <button 
                                onClick={() => fileInputRef.current?.click()} 
                                className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center text-cyan-600 dark:text-cyan-400 hover:scale-105 transition-transform shadow-sm"
                                title="Attach file"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                            </button>
                        </div>
                        
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Message Smart AI..."
                            className="flex-grow bg-transparent text-gray-900 dark:text-white py-2.5 px-2 max-h-32 min-h-[44px] focus:outline-none resize-none text-[15px] leading-snug custom-scrollbar placeholder-gray-400 dark:placeholder-gray-500"
                            rows={1}
                        />

                        <div className="pb-1 pr-1">
                            <button 
                                onClick={() => handleSend()}
                                disabled={(!input.trim() && !attachedFile) || isLoading}
                                className={`w-9 h-9 flex items-center justify-center rounded-full transition-all ${
                                    input.trim() || attachedFile 
                                    ? 'bg-cyan-500 text-white shadow-md active:scale-95 hover:bg-cyan-600' 
                                    : 'bg-transparent text-gray-400 dark:text-gray-600'
                                }`}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={input.trim() || attachedFile ? 'ml-0.5' : ''}><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                            </button>
                        </div>
                    </div>
                    
                </div>
            </div>
        </div>
    );
};

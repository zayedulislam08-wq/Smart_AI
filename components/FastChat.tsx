import React, { useState, useEffect, useRef } from 'react';
import type { Chat } from '@google/genai';
import { createChat } from '../services/geminiService';
import type { ChatMessage } from '../types';
import { ActionButton } from './common/ActionButton';
import { BotIcon, UserIcon, SendIcon } from './icons/Icons';
import { SuggestionChips } from './common/SuggestionChips';

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


export const FastChat: React.FC = () => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setChat(createChat('gemini-flash-lite-latest'));
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSend = async (prompt: string = input) => {
        if (!prompt.trim() || !chat || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', parts: [{ text: prompt }] };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setError(null);
        setSuggestions([]);

        try {
            const fullPrompt = `${prompt}\n\nAfter answering, please suggest 3 short follow-up questions the user might have, formatted under a "SUGGESTIONS:" heading.`
            const stream = await chat.sendMessageStream({ message: fullPrompt });
            
            let modelResponseText = '';
            setMessages(prev => [...prev, { role: 'model', parts: [{ text: '' }] }]);

            for await (const chunk of stream) {
                modelResponseText += chunk.text;
                const currentAnswer = parseResponse(modelResponseText).answer;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = { role: 'model', parts: [{ text: currentAnswer }] };
                    return newMessages;
                });
            }
            const { answer, suggestions: newSuggestions } = parseResponse(modelResponseText);
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = { role: 'model', parts: [{ text: answer }] };
                return newMessages;
            });
            setSuggestions(newSuggestions);

        } catch (e) {
            console.error(e);
            setError('An error occurred while getting the response. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };
    
     const handleSuggestionClick = (suggestion: string) => {
        setInput(suggestion);
        handleSend(suggestion);
    }

    return (
        <div className="flex flex-col h-full max-h-[calc(100vh-200px)]">
             <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold">Low-Latency Chat</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Get rapid, streaming responses from Gemini Flash Lite.</p>
            </div>
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'model' && <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full"><BotIcon className="w-6 h-6 text-cyan-500" /></div>}
                        <div className={`max-w-lg p-3 rounded-xl ${msg.role === 'user' ? 'bg-cyan-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                           {/* FIX: Safely access text from message parts and handle potential non-text parts. */}
                           <p className="whitespace-pre-wrap">{msg.parts.map(p => 'text' in p ? p.text : '').join('')}{isLoading && msg.role === 'model' && index === messages.length -1 ? '...' : ''}</p>
                        </div>
                         {msg.role === 'user' && <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full"><UserIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" /></div>}
                    </div>
                ))}
                {suggestions.length > 0 && !isLoading && <SuggestionChips suggestions={suggestions} onSuggestionClick={handleSuggestionClick} />}
                 <div ref={messagesEndRef} />
            </div>
            {error && <p className="p-4 text-red-500 dark:text-red-400">{error}</p>}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 mt-auto">
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type your message..."
                        className="flex-grow bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        disabled={isLoading}
                    />
                    <ActionButton onClick={() => handleSend()} isLoading={isLoading} icon={<SendIcon className="w-5 h-5"/>}>
                       Send
                    </ActionButton>
                </div>
            </div>
        </div>
    );
};

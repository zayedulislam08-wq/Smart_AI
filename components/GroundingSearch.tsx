import React, { useState, useEffect } from 'react';
import { generateGroundedContent } from '../services/geminiService';
import { ActionButton } from './common/ActionButton';
import { SearchIcon, LinkIcon } from './icons/Icons';
import { LoadingSpinner } from './common/LoadingSpinner';
import { SuggestionChips } from './common/SuggestionChips';

type SearchMode = 'googleSearch' | 'googleMaps';
type GroundingChunk = {
    web?: { uri?: string; title?: string };
    maps?: { uri?: string; title?: string };
};

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


export const GroundingSearch: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [mode, setMode] = useState<SearchMode>('googleSearch');
    const [response, setResponse] = useState('');
    const [sources, setSources] = useState<GroundingChunk[]>([]);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [location, setLocation] = useState<{ latitude: number, longitude: number } | null>(null);
    
    useEffect(() => {
        if (mode === 'googleMaps') {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                },
                (err) => {
                    console.warn(`Geolocation error: ${err.message}`);
                    setError("Could not get location. Maps search may be less accurate. Please enable location services.");
                }
            );
        }
    }, [mode]);

    const handleSearch = async (currentPrompt: string = prompt) => {
        if (!currentPrompt.trim()) return;

        setIsLoading(true);
        setError(null);
        setResponse('');
        setSources([]);
        setSuggestions([]);

        try {
            const fullPrompt = `${currentPrompt}\n\nAfter answering, please suggest 3 related searches under a "SUGGESTIONS:" heading.`;
            const res = await generateGroundedContent(fullPrompt, mode, location || undefined);
            const { answer, suggestions: newSuggestions } = parseResponse(res.text);
            setResponse(answer);
            setSuggestions(newSuggestions);
            // @ts-ignore
            setSources(res.candidates?.[0]?.groundingMetadata?.groundingChunks || []);
        } catch (e) {
            console.error(e);
            setError('An error occurred while searching.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSuggestionClick = (suggestion: string) => {
        setPrompt(suggestion);
        handleSearch(suggestion);
    }

    return (
        <div className="p-4">
            <div className="mb-6">
                <h2 className="text-xl font-bold">Web & Maps Grounding</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Get up-to-date answers grounded in Google Search and Maps.</p>
            </div>

            <div className="space-y-4">
                <div className="flex space-x-2 bg-gray-200 dark:bg-gray-800 p-1 rounded-lg">
                    <button onClick={() => setMode('googleSearch')} className={`w-full py-2 px-4 rounded-md text-sm font-medium transition-colors ${mode === 'googleSearch' ? 'bg-cyan-600 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'}`}>Web Search</button>
                    <button onClick={() => setMode('googleMaps')} className={`w-full py-2 px-4 rounded-md text-sm font-medium transition-colors ${mode === 'googleMaps' ? 'bg-cyan-600 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'}`}>Maps Search</button>
                </div>
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder={mode === 'googleMaps' ? "e.g., 'Good Italian restaurants nearby'" : "e.g., 'Latest news on AI'"}
                        className="flex-grow bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    <ActionButton onClick={() => handleSearch()} isLoading={isLoading} icon={<SearchIcon className="w-5 h-5"/>}>
                        Search
                    </ActionButton>
                </div>
            </div>

            {error && <p className="mt-4 text-center text-red-500 dark:text-red-400">{error}</p>}
            
            <div className="mt-6">
                {isLoading && <div className="flex justify-center p-8"><LoadingSpinner className="w-8 h-8"/></div>}
                {response && (
                    <div className="bg-gray-100 dark:bg-gray-800/50 p-4 rounded-lg">
                        <h3 className="font-bold text-lg mb-2">Response:</h3>
                        <p className="whitespace-pre-wrap">{response}</p>
                        {sources.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <h4 className="font-semibold mb-2">Sources:</h4>
                                <ul className="space-y-1 list-disc list-inside">
                                    {sources.map((source, index) => {
                                        const item = source.web || source.maps;
                                        if (!item || !item.uri) return null;
                                        return (
                                            <li key={index}>
                                                <a href={item.uri} target="_blank" rel="noopener noreferrer" className="text-cyan-500 dark:text-cyan-400 hover:underline flex items-center gap-1">
                                                   <LinkIcon className="w-4 h-4" /> {item.title || item.uri}
                                                </a>
                                            </li>
                                        )
                                    })}
                                </ul>
                            </div>
                        )}
                        <SuggestionChips suggestions={suggestions} onSuggestionClick={handleSuggestionClick} />
                    </div>
                )}
            </div>
        </div>
    );
};
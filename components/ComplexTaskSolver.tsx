import React, { useState } from 'react';
import { solveComplexTask } from '../services/geminiService';
import { ActionButton } from './common/ActionButton';
import { BrainIcon, ZapIcon } from './icons/Icons';
import { LoadingSpinner } from './common/LoadingSpinner';
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


export const ComplexTaskSolver: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [response, setResponse] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [budget, setBudget] = useState(16000);

    const handleSubmit = async (currentPrompt: string = prompt) => {
        if (!currentPrompt.trim()) return;

        setIsLoading(true);
        setError(null);
        setResponse('');
        setSuggestions([]);

        try {
            const fullPrompt = `${currentPrompt}\n\nAfter providing the solution, suggest 3 ways to build upon or extend this solution under a "SUGGESTIONS:" heading.`;
            const result = await solveComplexTask(fullPrompt, budget);
            const { answer, suggestions: newSuggestions } = parseResponse(result);
            setResponse(answer);
            setSuggestions(newSuggestions);
        } catch (e) {
            console.error(e);
            setError('An error occurred while solving the task.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSuggestionClick = (suggestion: string) => {
        const newPrompt = `${response}\n\n---\n\nUser request: ${suggestion}`;
        setPrompt(newPrompt);
        handleSubmit(newPrompt);
    }

    return (
        <div className="p-4">
            <div className="mb-6">
                <h2 className="text-xl font-bold">Thinking Mode: Complex Task Solver</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Tackle your most difficult problems with Gemini 2.5 Pro, leveraging an enhanced thinking budget.</p>
            </div>

            <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                    <div className="flex justify-between items-center mb-2">
                        <label htmlFor="budget-slider" className="text-sm font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-2">
                            <ZapIcon className="w-4 h-4" />
                            Thinking Budget: {budget} Tokens
                        </label>
                        <span className="text-xs text-blue-600 dark:text-blue-400">Higher = Deeper Reasoning</span>
                    </div>
                    <input 
                        id="budget-slider"
                        type="range" 
                        min="1024" 
                        max="32768" 
                        step="1024"
                        value={budget}
                        onChange={(e) => setBudget(Number(e.target.value))}
                        className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer dark:bg-blue-700 accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>Fast (1k)</span>
                        <span>Deep (32k)</span>
                    </div>
                </div>

                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter a complex prompt, e.g., 'Write Python code for a web application that visualizes real-time stock market data...'"
                    rows={6}
                    className="w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <ActionButton onClick={() => handleSubmit()} isLoading={isLoading} icon={<BrainIcon className="w-5 h-5"/>} className="w-full">
                    Solve with Gemini Pro
                </ActionButton>
            </div>

            {error && <p className="mt-4 text-center text-red-500 dark:text-red-400">{error}</p>}
            
            <div className="mt-6 bg-gray-100 dark:bg-gray-800/50 rounded-lg p-4 min-h-[300px]">
                <h3 className="font-bold text-lg mb-2">Result:</h3>
                {isLoading ? (
                    <div className="flex flex-col justify-center items-center h-full gap-3">
                        <LoadingSpinner className="w-8 h-8"/>
                        <p className="text-sm text-gray-500 animate-pulse">Thinking deeply... (This may take a moment)</p>
                    </div>
                ) : response ? (
                    <>
                        <pre className="whitespace-pre-wrap text-gray-800 dark:text-gray-300 font-mono text-sm overflow-x-auto">{response}</pre>
                        <SuggestionChips suggestions={suggestions} onSuggestionClick={handleSuggestionClick} />
                    </>
                ) : (
                    <p className="text-gray-500 dark:text-gray-400">The solution will appear here.</p>
                )}
            </div>
        </div>
    );
};
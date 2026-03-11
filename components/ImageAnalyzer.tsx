
import React, { useState, useCallback } from 'react';
import { generateContentWithMedia } from '../services/geminiService';
import { fileToBase64, getFileType } from '../utils/helpers';
import { ActionButton } from './common/ActionButton';
import { UploadIcon, AnalyzeIcon } from './icons/Icons';
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


export const ImageAnalyzer: React.FC = () => {
    const [image, setImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState<string>('');
    const [response, setResponse] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fileInfo, setFileInfo] = useState<{ name: string, type: string } | null>(null);

    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const mimeType = getFileType(file);
            setFileInfo({ name: file.name, type: mimeType });
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
                setResponse('');
                setSuggestions([]);
            };
            reader.readAsDataURL(file);
        }
    }, []);

    const handleAnalyze = async (currentPrompt: string = prompt) => {
        if (!image || !currentPrompt || !fileInfo || !fileInfo.type) {
            setError('Please upload a valid image and ask a question.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setResponse('');
        setSuggestions([]);

        try {
            const base64Data = image.split(',')[1];
            const fullPrompt = `${currentPrompt}\n\nAfter answering, please suggest 3 questions I could ask about this image, under a "SUGGESTIONS:" heading.`;
            const res = await generateContentWithMedia('gemini-2.5-flash', fullPrompt, base64Data, fileInfo.type);
            const { answer, suggestions: newSuggestions } = parseResponse(res.text || "");
            setResponse(answer);
            setSuggestions(newSuggestions);
        } catch (e) {
            console.error(e);
            setError('An error occurred during analysis.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        setPrompt(suggestion);
        handleAnalyze(suggestion);
    }

    return (
        <div className="p-4">
            <div className="mb-6">
                <h2 className="text-xl font-bold">Image Understanding</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Upload a photo and ask Gemini Flash anything about it.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <label className="block w-full cursor-pointer bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-cyan-500 transition-colors">
                        <UploadIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                        <span className="mt-2 block text-sm font-medium text-gray-600 dark:text-gray-300">
                           {fileInfo ? `Selected: ${fileInfo.name}` : 'Upload an image'}
                        </span>
                        <input type="file" onChange={handleFileChange} className="hidden" accept="image/*" />
                    </label>
                    {image && (
                         <div className="space-y-4">
                            <img src={image} alt="Uploaded for analysis" className="rounded-lg w-full object-contain max-h-80" />
                            <input
                                type="text"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="e.g., 'What is in this image?'"
                                className="w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            <ActionButton onClick={() => handleAnalyze()} isLoading={isLoading} icon={<AnalyzeIcon className="w-5 h-5"/>} className="w-full">
                                Analyze
                            </ActionButton>
                         </div>
                    )}
                </div>
                 <div className="bg-gray-100 dark:bg-gray-800/50 rounded-lg p-4 min-h-[300px]">
                    <h3 className="font-bold text-lg mb-2">Analysis Result:</h3>
                     {isLoading && <div className="flex justify-center p-8"><LoadingSpinner className="w-8 h-8"/></div>}
                     {!isLoading && response && <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{response}</p>}
                     {!isLoading && !response && <p className="text-gray-500 dark:text-gray-400">The analysis from Gemini will appear here.</p>}
                     {!isLoading && suggestions.length > 0 && <SuggestionChips suggestions={suggestions} onSuggestionClick={handleSuggestionClick} />}
                 </div>
            </div>
            {error && <p className="mt-4 text-center text-red-500 dark:text-red-400">{error}</p>}
        </div>
    );
};

import React from 'react';

interface SuggestionChipsProps {
    suggestions: string[];
    onSuggestionClick: (suggestion: string) => void;
}

export const SuggestionChips: React.FC<SuggestionChipsProps> = ({ suggestions, onSuggestionClick }) => {
    if (!suggestions.length) return null;
    
    return (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Suggestions:</h4>
            <div className="flex flex-wrap gap-2">
                {suggestions.map((s, i) => (
                    <button
                        key={i}
                        onClick={() => onSuggestionClick(s)}
                        className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-sm rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                        {s}
                    </button>
                ))}
            </div>
        </div>
    );
};

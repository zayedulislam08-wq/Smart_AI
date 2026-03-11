import React, { useState, useRef } from 'react';
import { generateWorkflow } from '../services/geminiService';
import { exportWorkflow, parseCsvToWorkflow } from '../utils/helpers';
import type { Workflow } from '../types';
import { ActionButton } from './common/ActionButton';
import { LoadingSpinner } from './common/LoadingSpinner';
import { BrainIcon, ExportIcon, ImportIcon } from './icons/Icons';

export const WorkflowBuilder: React.FC = () => {
    const [goal, setGoal] = useState('');
    const [workflow, setWorkflow] = useState<Workflow | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleGenerate = async () => {
        if (!goal.trim()) return;

        setIsLoading(true);
        setError(null);
        setWorkflow(null);

        try {
            const resultJson = await generateWorkflow(goal);
            const parsedWorkflow = JSON.parse(resultJson) as Workflow;
            setWorkflow(parsedWorkflow);
        } catch (e) {
            console.error(e);
            setError('Failed to generate workflow. The model may have returned an unexpected format.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleExport = (format: 'txt' | 'csv') => {
        if (workflow) {
            exportWorkflow(workflow, format);
        }
    };
    
    const handleImportClick = () => {
        fileInputRef.current?.click();
    };
    
    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const csvContent = e.target?.result as string;
                    const importedWorkflow = parseCsvToWorkflow(csvContent, file.name);
                    setWorkflow(importedWorkflow);
                    setGoal('');
                    setError(null);
                } catch (err) {
                    if (err instanceof Error) {
                        setError(`Failed to import CSV: ${err.message}`);
                    } else {
                        setError('An unknown error occurred during import.');
                    }
                }
            };
            reader.onerror = () => setError('Failed to read the file.');
            reader.readAsText(file);
        }
        // Reset file input
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className="p-4">
            <div className="mb-6">
                <h2 className="text-2xl font-bold">AI Workflow Builder</h2>
                <p className="text-md text-gray-500 dark:text-gray-400">Describe your goal, and let Gemini Pro create a step-by-step workflow for you.</p>
            </div>

            <div className="space-y-4 mb-8">
                <textarea
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="e.g., 'I want to provide my graphic design service on Facebook.'"
                    rows={4}
                    className="w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <div className="flex flex-col sm:flex-row gap-2">
                    <ActionButton onClick={handleGenerate} isLoading={isLoading} icon={<BrainIcon className="w-5 h-5"/>} className="w-full">
                        Generate Workflow
                    </ActionButton>
                    <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".csv" className="hidden" />
                    <ActionButton onClick={handleImportClick} icon={<ImportIcon className="w-5 h-5"/>} className="w-full bg-gray-600 hover:bg-gray-700">
                        Import CSV
                    </ActionButton>
                </div>
            </div>

            {error && <p className="text-center text-red-500 dark:text-red-400 mb-4">{error}</p>}
            
            {isLoading && (
                <div className="flex justify-center items-center p-8">
                    <LoadingSpinner className="w-10 h-10 text-cyan-500 dark:text-cyan-400" />
                </div>
            )}

            {workflow && (
                <div className="bg-gray-100 dark:bg-gray-800/50 rounded-lg p-6">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 pb-4 border-b border-gray-300 dark:border-gray-700">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{workflow.title}</h3>
                            <p className="text-gray-600 dark:text-gray-400">{workflow.summary}</p>
                        </div>
                         <div className="flex gap-2 mt-4 sm:mt-0">
                            <button onClick={() => handleExport('txt')} className="flex items-center gap-2 text-sm px-3 py-2 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"><ExportIcon className="w-4 h-4" /> Export TXT</button>
                            <button onClick={() => handleExport('csv')} className="flex items-center gap-2 text-sm px-3 py-2 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"><ExportIcon className="w-4 h-4" /> Export CSV</button>
                        </div>
                    </div>
                    <ol className="space-y-6">
                        {workflow.steps.map((step, index) => (
                            <li key={index} className="flex gap-4">
                                <div className="flex-shrink-0 w-10 h-10 bg-cyan-600 text-white rounded-full flex items-center justify-center font-bold text-lg">{index + 1}</div>
                                <div className="flex-grow">
                                    <h4 className="font-semibold text-lg text-gray-800 dark:text-gray-200">{step.title}</h4>
                                    {step.estimated_time && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Est. Time: {step.estimated_time}</p>
                                    )}
                                    <p className="text-gray-700 dark:text-gray-300">{step.description}</p>
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>
            )}
        </div>
    );
};
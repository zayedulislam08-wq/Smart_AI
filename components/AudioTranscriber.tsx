import React, { useState, useRef } from 'react';
import { transcribeAudio, summarizeText } from '../services/geminiService';
import { fileToBase64 } from '../utils/helpers';
import { copyToClipboard, downloadAsTextFile } from '../utils/exportUtils';
import { ActionButton } from './common/ActionButton';
import { MicIcon, StopIcon, UploadIcon, DocumentIcon, CopyIcon, DownloadIcon, SparklesIcon, AudioWaveIcon } from './icons/Icons';
import { LoadingSpinner } from './common/LoadingSpinner';

export const AudioTranscriber: React.FC = () => {
    const [mode, setMode] = useState<'record' | 'upload'>('record');
    
    // Recording State
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    // Upload State
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Transcription & Action State
    const [targetLanguage, setTargetLanguage] = useState<string>('');
    const [transcription, setTranscription] = useState('');
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // --- Recording Logic ---
    const handleStartRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };
            mediaRecorderRef.current.onstop = processRecording;
            audioChunksRef.current = [];
            mediaRecorderRef.current.start();
            setIsRecording(true);
            resetOutputs();
        } catch (err) {
            console.error("Error accessing microphone:", err);
            setError("Could not access microphone. Please grant permission.");
        }
    };
    
    const handleStopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    const processRecording = async () => {
        setIsLoading(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], "recording.webm", { type: audioBlob.type });
        await executeTranscription(audioFile);
    };

    // --- Upload Logic ---
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
            resetOutputs();
        }
    };

    const handleUploadTranscription = async () => {
        if (!selectedFile) return;
        setIsLoading(true);
        await executeTranscription(selectedFile);
    };

    // --- Core Processing ---
    const executeTranscription = async (file: File) => {
        setError(null);
        try {
            const base64Audio = await fileToBase64(file);
            const languageParam = targetLanguage !== '' ? targetLanguage : undefined;
            const result = await transcribeAudio(base64Audio, file.type, languageParam);
            setTranscription(result);
        } catch (err) {
            console.error("Transcription error:", err);
            setError("Failed to transcribe audio. Ensure file is valid and API limit isn't exceeded.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSummarize = async () => {
        if (!transcription) return;
        setIsSummarizing(true);
        setError(null);
        try {
            const result = await summarizeText(transcription);
            setSummary(result);
        } catch (err) {
            console.error("Summarization error:", err);
            setError("Failed to generate summary.");
        } finally {
            setIsSummarizing(false);
        }
    };

    const resetOutputs = () => {
        setTranscription('');
        setSummary('');
        setError(null);
    };

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full animate-fade-in pb-10">
            {/* Header */}
            <div className="text-center sm:text-left mb-2">
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500 mb-2">Audio Intelligence</h2>
                <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">Transcribe voice and extract key insights instantly using Gemini Flash.</p>
            </div>

            {/* Input Controller Card */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-[2rem] sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 dark:border-gray-800 p-4 sm:p-6 lg:p-8">
                
                {/* Mode Selectors - iOS Style Toggle */}
                <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-full mb-8 max-w-sm mx-auto sm:mx-0 relative">
                    <button 
                        onClick={() => { setMode('record'); resetOutputs(); }}
                        className={`flex-1 flex justify-center items-center py-2.5 rounded-full text-sm font-semibold transition-all duration-300 z-10 ${mode === 'record' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        <MicIcon className="w-4 h-4 mr-2" /> Dictate
                    </button>
                    <button 
                        onClick={() => { setMode('upload'); resetOutputs(); }}
                        className={`flex-1 flex justify-center items-center py-2.5 rounded-full text-sm font-semibold transition-all duration-300 z-10 ${mode === 'upload' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        <UploadIcon className="w-4 h-4 mr-2" /> Upload
                    </button>
                </div>

                {/* Main Action Area */}
                <div className="flex flex-col items-center justify-center min-h-[180px]">
                    {mode === 'record' ? (
                        <div className="flex flex-col items-center gap-6">
                            <div className="relative group">
                                {isRecording && (
                                    <>
                                        <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-30"></div>
                                        <div className="absolute -inset-4 bg-red-100 dark:bg-red-900/30 rounded-full animate-pulse"></div>
                                    </>
                                )}
                                <button
                                    onClick={isRecording ? handleStopRecording : handleStartRecording}
                                    disabled={isLoading}
                                    className={`relative z-10 w-24 h-24 flex items-center justify-center rounded-full shadow-lg transition-all duration-300 ${
                                        isRecording 
                                        ? 'bg-red-500 hover:bg-red-600 text-white scale-110 shadow-red-500/30' 
                                        : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105 shadow-blue-600/30 disabled:opacity-50 disabled:hover:scale-100'
                                    }`}
                                >
                                    {isRecording ? <StopIcon className="w-10 h-10" /> : <MicIcon className="w-10 h-10" />}
                                </button>
                            </div>
                            <div className="text-center font-medium h-6">
                                {isRecording ? (
                                    <span className="text-red-500 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                        Recording... Tap to stop
                                    </span>
                                ) : (
                                    <span className="text-gray-500 dark:text-gray-400">Tap to start recording</span>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center w-full max-w-sm gap-4">
                            <input
                                type="file"
                                accept="audio/*,video/*"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleFileChange}
                            />
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl py-10 px-6 cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all bg-gray-50/50 dark:bg-gray-800/50"
                            >
                                <DocumentIcon className="w-12 h-12 text-gray-400 mb-3" />
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
                                    {selectedFile ? <span className="text-blue-600 font-bold">{selectedFile.name}</span> : 'Tap to select an Audio or Video file'}
                                </p>
                            </div>
                            <ActionButton 
                                onClick={handleUploadTranscription} 
                                icon={<UploadIcon className="w-5 h-5"/>} 
                                disabled={!selectedFile || isLoading}
                                className="w-full justify-center py-3.5 text-base shadow-lg disabled:shadow-none"
                            >
                                Process Audio File
                            </ActionButton>
                        </div>
                    )}
                </div>

                {/* Configuration Option */}
                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 max-w-sm mx-auto sm:mx-0">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Translation (Optional)</label>
                    <div className="relative">
                        <select 
                            className="appearance-none bg-gray-50 border border-gray-200 text-gray-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full px-4 py-3 pr-10 dark:bg-gray-800/80 dark:border-gray-700 dark:text-white transition-shadow"
                            value={targetLanguage}
                            onChange={(e) => setTargetLanguage(e.target.value)}
                            disabled={isRecording || isLoading}
                        >
                            <option value="">Auto-detect Original Language</option>
                            <option value="English">Translate to English</option>
                            <option value="Bengali">Translate to Bengali (বাংলা)</option>
                            <option value="Spanish">Translate to Spanish</option>
                            <option value="French">Translate to French</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-2xl border border-red-100 dark:border-red-900/50 animate-in slide-in-from-bottom-4">
                    <span className="text-xl">⚠️</span> {error}
                </div>
            )}
            
            {/* Outputs Area */}
            <div className={`grid grid-cols-1 ${summary || isSummarizing ? 'lg:grid-cols-3' : ''} gap-6 transition-all`}>
                
                {/* Transcription Output */}
                <div className={`bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-[2rem] p-6 sm:p-8 border border-gray-100 dark:border-gray-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] ${summary || isSummarizing ? 'lg:col-span-2' : ''}`}>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 flex items-center">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center mr-3">
                                <DocumentIcon className="w-4 h-4" />
                            </div>
                            Transcription
                        </h3>
                        
                        {transcription && !isLoading && (
                            <div className="flex gap-2 w-full sm:w-auto">
                                {!summary && (
                                    <button onClick={handleSummarize} disabled={isSummarizing} className="flex-1 sm:flex-none flex justify-center items-center text-sm font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50 px-4 py-2 rounded-xl transition-colors disabled:opacity-50">
                                        <SparklesIcon className="w-4 h-4 mr-1.5"/> Summarize
                                    </button>
                                )}
                                <div className="flex gap-2">
                                    <button onClick={() => copyToClipboard(transcription)} className="flex items-center justify-center bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 w-10 h-10 rounded-xl transition-colors shrink-0">
                                        <CopyIcon className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => downloadAsTextFile(transcription, 'transcription.txt')} className="flex items-center justify-center bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 w-10 h-10 rounded-xl transition-colors shrink-0">
                                        <DownloadIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="min-h-[150px]">
                        {isLoading ? (
                            <div className="flex flex-col justify-center items-center h-[200px] space-y-4">
                                <LoadingSpinner className="w-10 h-10 text-blue-600" />
                                <span className="text-sm font-medium animate-pulse text-blue-600/70">Analyzing audio data...</span>
                            </div>
                        ) : transcription ? (
                            <p className="whitespace-pre-wrap leading-relaxed text-gray-700 dark:text-gray-300 text-[15px] selection:bg-blue-100 dark:selection:bg-blue-900/40">{transcription}</p>
                        ) : (
                            <div className="flex flex-col h-full items-center justify-center text-gray-400 dark:text-gray-500 italic mt-10">
                                <AudioWaveIcon className="w-12 h-12 opacity-20 mb-3" />
                                Your output will appear here
                            </div>
                        )}
                    </div>
                </div>

                {/* AI Summary Sidebar */}
                {(summary || isSummarizing) && (
                    <div className="bg-gradient-to-b from-purple-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-[2rem] p-6 sm:p-8 border border-purple-100 dark:border-purple-900/30 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] lg:col-span-1 animate-in slide-in-from-right-4">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg text-purple-800 dark:text-purple-300 flex items-center">
                                <span className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 flex items-center justify-center mr-3">
                                    <SparklesIcon className="w-4 h-4" />
                                </span>
                                AI Summary
                            </h3>
                            {summary && !isSummarizing && (
                                <button onClick={() => copyToClipboard(summary)} className="bg-white/50 hover:bg-white dark:bg-gray-800/50 dark:hover:bg-gray-800 text-purple-500 hover:text-purple-700 w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-colors">
                                    <CopyIcon className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                        
                        <div className="text-gray-700 dark:text-gray-300">
                            {isSummarizing ? (
                                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                    <LoadingSpinner className="w-8 h-8 text-purple-500" />
                                    <span className="text-xs font-semibold uppercase tracking-wider text-purple-500 flex gap-1">
                                        <span className="animate-pulse">Generating</span>
                                        <span className="animate-pulse" style={{ animationDelay: '200ms' }}>.</span>
                                        <span className="animate-pulse" style={{ animationDelay: '400ms' }}>.</span>
                                        <span className="animate-pulse" style={{ animationDelay: '600ms' }}>.</span>
                                    </span>
                                </div>
                            ) : (
                                <div className="prose prose-sm dark:prose-invert prose-purple max-w-none prose-p:leading-relaxed" dangerouslySetInnerHTML={{ __html: summary.replace(/\n/g, '<br/>') }} />
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
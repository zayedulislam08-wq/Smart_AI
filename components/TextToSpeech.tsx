import React, { useState, useRef, useEffect } from 'react';
import { generateSpeech, getTextSuggestions, generateConversationScript } from '../services/geminiService';
import { decode, decodeAudioData } from '../utils/helpers';
import { ActionButton } from './common/ActionButton';
import { VolumeIcon, ZapIcon, DownloadIcon, BrainIcon, EditIcon } from './icons/Icons';

type VoiceGender = 'Male' | 'Female';
type TTSMode = 'single' | 'multi';

interface VoiceOption {
    id: string;
    name: string;
    gender: VoiceGender;
    style: string;
    example: string;
}

const FEMALE_VOICES: VoiceOption[] = [
    { id: 'Kore', name: 'Kore', gender: 'Female', style: 'Calm & Soothing', example: 'শান্ত মনে কাজ করলে সাফল্য আসবেই।' },
    { id: 'Zephyr', name: 'Zephyr', gender: 'Female', style: 'Gentle & Polite', example: 'অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন, আমি দেখছি।' },
    { id: 'Aoede', name: 'Aoede', gender: 'Female', style: 'Balanced & Clear', example: 'আজকের আবহাওয়া ভ্রমণের জন্য খুব মনোরম।' },
    { id: 'Leda', name: 'Leda', gender: 'Female', style: 'Soft & Warm', example: 'ধন্যবাদ, আপনার দিনটি শুভ হোক।' },
    { id: 'Despina', name: 'Despina', gender: 'Female', style: 'Professional', example: 'আপনার অ্যাকাউন্টের তথ্য সফলভাবে আপডেট করা হয়েছে।' },
    { id: 'Erinome', name: 'Erinome', gender: 'Female', style: 'Fluency & Flow', example: 'নদীর মতো জীবন বয়ে চলে আপন গতিতে।' },
    { id: 'Callirrhoe', name: 'Callirrhoe', gender: 'Female', style: 'Relaxed', example: 'আজ বিকেলে আমরা পার্কে হাঁটতে যেতে পারি।' },
    { id: 'Achird', name: 'Achird', gender: 'Female', style: 'Bright & Cheerful', example: 'দারুণ! এই খবরটা শুনে মন ভালো হয়ে গেল!' },
    { id: 'Algieba', name: 'Algieba', gender: 'Female', style: 'Expressive', example: 'আরে! তুমি এখানে? কতদিন পর দেখা হলো!' },
    { id: 'Autonoe', name: 'Autonoe', gender: 'Female', style: 'Storytelling', example: 'অনেক দিন আগে, এক জাদুকরী বনে বাস করত এক পরি।' },
    { id: 'Laomedeia', name: 'Laomedeia', gender: 'Female', style: 'Lively', example: 'চল আজ সবাই মিলে পিকনিক করি!' },
    { id: 'Pulcherrima', name: 'Pulcherrima', gender: 'Female', style: 'Melodic', example: 'গানের সুরে সুরে মন ভরে ওঠে আনন্দে।' },
    { id: 'Sadaltager', name: 'Sadaltager', gender: 'Female', style: 'Motherly', example: 'সাবধানে যেও, আর পৌঁছালেই আমাকে ফোন করবে।' },
    { id: 'Sulafat', name: 'Sulafat', gender: 'Female', style: 'Crisp & Sharp', example: 'পরবর্তী স্টপেজ হলো কলকাতা স্টেশন।' },
    { id: 'Vindemiatrix', name: 'Vindemiatrix', gender: 'Female', style: 'Corporate', example: 'আগামীকাল সকাল দশটায় আমাদের মিটিং শুরু হবে।' },
];

const MALE_VOICES: VoiceOption[] = [
    { id: 'Puck', name: 'Puck', gender: 'Male', style: 'Energetic', example: 'চলো! আজ আমরা খেলায় জিতেই ফিরব!' },
    { id: 'Charon', name: 'Charon', gender: 'Male', style: 'Deep & Grave', example: 'সাবধান, সামনে গভীর জঙ্গল।' },
    { id: 'Fenrir', name: 'Fenrir', gender: 'Male', style: 'Authoritative', example: 'সবাই মনোযোগ দিন, এটি একটি জরুরি ঘোষণা।' },
    { id: 'Orus', name: 'Orus', gender: 'Male', style: 'Confident', example: 'আমি নিশ্চিত যে আমরা এই কাজটি করতে পারব।' },
    { id: 'Enceladus', name: 'Enceladus', gender: 'Male', style: 'Smooth', example: 'সন্ধ্যার আকাশ দেখতে আজ চমৎকার লাগছে।' },
    { id: 'Iapetus', name: 'Iapetus', gender: 'Male', style: 'Steady & News', example: 'আজকের প্রধান খবর হলো বিশ্বজুড়ে অর্থনীতির উন্নতি।' },
    { id: 'Alnilam', name: 'Alnilam', gender: 'Male', style: 'Casual', example: 'কি খবর দোস্ত? সব কেমন চলছে?' },
    { id: 'Achernar', name: 'Achernar', gender: 'Male', style: 'Firm', example: 'এই নিয়মটি সবাইকে মেনে চলতে হবে।' },
    { id: 'Algenib', name: 'Algenib', gender: 'Male', style: 'Fast & Direct', example: 'দ্রুত কর, আমাদের হাতে সময় খুব কম।' },
    { id: 'Gacrux', name: 'Gacrux', gender: 'Male', style: 'Bold', example: 'ভয় পাওয়ার কিছু নেই, এগিয়ে চলো।' },
    { id: 'Rasalgethi', name: 'Rasalgethi', gender: 'Male', style: 'Resonant', example: 'ইতিহাস সাক্ষী আছে এই বীরত্বের।' },
    { id: 'Sadachbia', name: 'Sadachbia', gender: 'Male', style: 'Calm & Wise', example: 'ধৈর্য ধরলে সব সমস্যার সমাধান পাওয়া যায়।' },
    { id: 'Schedar', name: 'Schedar', gender: 'Male', style: 'Strong', example: 'আমরা কোনো বাধাই মানব না।' },
    { id: 'Umbriel', name: 'Umbriel', gender: 'Male', style: 'Low & Mellow', example: 'রাতের নিস্তব্ধতায় জোনাকিরা জ্বলছে।' },
    { id: 'Zubenelgenubi', name: 'Zubenelgenubi', gender: 'Male', style: 'Grounded', example: 'মাটির মানুষ মাটির কাছেই ফিরে আসে।' },
];

// Helper to write string to DataView for WAV header
const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
};

// Helper to create WAV Blob from raw PCM data (16-bit, 24kHz, Mono)
const createWavBlob = (pcmData: Uint8Array): Blob => {
    const sampleRate = 24000;
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);
    const dataSize = pcmData.length;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // RIFF chunk
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');

    // fmt sub-chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);

    // data sub-chunk
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);
    
    // Write PCM data
    const pcmBytes = new Uint8Array(buffer, 44);
    pcmBytes.set(pcmData);

    return new Blob([buffer], { type: 'audio/wav' });
};

export const TextToSpeech: React.FC = () => {
    // State
    const [text, setText] = useState('');
    const [mode, setMode] = useState<TTSMode>('single');
    
    // Speaker 1 State
    const [gender1, setGender1] = useState<VoiceGender>('Female');
    const [voice1, setVoice1] = useState('auto');

    // Speaker 2 State (Multi-mode)
    const [gender2, setGender2] = useState<VoiceGender>('Male');
    const [voice2, setVoice2] = useState('auto');

    const [isLoading, setIsLoading] = useState(false);
    const [isScripting, setIsScripting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    // Suggestion state
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Derived Voice Lists
    const voices1 = gender1 === 'Female' ? FEMALE_VOICES : MALE_VOICES;
    const voices2 = gender2 === 'Female' ? FEMALE_VOICES : MALE_VOICES;

    // Reset voice to auto when gender changes
    useEffect(() => setSelectedVoice(setVoice1, 'auto'), [gender1]);
    useEffect(() => setSelectedVoice(setVoice2, 'auto'), [gender2]);

    const setSelectedVoice = (setter: React.Dispatch<React.SetStateAction<string>>, val: string) => {
        setter(val);
    };

    useEffect(() => {
        const initAudioContext = () => {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            }
            window.removeEventListener('click', initAudioContext);
            window.removeEventListener('keydown', initAudioContext);
        };
        window.addEventListener('click', initAudioContext);
        window.addEventListener('keydown', initAudioContext);
        
        return () => {
            window.removeEventListener('click', initAudioContext);
            window.removeEventListener('keydown', initAudioContext);
            audioContextRef.current?.close();
        };
    }, []);

    // Smart Suggestion Logic (Only active in single mode or if user isn't typing a script)
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (text.trim().length < 3 || mode === 'multi') {
            setSuggestions([]);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            setIsSuggesting(true);
            try {
                const results = await getTextSuggestions(text);
                setSuggestions(results);
            } catch (e) {
                console.error("Failed to fetch suggestions", e);
            } finally {
                setIsSuggesting(false);
            }
        }, 1200);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [text, mode]);

    const handleGenerateScript = async () => {
        if (!text.trim()) {
            setError("Please enter a topic first (e.g., 'Benefits of AI').");
            return;
        }
        setIsScripting(true);
        setError(null);
        try {
            const script = await generateConversationScript(text);
            setText(script);
        } catch (e) {
            console.error(e);
            setError("Failed to generate script.");
        } finally {
            setIsScripting(false);
        }
    };

    const handleSpeak = async () => {
        if (!text.trim()) {
            setError("Please enter text.");
            return;
        }
        
        if (!audioContextRef.current) {
            setError("Audio context not ready. Please click anywhere on the page first.");
            return;
        }

        setIsLoading(true);
        setIsPlaying(true);
        setError(null);
        setAudioBlob(null);
        
        if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
        }

        // Resolve Auto Voices
        const resolveVoice = (v: string, g: VoiceGender) => 
            v === 'auto' ? (g === 'Female' ? 'Kore' : 'Puck') : v;

        const v1 = resolveVoice(voice1, gender1);
        const v2 = mode === 'multi' ? resolveVoice(voice2, gender2) : undefined;

        try {
            const base64Audio = await generateSpeech(text, v1, v2);
            if (base64Audio) {
                const audioBytes = decode(base64Audio);
                
                const wavBlob = createWavBlob(audioBytes);
                setAudioBlob(wavBlob);

                const audioBuffer = await decodeAudioData(audioBytes, audioContextRef.current, 24000, 1);
                const source = audioContextRef.current.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContextRef.current.destination);
                
                source.onended = () => {
                    setIsPlaying(false);
                };

                source.start();
            } else {
                setError("Could not generate audio.");
                setIsPlaying(false);
            }
        } catch (e) {
            console.error(e);
            setError('An error occurred. Please ensure the text is supported.');
            setIsPlaying(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = () => {
        if (!audioBlob) return;
        
        const url = URL.createObjectURL(audioBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gemini_speech_${Date.now()}.wav`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const applySuggestion = (suggestion: string) => {
        setText(suggestion);
        setSuggestions([]);
    };

    // Helper to get the current voice object for preview
    const getVoiceObj = (vId: string, list: VoiceOption[]) => list.find(v => v.id === vId);
    const activeVoice1 = getVoiceObj(voice1, voices1);
    const activeVoice2 = getVoiceObj(voice2, voices2);

    return (
        <div className="h-full flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 rounded-t-xl">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <VolumeIcon className="w-6 h-6 text-cyan-500" />
                        Text-to-Speech
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Advanced speech generation with Gemini 2.5.</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-xs font-medium text-green-700 dark:text-green-400">System Ready</span>
                </div>
            </div>
            
            <div className="flex-grow p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 bg-gray-50 dark:bg-gray-900/50 rounded-b-xl">
                {/* Left Column: Text Input & Suggestions */}
                <div className="lg:col-span-2 flex flex-col h-full gap-4">
                    <div className="flex-grow flex flex-col relative">
                        <div className="flex justify-between items-center mb-2">
                            <label htmlFor="text-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                {mode === 'multi' ? 'Conversation Script' : 'Enter Text'}
                            </label>
                            {mode === 'multi' && (
                                <button 
                                    onClick={handleGenerateScript}
                                    disabled={isScripting || !text.trim()}
                                    className="text-xs flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:underline disabled:opacity-50"
                                >
                                    <ZapIcon className="w-3 h-3" />
                                    {isScripting ? 'Writing Script...' : 'Auto-Write Script from Topic'}
                                </button>
                            )}
                        </div>
                        <textarea
                            id="text-input"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder={mode === 'multi' 
                                ? "Enter a topic and click 'Auto-Write' above, or write a script:\nSpeaker 1: Hello!\nSpeaker 2: Hi there, how are you?" 
                                : "Type text to speak... (e.g., শুভ সকাল, কেমন আছেন?)"
                            }
                            className="flex-grow w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl p-4 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none shadow-sm transition-all min-h-[200px] font-mono text-sm"
                        />
                    </div>

                    {/* Smart Suggestions Box */}
                    {(isSuggesting || suggestions.length > 0) && mode === 'single' && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm transition-all">
                            <div className="flex items-center gap-2 mb-3">
                                <BrainIcon className="w-4 h-4 text-purple-500" />
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Suggestions</span>
                                {isSuggesting && <span className="text-xs text-purple-500 animate-pulse">Analyzing...</span>}
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                                {!isSuggesting && suggestions.map((suggestion, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => applySuggestion(suggestion)}
                                        className="text-left text-sm px-3 py-2 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-800/50 rounded-lg transition-colors duration-200"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Controls */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                                <ZapIcon className="w-5 h-5 text-yellow-500" />
                                Configuration
                            </h3>
                        </div>

                        {/* Mode Toggle */}
                        <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-lg mb-6">
                            <button
                                onClick={() => setMode('single')}
                                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide rounded-md transition-all ${mode === 'single' ? 'bg-white dark:bg-gray-700 shadow text-cyan-600 dark:text-cyan-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                            >
                                Single Voice
                            </button>
                            <button
                                onClick={() => setMode('multi')}
                                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide rounded-md transition-all ${mode === 'multi' ? 'bg-white dark:bg-gray-700 shadow text-purple-600 dark:text-purple-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                            >
                                Conversation
                            </button>
                        </div>
                        
                        <div className={`grid ${mode === 'multi' ? 'grid-cols-2 gap-2' : 'grid-cols-1'}`}>
                            {/* Speaker 1 Control */}
                            <div className={`space-y-3 ${mode === 'multi' ? 'p-2 bg-cyan-50 dark:bg-cyan-900/10 rounded-lg border border-cyan-100 dark:border-cyan-900/30' : ''}`}>
                                {mode === 'multi' && <label className="text-xs font-bold text-cyan-600 uppercase">Speaker 1</label>}
                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold mb-1">Gender</label>
                                    <div className="flex rounded-md bg-gray-100 dark:bg-gray-900 p-1">
                                        <button onClick={() => setGender1('Female')} className={`flex-1 py-1 text-xs font-medium rounded transition-all ${gender1 === 'Female' ? 'bg-cyan-600 text-white' : 'text-gray-500'}`}>F</button>
                                        <button onClick={() => setGender1('Male')} className={`flex-1 py-1 text-xs font-medium rounded transition-all ${gender1 === 'Male' ? 'bg-cyan-600 text-white' : 'text-gray-500'}`}>M</button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold mb-1">Model</label>
                                    <select value={voice1} onChange={(e) => setVoice1(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg p-2 border border-gray-200 dark:border-gray-600 text-xs">
                                        <option value="auto">Auto</option>
                                        {voices1.map(v => <option key={v.id} value={v.id}>{v.name} ({v.style})</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Speaker 2 Control (Only in Multi Mode) */}
                            {mode === 'multi' && (
                                <div className="space-y-3 p-2 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-100 dark:border-purple-900/30">
                                    <label className="text-xs font-bold text-purple-600 uppercase">Speaker 2</label>
                                    <div>
                                        <label className="block text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold mb-1">Gender</label>
                                        <div className="flex rounded-md bg-gray-100 dark:bg-gray-900 p-1">
                                            <button onClick={() => setGender2('Female')} className={`flex-1 py-1 text-xs font-medium rounded transition-all ${gender2 === 'Female' ? 'bg-purple-600 text-white' : 'text-gray-500'}`}>F</button>
                                            <button onClick={() => setGender2('Male')} className={`flex-1 py-1 text-xs font-medium rounded transition-all ${gender2 === 'Male' ? 'bg-purple-600 text-white' : 'text-gray-500'}`}>M</button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold mb-1">Model</label>
                                        <select value={voice2} onChange={(e) => setVoice2(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg p-2 border border-gray-200 dark:border-gray-600 text-xs">
                                            <option value="auto">Auto</option>
                                            {voices2.map(v => <option key={v.id} value={v.id}>{v.name} ({v.style})</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Style Preview Box */}
                        <div className="bg-gray-50 dark:bg-gray-900/80 rounded-lg p-3 border border-gray-200 dark:border-gray-700 mt-4">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Style Preview (Bengali):</p>
                            <p className="text-xs text-gray-800 dark:text-gray-200 italic mb-1">
                                <span className="font-bold text-cyan-600">S1:</span> {voice1 === 'auto' ? "Auto-selected" : `"${activeVoice1?.example}"`}
                            </p>
                            {mode === 'multi' && (
                                <p className="text-xs text-gray-800 dark:text-gray-200 italic">
                                    <span className="font-bold text-purple-600">S2:</span> {voice2 === 'auto' ? "Auto-selected" : `"${activeVoice2?.example}"`}
                                </p>
                            )}
                        </div>

                        <div className="pt-4 grid grid-cols-2 gap-3">
                            <ActionButton 
                                onClick={handleSpeak} 
                                isLoading={isLoading} 
                                disabled={isPlaying || !text.trim()}
                                icon={isPlaying ? <VolumeIcon className="w-5 h-5 animate-pulse"/> : <VolumeIcon className="w-5 h-5"/>} 
                                className="w-full justify-center py-3 text-base shadow-lg hover:shadow-cyan-500/30"
                            >
                                {isPlaying ? 'Speaking...' : 'Generate'}
                            </ActionButton>
                            
                            <ActionButton 
                                onClick={handleDownload} 
                                disabled={!audioBlob}
                                icon={<DownloadIcon className="w-5 h-5"/>} 
                                className={`w-full justify-center py-3 text-base shadow-md ${!audioBlob ? 'bg-gray-400 dark:bg-gray-700 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'}`}
                            >
                                Download
                            </ActionButton>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                            <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
                        </div>
                    )}
                    
                    <div className="text-xs text-gray-400 dark:text-gray-500 text-center mt-auto">
                        Powered by Gemini 2.5 Flash TTS
                    </div>
                </div>
            </div>
        </div>
    );
};
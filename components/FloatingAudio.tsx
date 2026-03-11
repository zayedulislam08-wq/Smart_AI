import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { LiveServerMessage } from '@google/genai';
import { MicIcon, StopIcon, CloseIcon } from './icons/Icons';
import { connectLive } from '../services/geminiService';
import { useApiKeys } from '../contexts/ApiKeyContext';
import { decode, decodeAudioData, encode } from '../utils/helpers';

const PhoneIcon: React.FC<{ className?: string }> = (p) => (
    <svg {...p} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
);

const VOICES = ['Zephyr', 'Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'];

type ConnStatus = 'idle' | 'connecting' | 'active' | 'error';

export const FloatingAudio: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [status, setStatus] = useState<ConnStatus>('idle');
    const [error, setError] = useState<string | null>(null);
    const [selectedVoice, setSelectedVoice] = useState('Zephyr');
    const [transcript, setTranscript] = useState<{ role: 'you' | 'ai'; text: string }[]>([]);
    const [currentTurn, setCurrentTurn] = useState<{ you: string; ai: string }>({ you: '', ai: '' });

    // Audio refs (same pipeline as LiveConversation.tsx)
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const inputAudioCtxRef = useRef<AudioContext | null>(null);
    const outputAudioCtxRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const transcriptEndRef = useRef<HTMLDivElement>(null);

    const { getActiveApiKey, getFeatureConfig } = useApiKeys();

    useEffect(() => {
        if (isOpen) {
            transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [transcript, currentTurn, isOpen]);

    const stopSession = useCallback(async () => {
        setStatus('idle');

        if (sessionPromiseRef.current) {
            try { (await sessionPromiseRef.current).close(); } catch { /* ignore */ }
            sessionPromiseRef.current = null;
        }

        scriptProcessorRef.current?.disconnect();
        sourceRef.current?.disconnect();
        mediaStreamRef.current?.getTracks().forEach(t => t.stop());
        inputAudioCtxRef.current?.close().catch(() => {});
        outputAudioCtxRef.current?.close().catch(() => {});

        for (const s of sourcesRef.current.values()) { try { s.stop(); } catch { /* ignore */ } }
        sourcesRef.current.clear();
        nextStartTimeRef.current = 0;

        inputAudioCtxRef.current = null;
        outputAudioCtxRef.current = null;
        mediaStreamRef.current = null;
        scriptProcessorRef.current = null;
        sourceRef.current = null;
    }, []);

    const handleClose = useCallback(() => {
        stopSession();
        setIsOpen(false);
        setTranscript([]);
        setCurrentTurn({ you: '', ai: '' });
        setError(null);
    }, [stopSession]);

    useEffect(() => () => { stopSession(); }, [stopSession]);

    const startSession = async () => {
        setStatus('connecting');
        setError(null);
        setTranscript([]);
        setCurrentTurn({ you: '', ai: '' });

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            const { modelId } = getFeatureConfig('live_conversation', 'gemini-2.5-flash-native-audio-preview-09-2025');
            const apiKey = getActiveApiKey('live_conversation');

            inputAudioCtxRef.current = new AudioContext({ sampleRate: 16000 });
            outputAudioCtxRef.current = new AudioContext({ sampleRate: 24000 });
            const outputGain = outputAudioCtxRef.current.createGain();
            outputGain.connect(outputAudioCtxRef.current.destination);

            const callbacks = {
                onopen: () => {
                    setStatus('active');

                    // Mic → PCM → send to Gemini
                    const src = inputAudioCtxRef.current!.createMediaStreamSource(stream);
                    sourceRef.current = src;
                    const processor = inputAudioCtxRef.current!.createScriptProcessor(4096, 1, 1);
                    scriptProcessorRef.current = processor;

                    processor.onaudioprocess = (e) => {
                        const inputData = e.inputBuffer.getChannelData(0);
                        const int16 = new Int16Array(inputData.length);
                        for (let i = 0; i < inputData.length; i++) {
                            int16[i] = inputData[i] * 32768;
                        }
                        const pcmBlob = {
                            data: encode(new Uint8Array(int16.buffer)),
                            mimeType: 'audio/pcm;rate=16000',
                        };
                        sessionPromiseRef.current?.then(session => {
                            session.sendRealtimeInput({ media: pcmBlob });
                        });
                    };

                    src.connect(processor);
                    processor.connect(inputAudioCtxRef.current!.destination);
                },
                onmessage: async (msg: LiveServerMessage) => {
                    // Transcript updates
                    if (msg.serverContent?.outputTranscription?.text) {
                        setCurrentTurn(prev => ({ ...prev, ai: prev.ai + msg.serverContent!.outputTranscription!.text }));
                    }
                    if (msg.serverContent?.inputTranscription?.text) {
                        setCurrentTurn(prev => ({ ...prev, you: prev.you + msg.serverContent!.inputTranscription!.text }));
                    }
                    if (msg.serverContent?.turnComplete) {
                        setCurrentTurn(prev => {
                            if (prev.you || prev.ai) {
                                if (prev.you) setTranscript(t => [...t, { role: 'you', text: prev.you }]);
                                if (prev.ai)  setTranscript(t => [...t, { role: 'ai', text: prev.ai }]);
                            }
                            return { you: '', ai: '' };
                        });
                    }

                    // AI audio output
                    const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    if (base64Audio && outputAudioCtxRef.current && outputAudioCtxRef.current.state !== 'closed') {
                        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioCtxRef.current.currentTime);
                        try {
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioCtxRef.current, 24000, 1);
                            const bufSrc = outputAudioCtxRef.current.createBufferSource();
                            bufSrc.buffer = audioBuffer;
                            bufSrc.connect(outputGain);
                            bufSrc.addEventListener('ended', () => sourcesRef.current.delete(bufSrc));
                            bufSrc.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            sourcesRef.current.add(bufSrc);
                        } catch { /* audio decode errors are non-fatal */ }
                    }

                    // Barge-in: stop queued audio on interruption
                    if (msg.serverContent?.interrupted) {
                        for (const s of sourcesRef.current.values()) { try { s.stop(); } catch { /* ignore */ } }
                        sourcesRef.current.clear();
                        nextStartTimeRef.current = 0;
                    }
                },
                onerror: (e: ErrorEvent) => {
                    console.error('Live API error:', e);
                    setError(`Connection error: ${e.message || 'Unknown error'}`);
                    stopSession();
                },
                onclose: () => {
                    if (status === 'active') stopSession();
                },
            };

            sessionPromiseRef.current = connectLive(
                callbacks,
                "You are a friendly and helpful AI voice assistant. Be concise and engaging in your responses.",
                selectedVoice,
                modelId,
                apiKey,
            );

        } catch (err: any) {
            console.error('Failed to start live session:', err);
            const msg = err?.message || String(err);
            if (msg.includes('Permission') || msg.includes('NotAllowed')) {
                setError('Microphone access denied. Please allow microphone in browser settings.');
            } else if (msg.includes('API key') || msg.includes('key')) {
                setError('No API key configured. Go to Settings → Add API Key.');
            } else {
                setError(`Failed to start: ${msg}`);
            }
            stopSession();
        }
    };

    const statusDot: Record<ConnStatus, string> = {
        idle: 'bg-gray-400',
        connecting: 'bg-yellow-400 animate-pulse',
        active: 'bg-green-400 animate-pulse',
        error: 'bg-red-500',
    };
    const statusLabel: Record<ConnStatus, string> = {
        idle: 'Ready',
        connecting: 'Connecting...',
        active: 'Live — Speaking',
        error: 'Error',
    };

    return (
        <div className="fixed bottom-[5.5rem] right-6 z-50 flex flex-col items-end pointer-events-none">

            {/* Panel */}
            {isOpen && (
                <div className="pointer-events-auto w-[92vw] md:w-[380px] max-h-[72vh] bg-white dark:bg-gray-900 rounded-[2rem] shadow-2xl border border-gray-200 dark:border-gray-800 mb-4 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 shrink-0 flex items-center justify-between text-white shadow-md">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/30">
                                <PhoneIcon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-base leading-tight">Live Voice Chat</h3>
                                <div className="flex items-center gap-1.5 text-[11px] text-emerald-100">
                                    <span className={`w-1.5 h-1.5 rounded-full ${statusDot[status]}`}></span>
                                    {statusLabel[status]}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Voice selector */}
                            {status === 'idle' && (
                                <select
                                    value={selectedVoice}
                                    onChange={e => setSelectedVoice(e.target.value)}
                                    className="text-[11px] bg-white/20 border border-white/30 text-white rounded-lg px-2 py-1 focus:outline-none backdrop-blur-sm"
                                >
                                    {VOICES.map(v => <option key={v} value={v} className="text-gray-900">{v}</option>)}
                                </select>
                            )}
                            <button onClick={handleClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                                <CloseIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Waveform bars */}
                    <div className="flex items-center justify-center gap-1 py-4 bg-gray-50 dark:bg-[#0a0a0a] shrink-0">
                        {Array.from({ length: 11 }).map((_, i) => (
                            <div
                                key={i}
                                className={`w-1.5 rounded-full transition-all ${status === 'active' ? 'bg-emerald-500 animate-bounce' : 'bg-gray-200 dark:bg-gray-700'}`}
                                style={{
                                    height: status === 'active' ? `${16 + (i % 3) * 10}px` : '6px',
                                    animationDelay: `${i * 70}ms`,
                                }}
                            />
                        ))}
                    </div>

                    {/* Transcript */}
                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 min-h-[80px]">
                        {transcript.length === 0 && !currentTurn.you && !currentTurn.ai && (
                            <p className="text-center text-xs text-gray-400 dark:text-gray-600 py-4">
                                {status === 'idle' ? 'Press "Start" below and speak with Gemini' : 'Conversation transcript will appear here...'}
                            </p>
                        )}
                        {transcript.map((item, i) => (
                            <div key={i} className={`flex ${item.role === 'you' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${item.role === 'you'
                                    ? 'bg-emerald-500 text-white rounded-tr-sm'
                                    : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-sm'}`}>
                                    {item.text}
                                </div>
                            </div>
                        ))}
                        {/* Live current turn */}
                        {currentTurn.you && (
                            <div className="flex justify-end">
                                <div className="max-w-[80%] bg-emerald-400/60 text-white rounded-2xl rounded-tr-sm px-3 py-2 text-xs italic">{currentTurn.you}</div>
                            </div>
                        )}
                        {currentTurn.ai && (
                            <div className="flex justify-start">
                                <div className="max-w-[80%] bg-gray-100 dark:bg-gray-800/70 rounded-2xl rounded-tl-sm px-3 py-2 text-xs text-gray-600 dark:text-gray-300 italic">{currentTurn.ai}</div>
                            </div>
                        )}
                        <div ref={transcriptEndRef} />
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mx-4 mb-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-xs border border-red-100 dark:border-red-900/40">
                            ⚠️ {error}
                        </div>
                    )}

                    {/* Controls */}
                    <div className="p-4 border-t border-gray-100 dark:border-gray-800 shrink-0 flex justify-center gap-3">
                        {(status === 'idle' || status === 'error') && (
                            <button
                                onClick={startSession}
                                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-2xl shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95"
                            >
                                <MicIcon className="w-4 h-4" /> Start Listening
                            </button>
                        )}
                        {status === 'connecting' && (
                            <div className="flex items-center gap-2 px-6 py-2.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-sm font-semibold rounded-2xl">
                                <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                                Connecting...
                            </div>
                        )}
                        {status === 'active' && (
                            <button
                                onClick={stopSession}
                                className="flex items-center gap-2 px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-2xl shadow-lg shadow-red-500/30 transition-all hover:scale-105 active:scale-95"
                            >
                                <StopIcon className="w-4 h-4" /> End Conversation
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* FAB */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`pointer-events-auto flex items-center justify-center w-14 h-14 rounded-[20px] shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 ${
                    isOpen
                        ? 'bg-gray-800 dark:bg-white text-white dark:text-gray-900'
                        : 'bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-emerald-500/30'
                }`}
            >
                {isOpen ? (
                    <CloseIcon className="w-6 h-6 transition-transform duration-300" />
                ) : (
                    <div className="relative">
                        <PhoneIcon className="w-6 h-6" />
                        {status === 'active' && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 border-2 border-teal-600 rounded-full animate-pulse" />
                        )}
                    </div>
                )}
            </button>
        </div>
    );
};

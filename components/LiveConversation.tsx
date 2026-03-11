import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { LiveServerMessage } from '@google/genai';
import { connectLive } from '../services/geminiService';
import { decode, decodeAudioData, encode } from '../utils/helpers';
import { ActionButton } from './common/ActionButton';
import { MicIcon, StopIcon, ZapIcon } from './icons/Icons';

type Transcription = {
    user: string;
    model: string;
};

const VOICES = ['Zephyr', 'Puck', 'Charon', 'Kore', 'Fenrir'];

export const LiveConversation: React.FC = () => {
    const [isConnecting, setIsConnecting] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
    const [currentTranscription, setCurrentTranscription] = useState<Transcription>({user: '', model: ''});
    
    const [selectedVoice, setSelectedVoice] = useState('Zephyr');
    const [useVideo, setUseVideo] = useState(false);

    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const frameIntervalRef = useRef<number | null>(null);

    const stopConversation = useCallback(async () => {
        setIsActive(false);
        setIsConnecting(false);

        if (sessionPromiseRef.current) {
            try {
                const session = await sessionPromiseRef.current;
                session.close();
            } catch (e) {
                console.error("Error closing session:", e);
            }
            sessionPromiseRef.current = null;
        }

        // Stop Audio
        scriptProcessorRef.current?.disconnect();
        sourceRef.current?.disconnect();
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        inputAudioContextRef.current?.close();
        outputAudioContextRef.current?.close();

        // Stop Video
        if (frameIntervalRef.current) {
            window.clearInterval(frameIntervalRef.current);
            frameIntervalRef.current = null;
        }

        inputAudioContextRef.current = null;
        outputAudioContextRef.current = null;
        mediaStreamRef.current = null;
        scriptProcessorRef.current = null;
        sourceRef.current = null;
        
        for (const source of sourcesRef.current.values()) {
            source.stop();
        }
        sourcesRef.current.clear();
        nextStartTimeRef.current = 0;

    }, []);


    const startConversation = async () => {
        setIsConnecting(true);
        setError(null);
        setTranscriptions([]);
        setCurrentTranscription({user: '', model: ''});

        try {
            const constraints = { audio: true, video: useVideo };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            mediaStreamRef.current = stream;

            if (useVideo && videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }

            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            const outputNode = outputAudioContextRef.current.createGain();
            outputNode.connect(outputAudioContextRef.current.destination);

            const callbacks = {
                onopen: () => {
                    setIsConnecting(false);
                    setIsActive(true);
                    
                    // Audio Setup
                    const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
                    sourceRef.current = source;
                    const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                    scriptProcessorRef.current = scriptProcessor;

                    scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        const l = inputData.length;
                        const int16 = new Int16Array(l);
                        for (let i = 0; i < l; i++) {
                            int16[i] = inputData[i] * 32768;
                        }
                        const pcmBlob = {
                            data: encode(new Uint8Array(int16.buffer)),
                            mimeType: 'audio/pcm;rate=16000',
                        };
                        sessionPromiseRef.current?.then((session) => {
                            session.sendRealtimeInput({ media: pcmBlob });
                        });
                    };
                    source.connect(scriptProcessor);
                    scriptProcessor.connect(inputAudioContextRef.current!.destination);

                    // Video Setup
                    if (useVideo && videoRef.current && canvasRef.current) {
                        const ctx = canvasRef.current.getContext('2d');
                        frameIntervalRef.current = window.setInterval(() => {
                            if (videoRef.current && ctx && sessionPromiseRef.current) {
                                canvasRef.current!.width = videoRef.current.videoWidth * 0.5; // Scale down for performance
                                canvasRef.current!.height = videoRef.current.videoHeight * 0.5;
                                ctx.drawImage(videoRef.current, 0, 0, canvasRef.current!.width, canvasRef.current!.height);
                                const base64 = canvasRef.current!.toDataURL('image/jpeg', 0.7).split(',')[1];
                                sessionPromiseRef.current.then(session => {
                                    session.sendRealtimeInput({ media: { mimeType: 'image/jpeg', data: base64 } });
                                });
                            }
                        }, 500); // 2 FPS is usually sufficient for live interaction context
                    }
                },
                onmessage: async (message: LiveServerMessage) => {
                    if (message.serverContent?.outputTranscription) {
                        setCurrentTranscription(prev => ({...prev, model: prev.model + message.serverContent!.outputTranscription!.text}))
                    }
                    if (message.serverContent?.inputTranscription) {
                        setCurrentTranscription(prev => ({...prev, user: prev.user + message.serverContent!.inputTranscription!.text}))
                    }
                    if (message.serverContent?.turnComplete) {
                        setTranscriptions(prev => [...prev, currentTranscription]);
                        setCurrentTranscription({user: '', model: ''});
                    }

                    const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                    if (base64Audio && outputAudioContextRef.current) {
                        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime);
                        const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current, 24000, 1);
                        const source = outputAudioContextRef.current.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(outputNode);
                        source.addEventListener('ended', () => {
                            sourcesRef.current.delete(source);
                        });
                        source.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += audioBuffer.duration;
                        sourcesRef.current.add(source);
                    }

                    if (message.serverContent?.interrupted) {
                         for (const source of sourcesRef.current.values()) {
                            source.stop();
                         }
                        sourcesRef.current.clear();
                        nextStartTimeRef.current = 0;
                    }
                },
                onerror: (e: ErrorEvent) => {
                    console.error('Live API Error:', e);
                    setError('A connection error occurred.');
                    stopConversation();
                },
                onclose: (e: CloseEvent) => {
                    stopConversation();
                },
            };
            
            sessionPromiseRef.current = connectLive(callbacks, "You are a friendly and helpful AI assistant.", selectedVoice);

        } catch (e) {
            console.error('Error starting conversation:', e);
            setError('Could not access microphone/camera. Please grant permission.');
            setIsConnecting(false);
        }
    };
    
    useEffect(() => {
        return () => {
            stopConversation();
        };
    }, [stopConversation]);

    return (
        <div className="p-4 flex flex-col h-full">
            <div className="mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    Live Conversation
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full animate-pulse">Real-time</span>
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Speak with Gemini. Enable video to show it your world.</p>
            </div>

            <div className="flex flex-wrap justify-center gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold uppercase text-gray-500">Voice</label>
                    <select 
                        value={selectedVoice} 
                        onChange={(e) => setSelectedVoice(e.target.value)}
                        disabled={isActive || isConnecting}
                        className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm"
                    >
                        {VOICES.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                </div>
                
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold uppercase text-gray-500">Video Input</label>
                    <button
                        onClick={() => setUseVideo(!useVideo)}
                        disabled={isActive || isConnecting}
                        className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${useVideo ? 'bg-cyan-100 border-cyan-300 text-cyan-700' : 'bg-white border-gray-300 text-gray-600 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'}`}
                    >
                        {useVideo ? 'Camera On' : 'Camera Off'}
                    </button>
                </div>
            </div>

            {/* Hidden elements for video processing */}
            <video ref={videoRef} className={`mx-auto mb-4 rounded-lg max-h-60 bg-black ${isActive && useVideo ? 'block' : 'hidden'}`} muted playsInline />
            <canvas ref={canvasRef} className="hidden" />

            <div className="mb-6 flex justify-center">
                {!isActive && !isConnecting && (
                    <ActionButton onClick={startConversation} icon={<MicIcon className="w-5 h-5"/>}>Start Conversation</ActionButton>
                )}
                 {(isActive || isConnecting) && (
                    <ActionButton onClick={stopConversation} isLoading={isConnecting} icon={!isConnecting ? <StopIcon className="w-5 h-5"/> : undefined} className="bg-red-600 hover:bg-red-700 focus:ring-red-500">
                        {isConnecting ? 'Connecting...' : 'Stop Conversation'}
                    </ActionButton>
                )}
            </div>

            {error && <p className="text-center text-red-500 dark:text-red-400 mb-4">{error}</p>}
            
            <div className="flex-grow bg-gray-100 dark:bg-gray-800/50 rounded-lg p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-400px)]">
                {transcriptions.map((t, i) => (
                    <div key={i}>
                        <p><strong className="text-cyan-600 dark:text-cyan-400">You:</strong> {t.user}</p>
                        <p><strong className="text-purple-600 dark:text-purple-400">Gemini:</strong> {t.model}</p>
                    </div>
                ))}
                {(currentTranscription.user || currentTranscription.model) && (
                     <div>
                        {currentTranscription.user && <p className="text-gray-500 dark:text-gray-400"><strong className="text-cyan-600 dark:text-cyan-400">You:</strong> {currentTranscription.user}</p>}
                        {currentTranscription.model && <p className="text-gray-500 dark:text-gray-400"><strong className="text-purple-600 dark:text-purple-400">Gemini:</strong> {currentTranscription.model}</p>}
                    </div>
                )}
                 {!isActive && transcriptions.length === 0 && <p className="text-gray-500 dark:text-gray-400">Conversation transcript will appear here.</p>}
            </div>
        </div>
    );
};
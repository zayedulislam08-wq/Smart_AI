import React, { useState, useRef } from 'react';
import { analyzeVideoFrames, generateGroundedContent } from '../services/geminiService';
import { ActionButton } from './common/ActionButton';
import { LoadingSpinner } from './common/LoadingSpinner';
import { VideoIcon, UploadIcon, BrainIcon, SearchIcon, CopyIcon, SettingsIcon } from './icons/Icons';
import { copyToClipboard } from '../utils/exportUtils';

type VideoSource = 'file' | 'url' | 'youtube';
type YouTubeMode = 'single' | 'playlist';
type OutputFilter = 'all' | 'summary' | 'points' | 'transcript';
type DetailLength = 'general' | 'high' | 'maximum';

interface PlaylistItem {
    id: string;
    title: string;
    url: string;
    selected: boolean;
}

const LANGUAGES = ['Same as Video', 'English', 'Spanish', 'French', 'German', 'Bengali', 'Hindi', 'Chinese', 'Japanese'];

export const VideoAnalyzer: React.FC = () => {
    // Source State
    const [source, setSource] = useState<VideoSource>('file');
    const [youtubeMode, setYoutubeMode] = useState<YouTubeMode>('single');
    
    // Input State
    const [videoSrc, setVideoSrc] = useState<string | null>(null);
    const [urlInput, setUrlInput] = useState('');
    const [fileName, setFileName] = useState<string>('');
    const [youtubeId, setYoutubeId] = useState<string | null>(null);
    
    // Playlist State
    const [playlistItems, setPlaylistItems] = useState<PlaylistItem[]>([]);
    const [isFetchingPlaylist, setIsFetchingPlaylist] = useState(false);

    // Processing State
    const [isExtracting, setIsExtracting] = useState(false);
    const [extractionProgress, setExtractionProgress] = useState(0);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    
    // Output & Config State
    const [analysisResult, setAnalysisResult] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [outputFilter, setOutputFilter] = useState<OutputFilter>('all');
    const [copyFeedback, setCopyFeedback] = useState('');
    
    // Settings State
    const [showSettings, setShowSettings] = useState(false);
    const [outputLanguage, setOutputLanguage] = useState<string>('Same as Video');
    const [detailLength, setDetailLength] = useState<DetailLength>('high');
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // --- Helpers ---
    const getYouTubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    // --- Handlers ---
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setVideoSrc(url);
            setFileName(file.name);
            setYoutubeId(null);
            setAnalysisResult('');
            setError(null);
        }
    };

    const handleUrlSubmit = () => {
        if (!urlInput.trim()) return;

        setAnalysisResult('');
        setError(null);

        if (source === 'youtube') {
            if (youtubeMode === 'single') {
                const id = getYouTubeId(urlInput);
                if (id) {
                    setYoutubeId(id);
                    setVideoSrc(urlInput);
                    setFileName('YouTube Video');
                } else {
                    setError("Invalid YouTube URL. Please check the link.");
                }
            } else {
                handleFetchPlaylist(urlInput);
            }
        } else {
            setVideoSrc(urlInput);
            setFileName('Remote Video');
            setYoutubeId(null);
        }
    };

    const handleFetchPlaylist = async (url: string) => {
        setIsFetchingPlaylist(true);
        setError(null);
        setPlaylistItems([]);

        try {
            const prompt = `I have a YouTube playlist link: ${url}. 
            Please search for this playlist and list the titles and direct URLs of the first 10 videos in it.
            
            Strictly format the output as a valid JSON array of objects, like this:
            [{"title": "Video Title 1", "url": "https://youtube.com/watch?v=..."}, {"title": "Video Title 2", "url": "..."}]
            
            Do not include any Markdown formatting (like \`\`\`json), just the raw JSON string.`;

            const res = await generateGroundedContent(prompt, 'googleSearch');
            let jsonStr = res.text.replace(/```json/g, '').replace(/```/g, '').trim();
            
            const firstBracket = jsonStr.indexOf('[');
            const lastBracket = jsonStr.lastIndexOf(']');
            if (firstBracket !== -1 && lastBracket !== -1) {
                jsonStr = jsonStr.substring(firstBracket, lastBracket + 1);
            }

            try {
                const videos = JSON.parse(jsonStr);
                if (Array.isArray(videos)) {
                    setPlaylistItems(videos.map((v: any, idx: number) => ({
                        id: String(idx),
                        title: v.title,
                        url: v.url,
                        selected: true 
                    })));
                } else {
                    throw new Error("Invalid JSON format");
                }
            } catch (parseError) {
                console.error("JSON Parse Error", parseError, jsonStr);
                setError("Could not automatically list videos from this playlist. Try analyzing videos individually.");
            }
        } catch (e) {
            setError("Failed to fetch playlist info. The link might be private or invalid.");
        } finally {
            setIsFetchingPlaylist(false);
        }
    };

    const toggleVideoSelection = (id: string) => {
        setPlaylistItems(prev => prev.map(item => 
            item.id === id ? { ...item, selected: !item.selected } : item
        ));
    };

    const playPlaylistItem = (url: string) => {
        const id = getYouTubeId(url);
        if (id) {
            setYoutubeId(id);
            setVideoSrc(url);
            if (source !== 'youtube') setSource('youtube');
        }
    };

    const analyzeSinglePlaylistItem = (id: string) => {
        setPlaylistItems(prev => prev.map(item => ({
            ...item,
            selected: item.id === id
        })));
        setTimeout(() => handleAnalyze(), 100);
    };

    const extractFrames = async (): Promise<{mimeType: string, data: string}[]> => {
        return new Promise(async (resolve, reject) => {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (!video || !canvas) return reject("Video or Canvas not initialized");

            const ctx = canvas.getContext('2d');
            if (!ctx) return reject("Canvas context error");

            const duration = video.duration;
            if (isNaN(duration) || duration === 0) return reject("Invalid video duration");

            const frames: {mimeType: string, data: string}[] = [];
            const sampleCount = 20;
            const interval = duration / sampleCount;

            let currentTime = 0;
            setIsExtracting(true);

            const seekResolve = () => new Promise<void>(res => {
                const onSeek = () => {
                    video.removeEventListener('seeked', onSeek);
                    res();
                };
                video.addEventListener('seeked', onSeek);
            });

            try {
                for (let i = 0; i < sampleCount; i++) {
                    video.currentTime = currentTime;
                    await seekResolve();

                    canvas.width = video.videoWidth / 2;
                    canvas.height = video.videoHeight / 2;
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                    const base64 = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
                    frames.push({ mimeType: 'image/jpeg', data: base64 });

                    setExtractionProgress(Math.round(((i + 1) / sampleCount) * 100));
                    currentTime += interval;
                }
                resolve(frames);
            } catch (e) {
                reject(e);
            } finally {
                setIsExtracting(false);
            }
        });
    };

    const handleAnalyze = async () => {
        if (!videoSrc && playlistItems.filter(p => p.selected).length === 0) {
            setError("Please load a video or select playlist items first.");
            return;
        }

        setIsAnalyzing(true);
        setError(null);
        setAnalysisResult('');
        setOutputFilter('all');

        // --- 1. CONFIGURATION LOGIC ---
        const langInstruction = outputLanguage === 'Same as Video'
            ? "detect the primary language spoken in the video and write the response IN THAT SAME LANGUAGE"
            : `write the response entirely in ${outputLanguage}`;

        let detailInstruction = '';
        switch (detailLength) {
            case 'general':
                detailInstruction = "Overview: Concise. Core Points: Top 3-5 only. Transcript: Brief summary.";
                break;
            case 'maximum':
                detailInstruction = "Overview: Detailed. Core Points: All details (10+ points). Transcript: Chronological and granular.";
                break;
            default: // high
                detailInstruction = "Overview: Standard. Core Points: Key takeaways (5-8 points). Transcript: Clear summary.";
                break;
        }

        const formatInstruction = `
        STRICT OUTPUT FORMATTING:
        You must use the following exact bracketed headers to separate sections. Do not use markdown hashtags (##) for these main headers.
        
        [SECTION: SUMMARY]
        (Write the Executive Summary here)
        
        [SECTION: POINTS]
        (List the Core Points here)
        
        [SECTION: TRANSCRIPT]
        (Write the Transcript Summary here)
        `;

        try {
            if (source === 'youtube') {
                if (youtubeMode === 'single') {
                    const prompt = `
                    TARGET VIDEO: ${videoSrc}
                    
                    TASK:
                    1. Perform a Google Search to identify this specific YouTube video by URL.
                    2. Find its title, description, and available transcript or summary.
                    3. Based on the search results, analyze the video content.
                    
                    SETTINGS:
                    - Language: Please ${langInstruction}.
                    - Detail Level: ${detailLength} (${detailInstruction}).
                    
                    ${formatInstruction}
                    `;

                    const res = await generateGroundedContent(prompt, 'googleSearch');
                    setAnalysisResult(res.text || "No analysis generated.");
                } else {
                    const selectedVideos = playlistItems.filter(p => p.selected);
                    if (selectedVideos.length === 0) throw new Error("No videos selected.");

                    let aggregatedResult = `Playlist Analysis (${selectedVideos.length} Videos)\n\n`;

                    for (const video of selectedVideos) {
                        const prompt = `
                        TARGET VIDEO: "${video.title}" (${video.url})
                        
                        TASK: Analyze this specific video found via Google Search.
                        
                        SETTINGS:
                        - Language: ${langInstruction}.
                        - Detail: ${detailInstruction}.
                        
                        ${formatInstruction}
                        `;
                        
                        const res = await generateGroundedContent(prompt, 'googleSearch');
                        aggregatedResult += `VIDEO START: ${video.title}\n${res.text}\nVIDEO END\n\n`;
                    }
                    setAnalysisResult(aggregatedResult);
                }
            } else {
                const frames = await extractFrames();
                if (frames.length === 0) throw new Error("Could not extract frames.");

                const prompt = `
                TASK: Analyze the provided video frames to generate a report.
                
                SETTINGS:
                - Language: Please ${langInstruction}.
                - Detail Level: ${detailLength} (${detailInstruction}).
                
                ${formatInstruction}
                `;

                const result = await analyzeVideoFrames(prompt, frames);
                setAnalysisResult(result);
            }

        } catch (e: any) {
            console.error(e);
            let msg = "Analysis failed.";
            if (e.message && e.message.includes("CORS")) {
                msg = "Cannot access video data due to CORS security restrictions. For Direct URLs, use the YouTube tab if it's a YouTube link.";
            } else {
                msg = e.message || "An unknown error occurred.";
            }
            setError(msg);
        } finally {
            setIsAnalyzing(false);
            setExtractionProgress(0);
        }
    };

    const handleApplySettings = () => {
        setShowSettings(false);
        handleAnalyze();
    };

    const handleCopy = () => {
        const textToCopy = getFilteredContent();
        copyToClipboard(textToCopy).then(() => {
            setCopyFeedback('Copied!');
            setTimeout(() => setCopyFeedback(''), 2000);
        });
    };

    const getFilteredContent = () => {
        if (!analysisResult) return '';
        if (analysisResult.includes("VIDEO START:")) return analysisResult;

        const summaryRegex = /\[SECTION:\s*SUMMARY\]([\s\S]*?)(?=\[SECTION:\s*POINTS\]|$)/i;
        const pointsRegex = /\[SECTION:\s*POINTS\]([\s\S]*?)(?=\[SECTION:\s*TRANSCRIPT\]|$)/i;
        const transcriptRegex = /\[SECTION:\s*TRANSCRIPT\]([\s\S]*?)(?=$)/i;

        const cleanText = (text: string) => {
            return text.trim();
        };

        let match;
        
        if (outputFilter === 'all') {
            let display = "";
            
            match = analysisResult.match(summaryRegex);
            if (match) display += `### Executive Summary\n${cleanText(match[1])}\n\n`;
            
            match = analysisResult.match(pointsRegex);
            if (match) display += `### Core Points\n${cleanText(match[1])}\n\n`;
            
            match = analysisResult.match(transcriptRegex);
            if (match) display += `### Transcript Summary\n${cleanText(match[1])}`;
            
            return display || analysisResult;
        }

        switch (outputFilter) {
            case 'summary':
                match = analysisResult.match(summaryRegex);
                return match ? cleanText(match[1]) : "Executive Summary section not found.";
            case 'points':
                match = analysisResult.match(pointsRegex);
                return match ? cleanText(match[1]) : "Core Points section not found.";
            case 'transcript':
                match = analysisResult.match(transcriptRegex);
                return match ? cleanText(match[1]) : "Transcript Summary section not found.";
        }
        return analysisResult;
    };

    return (
        <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full animate-fade-in pb-10">
            {/* Header */}
            <div className="text-center sm:text-left mb-2 mt-4 md:mt-0">
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-400 mb-2">Video Intelligence</h2>
                <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">Deep analysis for native video files, direct streams, and YouTube Playlists.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                {/* --- LEFT COLUMN: INPUT --- */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 dark:border-gray-800 p-5 sm:p-7">
                        
                        {/* Source Selection - iOS Style */}
                        <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-full mb-6 relative">
                            <button onClick={() => {setSource('file'); setVideoSrc(null); setYoutubeId(null);}} className={`flex-1 flex justify-center items-center py-2.5 rounded-full text-sm font-semibold transition-all duration-300 z-10 ${source === 'file' ? 'bg-white dark:bg-gray-700 text-red-600 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>Local File</button>
                            <button onClick={() => {setSource('url'); setVideoSrc(null); setYoutubeId(null);}} className={`flex-1 flex justify-center items-center py-2.5 rounded-full text-sm font-semibold transition-all duration-300 z-10 ${source === 'url' ? 'bg-white dark:bg-gray-700 text-red-600 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>Direct URL</button>
                            <button onClick={() => {setSource('youtube'); setVideoSrc(null); setYoutubeId(null);}} className={`flex-1 flex justify-center items-center py-2.5 rounded-full text-sm font-semibold transition-all duration-300 z-10 ${source === 'youtube' ? 'bg-red-600 text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>YouTube</button>
                        </div>

                        {/* YouTube Specific Sub-Options */}
                        {source === 'youtube' && (
                            <div className="flex items-center gap-4 bg-red-50 dark:bg-red-900/10 p-3 rounded-xl border border-red-100 dark:border-red-900/30 mb-6 animate-in slide-in-from-top-2">
                                <label className="flex flex-1 items-center justify-center gap-2 text-sm font-medium text-red-700 dark:text-red-300 cursor-pointer">
                                    <input type="radio" name="ytMode" checked={youtubeMode === 'single'} onChange={() => setYoutubeMode('single')} className="text-red-600 w-4 h-4 focus:ring-red-500" />
                                    Single Video
                                </label>
                                <label className="flex flex-1 items-center justify-center gap-2 text-sm font-medium text-red-700 dark:text-red-300 cursor-pointer border-l border-red-200 dark:border-red-900/50 pl-4">
                                    <input type="radio" name="ytMode" checked={youtubeMode === 'playlist'} onChange={() => { setYoutubeMode('playlist'); setVideoSrc(null); setYoutubeId(null); }} className="text-red-600 w-4 h-4 focus:ring-red-500" />
                                    Playlist
                                </label>
                            </div>
                        )}

                        {/* INPUTS BASED ON SOURCE */}
                        {source === 'file' && (
                             <label className="block w-full cursor-pointer bg-gray-50 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-2xl p-8 text-center hover:border-red-400 dark:hover:border-red-600 transition-all shadow-sm group mb-6">
                                 <UploadIcon className="mx-auto h-10 w-10 text-gray-400 group-hover:text-red-500 transition-colors" />
                                 <span className="mt-3 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    {fileName ? <span className="text-red-600 dark:text-red-400">{fileName}</span> : 'Tap to Upload Video (.mp4, .webm)'}
                                 </span>
                                 <input type="file" onChange={handleFileChange} className="hidden" accept="video/mp4,video/webm,video/quicktime" />
                            </label>
                        )}

                        {(source === 'url' || source === 'youtube') && (
                            <div className="space-y-3 mb-6 animate-in slide-in-from-top-2">
                                 <div className="flex flex-col sm:flex-row gap-3">
                                    <input 
                                        type="text" 
                                        value={urlInput} 
                                        onChange={(e) => setUrlInput(e.target.value)} 
                                        placeholder={source === 'youtube' ? (youtubeMode === 'single' ? "Paste YouTube Video Link" : "Paste YouTube Playlist Link") : "Direct .mp4 URL (e.g. https://.../video.mp4)"}
                                        className="flex-grow bg-gray-50 dark:bg-gray-800/50 p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 text-[15px] transition-shadow shadow-inner"
                                    />
                                    <button onClick={handleUrlSubmit} className={`px-6 py-3.5 rounded-xl text-white font-bold shadow-md active:scale-95 transition-all text-sm flex-shrink-0 ${source === 'youtube' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-500 hover:bg-orange-600'}`}>
                                        {source === 'youtube' && youtubeMode === 'single' ? 'Embed' : (youtubeMode === 'playlist' ? 'Fetch Playlist' : 'Load Video')}
                                    </button>
                                 </div>
                            </div>
                        )}

                        {/* Playlist Selection UI */}
                        {source === 'youtube' && youtubeMode === 'playlist' && (
                            <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 max-h-[300px] overflow-y-auto mb-6 shadow-inner">
                                {isFetchingPlaylist && (
                                    <div className="p-8 flex justify-center"><LoadingSpinner className="text-red-600 w-8 h-8"/></div>
                                )}
                                {!isFetchingPlaylist && playlistItems.length > 0 && (
                                    <div className="p-2 divide-y divide-gray-100 dark:divide-gray-700/50">
                                        <div className="p-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex justify-between bg-gray-50 dark:bg-gray-800/80 rounded-t-lg">
                                            <span>Select videos to analyze</span>
                                            <span className="text-red-500">{playlistItems.filter(p => p.selected).length} selected</span>
                                        </div>
                                        {playlistItems.map((item) => (
                                            <div key={item.id} className="flex items-center gap-3 p-3 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg group transition-colors cursor-pointer" onClick={() => toggleVideoSelection(item.id)}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={item.selected} 
                                                    onChange={() => {}} // Handled by div click
                                                    className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                <div className="flex-grow text-sm overflow-hidden" onClick={(e) => { e.stopPropagation(); playPlaylistItem(item.url); }}>
                                                    <div className="font-semibold text-gray-800 dark:text-gray-200 line-clamp-1">{item.title}</div>
                                                    <div className="text-[11px] text-gray-500 truncate mt-0.5">{item.url}</div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button onClick={(e) => { e.stopPropagation(); playPlaylistItem(item.url); }} className="p-2 text-gray-400 hover:text-red-600 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-colors shadow-sm" title="Preview Video"><VideoIcon className="w-4 h-4" /></button>
                                                    <button onClick={(e) => { e.stopPropagation(); analyzeSinglePlaylistItem(item.id); }} className="p-2 text-gray-400 hover:text-orange-500 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-colors shadow-sm" title="Analyze This Video Only"><BrainIcon className="w-4 h-4" /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {!isFetchingPlaylist && playlistItems.length === 0 && (
                                    <div className="p-8 text-center text-sm text-gray-400 flex flex-col items-center">
                                        <VideoIcon className="w-8 h-8 mb-2 opacity-20"/>
                                        Enter a playlist URL and click "Fetch Playlist"
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Video Preview (Single Mode) */}
                        {(source !== 'youtube' || youtubeMode === 'single' || (youtubeMode === 'playlist' && (videoSrc || youtubeId))) && (
                            <div className="bg-black rounded-2xl overflow-hidden relative group min-h-[200px] flex items-center justify-center bg-gray-900 border border-gray-800 shadow-xl shadow-black/10 mb-6">
                                <video ref={videoRef} src={(!youtubeId && videoSrc) ? videoSrc : undefined} className="hidden" crossOrigin="anonymous" />
                                <canvas ref={canvasRef} className="hidden" />

                                {youtubeId ? (
                                    <iframe 
                                        className="w-full aspect-video border-0" 
                                        src={`https://www.youtube.com/embed/${youtubeId}?origin=${typeof window !== 'undefined' ? window.location.origin : ''}`} 
                                        title="YouTube video player" 
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                        allowFullScreen
                                    ></iframe>
                                ) : videoSrc ? (
                                    <video src={videoSrc} controls className="w-full max-h-[300px]" />
                                ) : (
                                    <div className="text-gray-600 flex flex-col items-center p-12">
                                        <VideoIcon className="w-12 h-12 opacity-20 mb-3" />
                                        <span className="text-sm font-medium opacity-50">Video Preview</span>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="mt-auto">
                            <ActionButton 
                                onClick={handleAnalyze} 
                                isLoading={isAnalyzing || isExtracting} 
                                disabled={(!videoSrc && playlistItems.filter(p => p.selected).length === 0)} 
                                icon={source === 'youtube' ? <SearchIcon className="w-5 h-5"/> : <BrainIcon className="w-5 h-5"/>} 
                                className={`w-full text-base py-4 shadow-lg active:scale-[0.98] ${source === 'youtube' ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500 shadow-red-500/20' : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-red-500/20 text-white'}`}
                            >
                                {isExtracting ? `Extracting Frames (${extractionProgress}%)...` : (isAnalyzing ? (source === 'youtube' ? 'Analyzing via Search...' : 'Analyzing Frames...') : (source === 'youtube' ? (youtubeMode === 'playlist' ? `Analyze Selected (${playlistItems.filter(p=>p.selected).length})` : 'Analyze YouTube Video') : 'Analyze Video Frames'))}
                            </ActionButton>
                            {error && (
                                <div className="mt-4 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl border border-red-100 dark:border-red-900/50 text-sm animate-in fade-in">
                                    <span>⚠️</span> {error}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- RIGHT COLUMN: OUTPUT --- */}
                <div className="lg:col-span-7">
                    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 dark:border-gray-800 flex flex-col h-full min-h-[500px] overflow-hidden relative">
                        
                        {/* Output Header with Tabs */}
                        <div className="flex flex-col border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                            <div className="p-5 flex justify-between items-center relative">
                                <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800 dark:text-gray-100">
                                    Analysis Results
                                </h3>
                                
                                <div className="flex items-center gap-2">
                                    <button onClick={handleCopy} disabled={!analysisResult} className="flex items-center gap-1.5 text-xs font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 transition-all shadow-sm disabled:opacity-50">
                                        {copyFeedback ? <span className="text-green-600">{copyFeedback}</span> : <><CopyIcon className="w-4 h-4" /> Copy</>}
                                    </button>
                                    
                                    <button onClick={() => setShowSettings(!showSettings)} className={`p-2 rounded-xl transition-all border shadow-sm ${showSettings ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'} `} title="Configuration Settings">
                                        <SettingsIcon className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Settings Popover */}
                                {showSettings && (
                                    <div className="absolute top-14 right-4 z-20 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-4 animate-in fade-in zoom-in-95 origin-top-right">
                                        <h4 className="text-xs font-bold uppercase tracking-widest mb-4 text-gray-400 border-b pb-2 border-gray-100 dark:border-gray-700">Analysis Configuration</h4>
                                        
                                        <div className="mb-5">
                                            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-2">Output Language</label>
                                            <select value={outputLanguage} onChange={(e) => setOutputLanguage(e.target.value)} className="w-full text-sm p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-red-500 font-medium">
                                                {LANGUAGES.map(lang => (
                                                    <option key={lang} value={lang}>{lang}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="mb-5">
                                            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-2">Detail Length</label>
                                            <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl">
                                                {(['general', 'high', 'maximum'] as const).map(level => (
                                                    <button key={level} onClick={() => setDetailLength(level)} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all capitalize ${detailLength === level ? 'bg-white dark:bg-gray-800 shadow-sm text-red-600 dark:text-red-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                                                        {level}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        <button onClick={handleApplySettings} className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl shadow-md transition-all active:scale-95">
                                            Apply & Re-Analyze
                                        </button>
                                    </div>
                                )}
                            </div>
                            
                            {/* Tabs */}
                            <div className="flex px-2 gap-1 overflow-x-auto pb-0">
                                {(['all', 'summary', 'points', 'transcript'] as const).map(filter => (
                                    <button
                                        key={filter}
                                        onClick={() => setOutputFilter(filter)}
                                        className={`px-5 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                                            outputFilter === filter 
                                            ? 'border-red-500 text-red-600 dark:text-red-400 bg-white/50 dark:bg-gray-800/50 rounded-t-xl' 
                                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/30 dark:hover:bg-gray-800/30 rounded-t-xl'
                                        }`}
                                    >
                                        {filter === 'all' ? 'Full Report' : filter === 'summary' ? 'Executive Summary' : filter === 'points' ? 'Core Points' : 'Transcript Snippets'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        {/* Output Content */}
                        <div className="p-6 sm:p-8 flex-grow relative overflow-y-auto">
                            {(isAnalyzing || isExtracting) && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 dark:bg-gray-900/90 backdrop-blur-md z-10 transition-all duration-500">
                                    <div className="w-20 h-20 rounded-2xl bg-white dark:bg-gray-800 shadow-xl flex items-center justify-center mb-6 relative">
                                        <div className="absolute inset-0 border-4 border-red-500 border-t-transparent rounded-2xl animate-spin"></div>
                                        <BrainIcon className={`w-8 h-8 ${source === 'youtube' ? 'text-red-500' : 'text-orange-500'} animate-pulse`} />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                                            {isExtracting ? 'Scanning Visuals...' : 'Generating Insights...'}
                                        </p>
                                        <p className="text-sm text-gray-500 mt-2 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full inline-block">
                                            Using <span className="font-semibold">{detailLength}</span> detail in <span className="font-semibold">{outputLanguage === 'Same as Video' ? 'detected language' : outputLanguage}</span>
                                        </p>
                                    </div>
                                </div>
                            )}

                            {analysisResult ? (
                                <div className="prose dark:prose-invert max-w-none text-[15px] leading-relaxed animate-in fade-in zoom-in-95 duration-300 pb-10">
                                    <div className="whitespace-pre-wrap">{getFilteredContent()}</div>
                                </div>
                            ) : (
                                !isAnalyzing && !isExtracting && (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 opacity-60 pb-10">
                                        <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-6 mb-4">
                                            <BrainIcon className="w-12 h-12" />
                                        </div>
                                        <p className="text-lg font-medium text-gray-500">Ready for Analysis</p>
                                        <p className="text-sm mt-1 max-w-[250px] text-center">Load a video and click Analyze to generate a comprehensive report.</p>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>
             <style>{`
                .prose h1, .prose h2, .prose h3 { margin-bottom: 0.5em; font-weight: 800; margin-top: 1.5em; color: inherit; letter-spacing: -0.02em; }
                .prose h1 { font-size: 1.5rem; }
                .prose h2 { font-size: 1.25rem; border-bottom: 2px solid #f1f5f9; padding-bottom: 0.4em; }
                .dark .prose h2 { border-color: #334155; }
                .prose strong { font-weight: 700; color: #dc2626; } /* Red-600 */
                .dark .prose strong { color: #f87171; } /* Red-400 */
                .prose ul { list-style-type: none; padding-left: 0; margin-bottom: 1.5em; }
                .prose ul li { position: relative; padding-left: 1.5em; margin-bottom: 0.5em; }
                .prose ul li::before { content: "•"; color: #dc2626; position: absolute; left: 0; font-weight: bold; font-size: 1.2em; line-height: 1; top: -0.1em; }
                .dark .prose ul li::before { color: #f87171; }
             `}</style>
        </div>
    );
};

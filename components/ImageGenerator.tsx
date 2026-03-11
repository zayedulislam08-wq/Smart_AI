import React, { useState } from 'react';
import { generateImage, editImage, generateContent } from '../services/geminiService';
import { fileToBase64 } from '../utils/helpers';
import { ActionButton } from './common/ActionButton';
import { ImageIcon, UploadIcon, ZapIcon, SparklesIcon } from './icons/Icons';
import { LoadingSpinner } from './common/LoadingSpinner';

const aspectRatios = ["1:1", "16:9", "9:16", "4:3", "3:4"];
const STYLES = ['None', 'Photorealistic', 'Cinematic', 'Anime', 'Digital Art', 'Oil Painting', 'Sketch', '3D Render', 'Cyberpunk', 'Watercolor'];

// Wizard Configuration Data
const BANNER_TYPES = ['Banner', 'Flyer', 'Event Banner', 'Course Banner', 'Business Flyer', 'YouTube Channel Art', 'Social Media Post', 'Website Hero'];
const LOGO_POSITIONS = ['Top Left', 'Top Right', 'Bottom Left', 'Bottom Right', 'Center', 'Integrated Naturally'];
const FONT_STYLES = ['Modern Sans-Serif', 'Classic Serif', 'Bold Impact', 'Handwritten', 'Futuristic', 'Minimalist'];
const TEXT_EFFECTS = ['Standard', '3D Render', 'Neon Glow', 'Metallic', 'Gradient', 'Drop Shadow', 'Embossed'];
const TEXT_COLORS = ['Auto', 'White', 'Black', 'Gold', 'Silver', 'Multi-color/Gradient', 'Vibrant', 'Pastel'];

type Mode = 'custom' | 'suggestion';

export const ImageGenerator: React.FC = () => {
    const [mode, setMode] = useState<Mode>('custom');
    
    // Custom mode state
    const [prompt, setPrompt] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState('16:9');
    const [style, setStyle] = useState('Photorealistic');

    // Banner Wizard state
    const [bannerType, setBannerType] = useState('Banner');
    const [topics, setTopics] = useState('');
    const [concept, setConcept] = useState(''); // Acts as the final prompt
    
    // Wizard - Logo & Text
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [logoPosition, setLogoPosition] = useState('Top Right');
    
    const [fontStyle, setFontStyle] = useState('Modern Sans-Serif');
    const [textEffect, setTextEffect] = useState('3D Render');
    const [textColor, setTextColor] = useState('Multi-color/Gradient');

    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isPromptGenerating, setIsPromptGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setLogoPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSmartPromptGen = async () => {
        if (!topics.trim()) {
            setError('Please enter topics to generate a prompt.');
            return;
        }
        setIsPromptGenerating(true);
        setError(null);
        try {
            const metaPrompt = `Create a highly detailed, professional image generation prompt for a ${bannerType}.
            
            Context/Topics: ${topics}
            Visual Style: ${style}
            Typography Settings: ${fontStyle} font with a ${textEffect} effect in ${textColor} color.
            Logo Placement requirement: ${logoPosition}.
            
            The prompt should describe:
            1. The background scenery, lighting, and mood (engaging and high-quality).
            2. How the text (if visualized) should look (${textEffect}, ${textColor}).
            3. Where the negative space should be to accommodate the logo at ${logoPosition}.
            
            Output ONLY the prompt text. Do not include labels like "Prompt:".`;
            
            const response = await generateContent('gemini-2.5-flash', metaPrompt);
            setConcept(response.text || '');
        } catch (e) {
            console.error(e);
            setError('Failed to generate prompt. Please check your connection.');
        } finally {
            setIsPromptGenerating(false);
        }
    };

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);

        try {
            if (mode === 'suggestion') {
                if (!concept) {
                    setError('Please generate or write a prompt in the "Banner Concept" box.');
                    setIsLoading(false);
                    return;
                }
                
                let finalPrompt = concept;

                if (logoFile) {
                    const base64Data = await fileToBase64(logoFile);
                    finalPrompt += ` Incorporate the provided logo image at the ${logoPosition} naturally.`;
                    const response = await editImage(finalPrompt, base64Data, logoFile.type);
                    const newImageBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                    if (newImageBase64) {
                        setGeneratedImage(`data:${logoFile.type};base64,${newImageBase64}`);
                    } else {
                        throw new Error('Could not generate image with logo.');
                    }
                } else {
                    const imageBytes = await generateImage(finalPrompt, aspectRatio, style);
                    setGeneratedImage(`data:image/jpeg;base64,${imageBytes}`);
                }
            } else { 
                if (!prompt.trim()) {
                    setError('Prompt cannot be empty.');
                    setIsLoading(false);
                    return;
                };
                const imageBytes = await generateImage(prompt, aspectRatio, style, negativePrompt);
                setGeneratedImage(`data:image/jpeg;base64,${imageBytes}`);
            }
        } catch (e) {
            console.error(e);
            setError('An error occurred during image generation.');
        } finally {
            setIsLoading(false);
        }
    };

    const renderCustomMode = () => (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Image Prompt</label>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., A cinematic photo of a robot reading a book in a cozy library with warm lighting"
                    rows={4}
                    className="w-full bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white rounded-2xl p-4 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none shadow-inner text-[15px] leading-relaxed"
                />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Aspect Ratio</label>
                    <div className="relative">
                        <select
                            value={aspectRatio}
                            onChange={(e) => setAspectRatio(e.target.value)}
                            className="appearance-none w-full bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white rounded-xl p-3.5 pr-10 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                        >
                            {aspectRatios.map(ar => <option key={ar} value={ar}>{ar}</option>)}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Visual Style</label>
                    <div className="relative">
                        <select
                            value={style}
                            onChange={(e) => setStyle(e.target.value)}
                            className="appearance-none w-full bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white rounded-xl p-3.5 pr-10 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                        >
                            {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                 </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 text-opacity-80">Negative Prompt (Optional)</label>
                <input
                    type="text"
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    placeholder="e.g., blur, dark, text, watermark"
                    className="w-full bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white rounded-xl p-3.5 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
        </div>
    );

    const renderSuggestionMode = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10 rounded-2xl p-5 border border-purple-100 dark:border-purple-800/30">
                <h3 className="text-lg font-bold text-purple-900 dark:text-purple-300 flex items-center gap-2 mb-4">
                    <span className="bg-purple-100 dark:bg-purple-900/40 p-1.5 rounded-lg text-purple-600 dark:text-purple-400"><ZapIcon className="w-4 h-4"/></span>
                    Banner Design Wizard
                </h3>
                
                {/* 1. Basic Config */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                    <div>
                        <label className="block text-[10px] font-bold uppercase text-purple-500 mb-1.5 ml-1">Composition Type</label>
                        <select value={bannerType} onChange={(e) => setBannerType(e.target.value)} className="w-full bg-white dark:bg-gray-800 p-3 rounded-xl border border-purple-100 dark:border-gray-700 text-sm focus:ring-2 focus:ring-purple-500 outline-none shadow-sm">
                            {BANNER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase text-purple-500 mb-1.5 ml-1">Visual Style</label>
                        <select value={style} onChange={(e) => setStyle(e.target.value)} className="w-full bg-white dark:bg-gray-800 p-3 rounded-xl border border-purple-100 dark:border-gray-700 text-sm focus:ring-2 focus:ring-purple-500 outline-none shadow-sm">
                            {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>

                {/* 2. Text Config */}
                <div className="p-4 bg-white/60 dark:bg-gray-800/60 rounded-xl mb-5 border border-white dark:border-gray-700 shadow-sm">
                    <label className="block text-xs font-bold uppercase text-blue-600 dark:text-blue-400 mb-3 ml-1">Typography Settings</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <select value={fontStyle} onChange={(e) => setFontStyle(e.target.value)} className="bg-gray-50 dark:bg-gray-900 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700 text-xs focus:ring-2 focus:ring-blue-500 outline-none">
                            {FONT_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <select value={textEffect} onChange={(e) => setTextEffect(e.target.value)} className="bg-gray-50 dark:bg-gray-900 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700 text-xs focus:ring-2 focus:ring-blue-500 outline-none">
                            {TEXT_EFFECTS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <select value={textColor} onChange={(e) => setTextColor(e.target.value)} className="bg-gray-50 dark:bg-gray-900 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700 text-xs focus:ring-2 focus:ring-blue-500 outline-none">
                            {TEXT_COLORS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>

                {/* 3. Logo Config */}
                <div className="p-4 bg-white/60 dark:bg-gray-800/60 rounded-xl mb-5 border border-white dark:border-gray-700 shadow-sm">
                    <label className="block text-xs font-bold uppercase text-pink-600 dark:text-pink-400 mb-3 ml-1">Brand Logo (Optional)</label>
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <label className="flex-1 w-full flex items-center justify-center cursor-pointer bg-gray-50 hover:bg-pink-50 dark:bg-gray-900 dark:hover:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-600 hover:border-pink-300 rounded-xl p-3 transition-colors">
                            {logoPreview ? (
                                <div className="flex items-center justify-center gap-3">
                                    <img src={logoPreview} alt="Logo" className="h-8 w-8 object-contain rounded" />
                                    <span className="text-sm font-medium text-pink-600">Change Logo</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-gray-400">
                                    <UploadIcon className="w-4 h-4" />
                                    <span className="text-sm font-medium">Upload Logo Image</span>
                                </div>
                            )}
                            <input type="file" onChange={handleLogoChange} className="hidden" accept="image/*"/>
                        </label>
                        <select value={logoPosition} onChange={(e) => setLogoPosition(e.target.value)} className="w-full sm:w-1/3 bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-700 text-xs focus:ring-2 focus:ring-pink-500 outline-none">
                            {LOGO_POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                </div>

                {/* 4. Prompt Generation */}
                <div className="mb-4">
                     <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 ml-1">Subject / Topics</label>
                     <div className="flex flex-col sm:flex-row gap-2">
                        <input type="text" value={topics} onChange={(e) => setTopics(e.target.value)} placeholder="Summer Music Festival, Product Launch..." className="flex-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl p-3 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 outline-none shadow-sm"/>
                        <button 
                            onClick={handleSmartPromptGen}
                            disabled={isPromptGenerating || !topics.trim()}
                            className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-5 py-3 font-semibold shadow-md active:scale-95 transition-all text-sm flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 disabled:active:scale-100"
                        >
                            {isPromptGenerating ? <LoadingSpinner className="w-4 h-4"/> : <SparklesIcon className="w-4 h-4"/>}
                            {isPromptGenerating ? 'Writing...' : 'Draft Prompt'}
                        </button>
                     </div>
                </div>

                 <div className="relative">
                     <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 ml-1">Final Design Prompt</label>
                     <textarea value={concept} onChange={(e) => setConcept(e.target.value)} rows={3} placeholder="The AI generated prompt will appear here, or you can write your own." className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl p-4 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 outline-none shadow-inner font-mono text-[13px] leading-relaxed resize-none"/>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full animate-fade-in pb-10">
            {/* Header */}
            <div className="text-center sm:text-left mb-2 mt-4 md:mt-0">
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500 mb-2">Image Studio</h2>
                <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">Generate stunning visuals with Imagen 3 or use the Banner Wizard for marketing assets.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                
                {/* Control Panel */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 dark:border-gray-800 p-5 sm:p-7">
                        
                        {/* Mode Selectors */}
                        <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-full mb-6 relative">
                            <button 
                                onClick={() => setMode('custom')} 
                                className={`flex-1 flex justify-center items-center py-2.5 rounded-full text-sm font-semibold transition-all duration-300 z-10 ${mode === 'custom' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                            >
                                Freeform
                            </button>
                            <button 
                                onClick={() => setMode('suggestion')} 
                                className={`flex-1 flex justify-center items-center py-2.5 rounded-full text-sm font-semibold transition-all duration-300 z-10 ${mode === 'suggestion' ? 'bg-white dark:bg-gray-700 text-purple-600 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                            >
                                Banner Wizard
                            </button>
                        </div>
                        
                        {mode === 'custom' ? renderCustomMode() : renderSuggestionMode()}

                        <div className="mt-8">
                            <ActionButton onClick={handleGenerate} isLoading={isLoading} icon={<ImageIcon className="w-5 h-5"/>} className="w-full text-base py-4 shadow-lg active:scale-[0.98]">
                                Generate Masterpiece
                            </ActionButton>
                        </div>
                        
                        {error && (
                            <div className="mt-4 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl border border-red-100 dark:border-red-900/50 text-sm animate-in fade-in">
                                <span>⚠️</span> {error}
                            </div>
                        )}
                    </div>
                </div>

                {/* Preview Canvas */}
                <div className="lg:col-span-7">
                    <div className="bg-gray-100 dark:bg-gray-900/50 rounded-[2rem] sm:rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-gray-800 min-h-[400px] lg:min-h-[600px] h-full flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden group transition-colors hover:border-blue-300 dark:hover:border-blue-800">
                        {isLoading ? (
                            <div className="flex flex-col items-center animate-in fade-in duration-500">
                                <div className="w-20 h-20 rounded-2xl bg-white dark:bg-gray-800 shadow-xl flex items-center justify-center mb-6 relative">
                                    <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-2xl animate-spin"></div>
                                    <SparklesIcon className="w-8 h-8 text-blue-500 animate-pulse" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Creating image</h3>
                                <p className="text-gray-500 text-sm mt-1">This usually takes 8-15 seconds...</p>
                            </div>
                        ) : generatedImage ? (
                            <div className="relative w-full h-full flex items-center justify-center animate-in zoom-in-95 duration-500">
                                <img src={generatedImage} alt="AI Generated" className="rounded-xl sm:rounded-2xl max-w-full max-h-full object-contain shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)]" />
                                
                                {/* Image Action overlay */}
                                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                     <a href={generatedImage} download="ai-generated-image.jpg" className="bg-white/90 text-gray-800 hover:text-blue-600 px-4 py-2 rounded-full text-sm font-bold shadow-lg backdrop-blur flex items-center gap-2 transition-all hover:scale-105 active:scale-95">
                                         Download HD
                                     </a>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 opacity-60">
                                <ImageIcon className="w-24 h-24 mb-6 drop-shadow-sm" strokeWidth="1" />
                                <p className="text-lg font-medium">Your canvas is empty</p>
                                <p className="text-sm mt-1">Write a prompt to generate an image</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

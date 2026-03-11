import React, { useState, useCallback, useEffect, useRef } from 'react';
import { editImage } from '../services/geminiService';
import { fileToBase64, getFileType } from '../utils/helpers';
import { ActionButton } from './common/ActionButton';
import { UploadIcon, EditIcon, ZapIcon, ChevronDownIcon, DownloadIcon } from './icons/Icons';

// Organized Command Library based on user request
const CATEGORY_DATA: Record<string, { label: string, prompt: string }[]> = {
    "AI Image Tools": [
        { label: 'AI Clothes Changer', prompt: 'Change the clothes of the person in the image to a modern, stylish business casual outfit. Keep the pose and lighting consistent.' },
        { label: 'AI Background Changer', prompt: 'Change the background of this image to a scenic beach sunset. Ensure the subject is cleanly separated and the lighting blends naturally.' },
        { label: 'AI Image Translator', prompt: 'Translate all text visible in this image to English, preserving the original layout and font style as much as possible.' },
        { label: 'AI Sticker Generator', prompt: 'Convert this image into a high-quality die-cut sticker design with a white border and vibrant colors.' },
        { label: 'Remove Text from Image', prompt: 'Remove all text from this image, filling in the background seamlessly to match the surrounding area.' },
        { label: 'AI Teeth Whitening', prompt: 'Whiten the teeth of the person in the image naturally, improving brightness without making it look artificial.' },
        { label: 'AI Object Remover', prompt: 'Remove the unwanted object [describe object here] from the image and fill the space with the background context.' },
        { label: 'AI Passport Photo Maker', prompt: 'Crop and adjust this photo to meet standard passport photo requirements: white background, neutral expression, and proper face centering.' },
        { label: 'AI Image Upscaler', prompt: 'Upscale this image to high resolution, enhancing details, sharpening edges, and reducing noise.' },
        { label: 'AI Photo Restoration', prompt: 'Restore this old or damaged photo. Fix scratches, tears, and color fading to make it look new.' },
        { label: 'AI Image Extender', prompt: 'Outpaint and extend the borders of this image, generating new scenery that matches the style and context of the original.' },
        { label: 'Image to Image AI', prompt: 'Transform this image into a [describe style, e.g., Cyberpunk, Oil Painting] version while keeping the main structure.' },
    ],
    "AI Banner & Flyer Tools": [
        { label: 'YouTube Channel Art', prompt: 'Transform this image into engaging YouTube Channel Art. Add a cinematic effect and ensure the central area is focused for visibility on all devices.' },
        { label: 'Facebook Cover Photo', prompt: 'Edit this image to create a professional Facebook Cover photo. Enhance lighting and add a welcoming atmosphere suitable for a profile header.' },
        { label: 'Instagram Post', prompt: 'Optimize this image for an Instagram Post. Apply a trendy filter, boost colors, and ensure a balanced composition.' },
        { label: 'Event Flyer', prompt: 'Transform this into an eye-catching Event Flyer background. Add dynamic lighting and energy suitable for a music or corporate event.' },
        { label: 'Business Flyer', prompt: 'Convert this image into a clean, professional Business Flyer background. Mute distracting details to allow for text overlay later.' },
        { label: 'Sale/Promo Banner', prompt: 'Edit this image to look like a Sale Promo banner. Add a vibrant, urgent atmosphere with high contrast and bold visual appeal.' },
        { label: 'Course Banner', prompt: 'Transform this into an educational Online Course banner. Make it look intellectual and inviting, suitable for an e-learning platform.' },
        { label: 'LinkedIn Background', prompt: 'Create a professional LinkedIn Profile Background from this image. Make it subtle, corporate, and trustworthy.' },
        { label: 'Twitter Header', prompt: 'Edit this image for a Twitter Header. Focus on a wide, modern aesthetic suitable for a social media profile.' },
        { label: 'Product Launch Banner', prompt: 'Enhance this image for a Product Launch Banner. Add dramatic spotlighting and a premium look to highlight the subject.' },
    ],
    "Popular Features": [
        { label: 'Remove Background', prompt: 'Remove the background of this image entirely, leaving only the main subject on a transparent or white background.' },
        { label: 'Remove Watermark', prompt: 'Remove the watermark or logo overlay from this image seamlessly.' },
        { label: 'Remove Object', prompt: 'Remove the distraction in the image and blend the area with the surrounding background.' },
        { label: 'Generate Headshot', prompt: 'Transform this photo into a professional LinkedIn-style headshot with studio lighting.' },
        { label: 'Remove Text', prompt: 'Cleanly erase all text overlays from the image.' },
        { label: 'Sharpen', prompt: 'Sharpen the details of this blurry image to make it crisp and clear.' },
        { label: 'Upscale Image', prompt: 'Increase the resolution and clarity of this low-quality image.' },
        { label: 'Extend Image', prompt: 'Expand the canvas of the image, filling the new space with matching content.' },
        { label: 'Restore Photo', prompt: 'Fix color casts, noise, and damage in this photograph.' },
        { label: 'Change Background', prompt: 'Replace the current background with a solid professional color.' },
        { label: 'Whiten Teeth', prompt: 'Brighten the smile in the photo naturally.' },
        { label: 'Change Clothes', prompt: 'Swap the current outfit for a formal suit.' },
        { label: 'AR Annotation', prompt: 'Add futuristic AR-style data annotations and HUD elements around the main subject.' },
        { label: 'Photo to Sticker', prompt: 'Turn the main subject into a fun, illustrated sticker design.' },
    ],
    "AI Headshot Generator": [
        { label: 'Style: Professional', prompt: 'Transform this into a Professional headshot: Confident expression, studio lighting, sharp focus, neutral professional background.' },
        { label: 'Style: Business', prompt: 'Transform this into a Business headshot: Formal business attire, corporate office background, authoritative yet approachable look.' },
        { label: 'Style: ID Photo', prompt: 'Transform this into an ID Photo: Flat lighting, white background, straight-on angle, neutral expression.' },
        { label: 'Style: Energetic', prompt: 'Transform this into an Energetic headshot: Dynamic lighting, bright colors, cheerful expression, outdoor or lively background.' },
        { label: 'Style: Casual', prompt: 'Transform this into a Casual headshot: Relaxed clothing, soft natural lighting, blurred lifestyle background.' },
        { label: 'Style: Sophisticated', prompt: 'Transform this into a Sophisticated headshot: Elegant styling, dramatic lighting, dark or textured high-end background.' },
        { label: 'Style: Modern', prompt: 'Transform this into a Modern headshot: Minimalist aesthetic, clean lines, soft pastel or solid color background.' },
        { label: 'Style: Academic', prompt: 'Transform this into an Academic headshot: Tweed or blazer attire, library or bookshelf background, intellectual vibe.' },
    ]
};

const CATEGORIES = Object.keys(CATEGORY_DATA);

// --- CLOTHING SPECIFIC DATA ---
const CLOTH_STYLES = ['Modern', 'Business', 'Casual', 'Formal', 'Cyberpunk', 'Vintage', 'Sporty', 'Bohemian', 'Streetwear', 'Minimalist'];
const CLOTH_TYPES = ['Suit', 'T-Shirt & Jeans', 'Dress', 'Hoodie', 'Blazer & Pants', 'Leather Jacket', 'Evening Gown', 'Sweater', 'Winter Coat', 'Summer Outfit'];
const CLOTH_COLORS = ['Black', 'White', 'Navy Blue', 'Red', 'Emerald Green', 'Beige', 'Pastel Pink', 'Gold', 'Charcoal Grey', 'Burgundy'];

// --- BACKGROUND SPECIFIC DATA ---
const BG_CATEGORIES = {
    'Solid Color': [
        'White', 'Black', 'Grey', 'Green Screen', 'Blue', 'Red', 
        'Yellow', 'Purple', 'Orange', 'Pink', 'Navy', 'Beige', 'Teal', 'Maroon', 'Cream', 'Charcoal',
        'Olive', 'Mint', 'Lavender', 'Peach', 'Slate', 'Burgundy'
    ],
    'Scenery': [
        'Beach Sunset', 'Mountain Peak', 'City Skyline', 'Forest', 'Space/Galaxy', 'Desert',
        'Tropical Island', 'Snowy Mountains', 'Autumn Forest', 'Flower Field', 'Waterfall', 
        'Underwater Coral Reef', 'Rainy City Street', 'Starry Night Sky', 'Aurora Borealis', 'Japanese Garden',
        'Grand Canyon', 'Lake House Dock', 'Mist-Covered Hills', 'Savannah', 'Bamboo Forest'
    ],
    'Professional': [
        'Modern Office', 'Studio Backdrop', 'Bokeh/Blurred', 'Luxury Interior', 'Bookshelf',
        'Conference Room', 'Minimalist Workspace', 'Soft Gradient', 'Loft Apartment', 'University Library', 
        'Coworking Space', 'Tech Lab', 'Coffee Shop', 'Neutral Wall',
        'Podcast Studio', 'Newsroom Background', 'CEO Office', 'White Brick Wall'
    ],
    'Creative': [
        'Cyberpunk Neon', 'Abstract Art', 'Minimalist Geometric', 'Watercolor Texture', 'Marble',
        'Graffiti Wall', 'Retro Vaporwave', 'Paper Cutout', 'Oil Painting Style', 'Mosaic Pattern', 
        'Pastel Dreamscape', 'Futuristic Tunnel', 'Pop Art', 'Glitch Effect',
        'Doodle Art', 'Origami World', 'Neon Grid', 'Fluid Acrylics'
    ],
    'Fantasy & Sci-Fi': [
        'Magical Forest', 'Floating Castle', 'Cybernetic City', 'Space Station', 'Alien Planet',
        'Steampunk Lab', 'Enchanted Library', 'Dragon Lair', 'Mars Landscape', 'Holographic Interface',
        'Portal to Another Dimension', 'Fairy Glade', 'Cyberpunk Street', 'Spaceship Cockpit'
    ],
    'Texture & Materials': [
        'Wood Grain', 'Polished Marble', 'Concrete Wall', 'Brushed Metal', 'Silk Fabric',
        'Brick Wall', 'Old Paper', 'Leather Texture', 'Denim Fabric', 'Gold Leaf',
        'Rusty Metal', 'Velvet Curtains', 'Crumpled Paper', 'Knitted Wool', 'Carbon Fiber'
    ],
    'Seasonal & Holiday': [
        'Spring Garden', 'Summer Beach Party', 'Autumn Park', 'Winter Snowscape', 'Christmas Decoration',
        'Halloween Theme', 'Cherry Blossoms', 'New Year Fireworks', 'Rainy Window', 'Sunny Meadow',
        'Valentine Hearts', 'Easter Eggs'
    ],
    'Architecture': [
        'Ancient Ruins', 'Gothic Cathedral', 'Modern Skyscraper', 'Greek Temple', 'Rustic Cabin',
        'Greenhouse', 'Castle Courtyard', 'Industrial Warehouse', 'Lighthouse', 'Pyramids',
        'Art Deco Lobby', 'Victorian Mansion'
    ],
    'Luxury': [
        'Gold Leaf', 'Diamond Sparkle', 'Velvet Curtains', 'Marble Hall', 'Private Jet Interior', 
        'Yacht Deck', 'Champagne Toast', 'Red Carpet', 'Crystal Chandelier', 'High-End Boutique'
    ]
};

export const ImageEditor: React.FC = () => {
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [editedImage, setEditedImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState<string>('');
    
    const [selectedCategory, setSelectedCategory] = useState<string>(CATEGORIES[0]);
    const [selectedFeature, setSelectedFeature] = useState<string>('');

    // Clothing specific state
    const [clothStyle, setClothStyle] = useState('Modern');
    const [clothType, setClothType] = useState('Suit');
    const [clothColor, setClothColor] = useState('Navy Blue');

    // Upscale specific state
    const [upscaleFactor, setUpscaleFactor] = useState('2x');

    // Background specific state
    const [bgCategory, setBgCategory] = useState<keyof typeof BG_CATEGORIES>('Scenery');
    const [bgOption, setBgOption] = useState(BG_CATEGORIES['Scenery'][0]);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fileInfo, setFileInfo] = useState<{ name: string, type: string } | null>(null);
    
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);
    const downloadMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
                setShowDownloadMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Dynamic Prompt Logic
    useEffect(() => {
        if (selectedFeature === 'AI Clothes Changer') {
            setPrompt(`Change the clothes of the person in the image to a ${clothColor} ${clothStyle} ${clothType}. Ensure the fit is realistic and keep the original pose, lighting, and face exactly the same.`);
        } else if (selectedCategory === 'AI Headshot Generator' && selectedFeature) {
             const feature = CATEGORY_DATA['AI Headshot Generator'].find(f => f.label === selectedFeature);
             if (feature) {
                 setPrompt(`${feature.prompt} The person should be wearing a ${clothColor} ${clothStyle} ${clothType}.`);
             }
        } else if (selectedFeature === 'AI Image Upscaler' || selectedFeature === 'Upscale Image') {
             setPrompt(`Upscale this image by ${upscaleFactor}. Greatly enhance the resolution, sharpen details, and reduce noise while preserving the original content.`);
        } else if (selectedFeature === 'AI Background Changer' || selectedFeature === 'Change Background') {
             // ENHANCED PROMPT FOR PHOTOREALISTIC BLENDING
             setPrompt(`Change the background of this image to a ${bgOption} (${bgCategory}). 
             CRITICAL INSTRUCTIONS:
             1. Composite the subject naturally into the new environment. 
             2. Adjust the subject's lighting and color tone to match the ambient light of the new background. 
             3. Generate realistic shadows cast by the subject onto the new background based on the light source.
             4. Ensure perfect edge blending so it does not look like a sticker.`);
        }
    }, [clothStyle, clothType, clothColor, selectedFeature, selectedCategory, upscaleFactor, bgOption, bgCategory]);

    const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const mimeType = getFileType(file);
            setFileInfo({ name: file.name, type: mimeType });
            const reader = new FileReader();
            reader.onloadend = () => {
                setOriginalImage(reader.result as string);
                setEditedImage(null);
            };
            reader.readAsDataURL(file);
        }
    }, []);

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const category = e.target.value;
        setSelectedCategory(category);
        setSelectedFeature(''); // Reset feature when category changes
        setPrompt('');
    };

    const handleFeatureChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const featureLabel = e.target.value;
        setSelectedFeature(featureLabel);
        
        // Manual prompt set for features that don't have dynamic builders
        if (
            featureLabel !== 'AI Clothes Changer' && 
            selectedCategory !== 'AI Headshot Generator' &&
            featureLabel !== 'AI Image Upscaler' && 
            featureLabel !== 'Upscale Image' &&
            featureLabel !== 'AI Background Changer' &&
            featureLabel !== 'Change Background'
        ) {
            const feature = CATEGORY_DATA[selectedCategory].find(f => f.label === featureLabel);
            if (feature) {
                setPrompt(feature.prompt);
            }
        }
    };

    const handleEdit = async () => {
        if (!originalImage || !prompt || !fileInfo || !fileInfo.type) {
            setError('Please upload a valid image and provide an editing prompt.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setEditedImage(null);

        try {
            const base64Data = originalImage.split(',')[1];
            const response = await editImage(prompt, base64Data, fileInfo.type);
            const newImageBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (newImageBase64) {
                setEditedImage(`data:${fileInfo.type};base64,${newImageBase64}`);
            } else {
                setError('Could not generate edited image. The model may have refused the request.');
            }
        } catch (e) {
            console.error(e);
            setError('An error occurred during image editing.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = (format: 'png' | 'jpg' | 'webp') => {
        if (!editedImage) return;
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = editedImage;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            
            // Handle transparency for JPG
            if (format === 'jpg') {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            
            ctx.drawImage(img, 0, 0);
            
            const mimeType = format === 'jpg' ? 'image/jpeg' : (format === 'webp' ? 'image/webp' : 'image/png');
            const dataUrl = canvas.toDataURL(mimeType, 0.9);
            
            const link = document.createElement('a');
            link.download = `edited-image-${Date.now()}.${format}`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setShowDownloadMenu(false);
        };
    };
    
    return (
        <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full animate-fade-in pb-10">
            {/* Header */}
            <div className="text-center sm:text-left mb-2 mt-4 md:mt-0">
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500 mb-2">Magic Image Editor</h2>
                <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">Upload a photo and let AI magically transform styles, backgrounds, and details automatically.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                
                {/* Control Panel */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 dark:border-gray-800 p-5 sm:p-7 h-full flex flex-col">
                        
                         <label className="block w-full cursor-pointer bg-gray-50 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-2xl p-6 text-center hover:border-cyan-400 dark:hover:border-cyan-600 transition-all shadow-sm group mb-6">
                            <UploadIcon className="mx-auto h-10 w-10 text-gray-400 group-hover:text-cyan-500 transition-colors" />
                            <span className="mt-3 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                               {fileInfo ? <span className="text-cyan-600 dark:text-cyan-400">{fileInfo.name}</span> : 'Tap to Upload Target Image'}
                            </span>
                            <input type="file" onChange={handleFileChange} className="hidden" accept="image/*" />
                        </label>

                        {originalImage ? (
                            <div className="space-y-5 flex-grow animate-in fade-in zoom-in-95 duration-300">
                                
                                {/* 1. Category */}
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider mb-2">
                                        1. Tool Category
                                    </label>
                                    <div className="relative">
                                        <select 
                                            value={selectedCategory}
                                            onChange={handleCategoryChange}
                                            className="w-full appearance-none bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white rounded-xl p-3.5 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
                                        >
                                            {CATEGORIES.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-cyan-600">
                                            <ChevronDownIcon className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Feature */}
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider mb-2">
                                        2. Action / Modification
                                    </label>
                                    <div className="relative">
                                        <select 
                                            value={selectedFeature}
                                            onChange={handleFeatureChange}
                                            className="w-full appearance-none bg-indigo-50 dark:bg-indigo-900/20 text-indigo-900 dark:text-indigo-100 rounded-xl p-3.5 border border-indigo-100 dark:border-indigo-800/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                                        >
                                            <option value="">-- Choose magic edit --</option>
                                            {CATEGORY_DATA[selectedCategory].map((feature, idx) => (
                                                <option key={idx} value={feature.label}>{feature.label}</option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-indigo-600">
                                            <ZapIcon className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>

                                {/* Dynamic Menus */}
                                {/* Clothes Changer */}
                                {(selectedFeature === 'AI Clothes Changer' || (selectedCategory === 'AI Headshot Generator' && selectedFeature)) && (
                                    <div className="p-4 bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm animate-in slide-in-from-top-2">
                                        <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">Outfit Styles</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <select value={clothStyle} onChange={(e) => setClothStyle(e.target.value)} className="w-full p-2.5 text-xs font-medium rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                                                {CLOTH_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                            <select value={clothType} onChange={(e) => setClothType(e.target.value)} className="w-full p-2.5 text-xs font-medium rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                                                {CLOTH_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                            <select value={clothColor} onChange={(e) => setClothColor(e.target.value)} className="w-full p-2.5 text-xs font-medium rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                                                {CLOTH_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {/* Upscaling */}
                                {(selectedFeature === 'AI Image Upscaler' || selectedFeature === 'Upscale Image') && (
                                    <div className="p-4 bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm animate-in slide-in-from-top-2">
                                        <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">Resolution Multiplier</h4>
                                        <div className="grid grid-cols-5 gap-2">
                                            {['2x', '4x', '5x', '8x', '10x'].map(factor => (
                                                <button
                                                    key={factor}
                                                    onClick={() => setUpscaleFactor(factor)}
                                                    className={`py-2 px-1 text-xs font-bold rounded-lg transition-all ${
                                                        upscaleFactor === factor
                                                        ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30'
                                                        : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
                                                    }`}
                                                >
                                                    {factor}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Background Changer */}
                                {(selectedFeature === 'AI Background Changer' || selectedFeature === 'Change Background') && (
                                    <div className="p-4 bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm animate-in slide-in-from-top-2">
                                        <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">Enviroment Preset</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <select 
                                                value={bgCategory} 
                                                onChange={(e) => {
                                                    const cat = e.target.value as keyof typeof BG_CATEGORIES;
                                                    setBgCategory(cat);
                                                    setBgOption(BG_CATEGORIES[cat][0]);
                                                }} 
                                                className="w-full p-2.5 text-xs font-medium rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
                                            >
                                                {Object.keys(BG_CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                            <select value={bgOption} onChange={(e) => setBgOption(e.target.value)} className="w-full p-2.5 text-xs font-medium rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                                                {BG_CATEGORIES[bgCategory].map(o => <option key={o} value={o}>{o}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {/* 3. Prompt */}
                                <div className="mt-auto pt-4">
                                     <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider mb-2">
                                        3. Final Instruction (Editable)
                                    </label>
                                    <textarea
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder="Pick a feature or manually type edit instructions..."
                                        className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-[13px] border border-gray-200 dark:border-gray-700 shadow-inner resize-none min-h-[80px]"
                                    />
                                </div>

                                <div className="pt-2">
                                    <ActionButton onClick={handleEdit} isLoading={isLoading} icon={<EditIcon className="w-5 h-5"/>} className="w-full text-base py-3.5 shadow-lg active:scale-[0.98]">
                                        Apply Magic Edit
                                    </ActionButton>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-grow flex flex-col items-center justify-center text-center opacity-50">
                                <EditIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                                <p className="text-gray-500 dark:text-gray-400 font-medium max-w-[200px]">Upload an image to access magic AI tools</p>
                            </div>
                        )}

                        {error && (
                            <div className="mt-4 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl border border-red-100 dark:border-red-900/50 text-sm animate-in fade-in">
                                <span>⚠️</span> {error}
                            </div>
                        )}
                    </div>
                </div>

                {/* Preview Canvas */}
                <div className="lg:col-span-7 flex flex-col gap-4 min-h-[600px] h-full">
                    
                    <div className="grid grid-rows-2 sm:grid-rows-1 sm:grid-cols-2 gap-4 h-full">
                        {/* Original */}
                        <div className="bg-gray-100 dark:bg-gray-900/50 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-gray-800 h-full flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
                             {originalImage ? (
                                <div className="relative w-full h-full flex items-center justify-center animate-in zoom-in-95 duration-500">
                                    <img src={originalImage} alt="Original" className="rounded-xl w-full h-full object-contain drop-shadow-md" />
                                    <div className="absolute top-4 left-4">
                                        <span className="bg-white/90 dark:bg-black/60 backdrop-blur-md text-gray-800 dark:text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-sm">Before Focus</span>
                                    </div>
                                </div>
                             ) : (
                                 <div className="text-center text-gray-400 dark:text-gray-600 flex flex-col items-center">
                                     <UploadIcon className="w-10 h-10 mb-2 opacity-50" />
                                     <span className="text-sm font-medium">Original</span>
                                 </div>
                             )}
                        </div>

                        {/* Result */}
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-[2rem] border border-gray-200 dark:border-gray-700 shadow-inner h-full flex items-center justify-center p-4 sm:p-6 relative overflow-hidden group">
                             {isLoading ? (
                                <div className="flex flex-col items-center animate-in fade-in duration-500">
                                    <div className="w-16 h-16 rounded-2xl bg-white dark:bg-gray-800 shadow-xl flex items-center justify-center mb-4 relative">
                                        <div className="absolute inset-0 border-4 border-cyan-500 border-t-transparent rounded-2xl animate-spin"></div>
                                        <ZapIcon className="w-6 h-6 text-cyan-500 animate-pulse" />
                                    </div>
                                    <h3 className="text-sm font-bold text-cyan-600 dark:text-cyan-400">Applying Edit</h3>
                                </div>
                            ) : editedImage ? (
                                <div className="relative w-full h-full flex items-center justify-center animate-in zoom-in-95 duration-500">
                                    <img src={editedImage} alt="Edited" className="rounded-xl w-full h-full object-contain shadow-xl" />
                                    
                                    <div className="absolute top-4 left-4">
                                        <span className="bg-cyan-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-md shadow-cyan-500/20 flex items-center gap-1">
                                            <SparklesIcon className="w-3 h-3" /> Magic Result
                                        </span>
                                    </div>

                                    {/* Download Menu */}
                                    <div className="absolute bottom-4 right-4 z-20" ref={downloadMenuRef}>
                                        <button 
                                            onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                                            className="bg-gray-900/90 hover:bg-black dark:bg-white/90 dark:hover:bg-white text-white dark:text-gray-900 px-4 py-2.5 rounded-full text-sm font-bold shadow-xl backdrop-blur flex items-center gap-2 transition-all hover:scale-105 active:scale-95 border border-white/10 dark:border-gray-900/10"
                                        >
                                            <DownloadIcon className="w-4 h-4" /> Save
                                        </button>
                                        
                                        {showDownloadMenu && (
                                            <div className="absolute right-0 bottom-full mb-3 w-36 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl shadow-black/10 border border-gray-100 dark:border-gray-700 overflow-hidden transform origin-bottom-right animate-in fade-in zoom-in-95 duration-150">
                                                <button onClick={() => handleDownload('png')} className="block w-full text-left px-5 py-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-gray-700/50">Save as PNG</button>
                                                <button onClick={() => handleDownload('jpg')} className="block w-full text-left px-5 py-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-gray-700/50">Save as JPG</button>
                                                <button onClick={() => handleDownload('webp')} className="block w-full text-left px-5 py-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-800 dark:text-gray-200">Save as WEBP</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-gray-400 dark:text-gray-600 flex flex-col items-center">
                                    <EditIcon className="w-10 h-10 mb-2 opacity-50" />
                                    <span className="text-sm font-medium">Edited Image</span>
                                </div>
                            )}
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
};

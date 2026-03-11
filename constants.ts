import type { Service } from './types';
import { Chatbot } from './components/Chatbot';
import { ImageEditor } from './components/ImageEditor';
import { LiveConversation } from './components/LiveConversation';
import { GroundingSearch } from './components/GroundingSearch';
import { ImageGenerator } from './components/ImageGenerator';
import { ImageAnalyzer } from './components/ImageAnalyzer';
import { FastChat } from './components/FastChat';
import { AudioTranscriber } from './components/AudioTranscriber';
import { ComplexTaskSolver } from './components/ComplexTaskSolver';
import { TextToSpeech } from './components/TextToSpeech';
import { DocumentProcessor } from './components/DocumentProcessor';
import { VideoAnalyzer } from './components/VideoAnalyzer';
import { 
    ChatIcon, BotIcon, EditIcon, MicIcon, SearchIcon, ImageIcon, 
    AnalyzeIcon, ZapIcon, AudioWaveIcon, BrainIcon, VolumeIcon, DocumentIcon, VideoIcon
} from './components/icons/Icons';

export interface ModelConfig {
    id: string;
    label: string;
    description: string;
    limits: {
        rpm: number | 'Unlimited';
        tpm: number | 'Unlimited';
        rpd: number | 'Unlimited';
    };
}

export interface ApiKeyConfig {
    id: string;
    name: string;
    key: string;
}

export const GEMINI_MODELS: Record<string, ModelConfig> = {
    'gemini-3.1-flash-lite': { id: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite', description: 'Fastest text model', limits: { rpm: 15, tpm: 250000, rpd: 500 } },
    'gemini-3-flash': { id: 'gemini-3-flash', label: 'Gemini 3 Flash', description: 'Standard text model', limits: { rpm: 5, tpm: 250000, rpd: 20 } },
    'gemini-3.1-pro': { id: 'gemini-3.1-pro', label: 'Gemini 3.1 Pro', description: 'Advanced reasoning', limits: { rpm: 2, tpm: 32000, rpd: 50 } },
    'gemini-2.5-flash': { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', description: 'Solid all-rounder', limits: { rpm: 5, tpm: 250000, rpd: 20 } },
    'gemini-2.5-flash-lite': { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite', description: 'Lightweight text model', limits: { rpm: 10, tpm: 250000, rpd: 20 } },
    'gemini-2.5-pro': { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', description: 'Complex reasoning', limits: { rpm: 2, tpm: 32000, rpd: 50 } },
    'gemini-2.5-flash-native-audio-preview': { id: 'gemini-2.5-flash-native-audio-preview', label: 'Gemini 2.5 Audio (Native)', description: 'Voice in/out', limits: { rpm: 'Unlimited', tpm: 1000000, rpd: 'Unlimited' } },
    'gemini-2.5-flash-preview-tts': { id: 'gemini-2.5-flash-preview-tts', label: 'Gemini 2.5 TTS', description: 'Text to speech', limits: { rpm: 3, tpm: 10000, rpd: 10 } },
    'imagen-3.0-generate-001': { id: 'imagen-3.0-generate-001', label: 'Imagen 3 Generate', description: 'Legacy image gen', limits: { rpm: 5, tpm: 'Unlimited', rpd: 25 } },
    'imagen-4.0-generate-001': { id: 'imagen-4.0-generate-001', label: 'Imagen 4 Generate', description: 'Image generation', limits: { rpm: 5, tpm: 'Unlimited', rpd: 25 } },
    'imagen-4.0-ultra-generate-001': { id: 'imagen-4.0-ultra-generate-001', label: 'Imagen 4 Ultra Generate', description: 'High-res image generation', limits: { rpm: 5, tpm: 'Unlimited', rpd: 25 } },
    'imagen-4.0-fast-generate-001': { id: 'imagen-4.0-fast-generate-001', label: 'Imagen 4 Fast Generate', description: 'Fast image generation', limits: { rpm: 5, tpm: 'Unlimited', rpd: 25 } },
    'gemini-2.5-flash-image': { id: 'gemini-2.5-flash-image', label: 'Gemini 2.5 Flash Image', description: 'Editing power', limits: { rpm: 15, tpm: 250000, rpd: 1500 } },
    'veo-3-generate': { id: 'veo-3-generate', label: 'Veo 3 Generate', description: 'Video generation', limits: { rpm: 5, tpm: 'Unlimited', rpd: 10 } },
    'gemma-3-1b': { id: 'gemma-3-1b', label: 'Gemma 3 1B', description: 'Tiny open model', limits: { rpm: 30, tpm: 15000, rpd: 14400 } },
    'gemma-3-2b': { id: 'gemma-3-2b', label: 'Gemma 3 2B', description: 'Small open model', limits: { rpm: 30, tpm: 15000, rpd: 14400 } },
    'gemma-3-4b': { id: 'gemma-3-4b', label: 'Gemma 3 4B', description: 'Medium open model', limits: { rpm: 30, tpm: 15000, rpd: 14400 } },
    'gemma-3-12b': { id: 'gemma-3-12b', label: 'Gemma 3 12B', description: 'Large open model', limits: { rpm: 30, tpm: 15000, rpd: 14400 } },
    'gemma-3-27b': { id: 'gemma-3-27b', label: 'Gemma 3 27B', description: 'Massive open model', limits: { rpm: 30, tpm: 15000, rpd: 14400 } },
    'text-embedding-004': { id: 'text-embedding-004', label: 'Gemini Embedding 2', description: 'Text embeddings', limits: { rpm: 100, tpm: 30000, rpd: 1000 } }
};

export enum ServiceId {
    CHATBOT = 'chatbot',
    IMAGE_EDITOR = 'image_editor',
    LIVE_CONVERSATION = 'live_conversation',
    GROUNDING_SEARCH = 'grounding_search',
    IMAGE_GENERATOR = 'image_generator',
    IMAGE_ANALYZER = 'image_analyzer',
    FAST_CHAT = 'fast_chat',
    AUDIO_TRANSCRIBER = 'audio_transcriber',
    COMPLEX_TASK_SOLVER = 'complex_task_solver',
    TEXT_TO_SPEECH = 'text_to_speech',
    DOCUMENT_PROCESSOR = 'document_processor',
    VIDEO_ANALYZER = 'video_analyzer',
}

export const SERVICES: Service[] = [
    { 
        id: ServiceId.CHATBOT, 
        name: 'AI Powered Chatbot',
        description: 'Engage in conversations with Gemini Flash.',
        Icon: ChatIcon,
        Component: Chatbot,
    },
    { 
        id: ServiceId.FAST_CHAT, 
        name: 'Low-Latency Chat',
        description: 'Experience rapid responses with Gemini Flash Lite.',
        Icon: ZapIcon,
        Component: FastChat,
    },
    { 
        id: ServiceId.DOCUMENT_PROCESSOR, 
        name: 'Document Processor',
        description: 'Upload, edit, and reformat documents with AI. Export to various formats.',
        Icon: DocumentIcon,
        Component: DocumentProcessor,
    },
    { 
        id: ServiceId.VIDEO_ANALYZER,
        name: 'Video Analyzer',
        description: 'Analyze video content (Summaries, Subtitles, Key Points) with Gemini Pro.',
        Icon: VideoIcon,
        Component: VideoAnalyzer,
    },
    { 
        id: ServiceId.IMAGE_GENERATOR, 
        name: 'Image Generation',
        description: 'Create high-quality images with Imagen 4.',
        Icon: ImageIcon,
        Component: ImageGenerator,
    },
    { 
        id: ServiceId.IMAGE_EDITOR, 
        name: 'Nano Banana Power Apps',
        description: 'Edit images with Gemini Flash Image.',
        Icon: EditIcon,
        Component: ImageEditor,
    },
    { 
        id: ServiceId.IMAGE_ANALYZER, 
        name: 'Image Understanding',
        description: 'Upload and analyze photos with Gemini Flash.',
        Icon: AnalyzeIcon,
        Component: ImageAnalyzer,
    },
    { 
        id: ServiceId.LIVE_CONVERSATION, 
        name: 'Live Conversation',
        description: 'Talk with Gemini Native Audio in real-time.',
        Icon: MicIcon,
        Component: LiveConversation,
    },
    { 
        id: ServiceId.AUDIO_TRANSCRIBER, 
        name: 'Audio Transcription',
        description: 'Transcribe spoken words using your microphone.',
        Icon: AudioWaveIcon,
        Component: AudioTranscriber,
    },
    { 
        id: ServiceId.TEXT_TO_SPEECH, 
        name: 'Text-to-Speech',
        description: 'Convert text into natural-sounding speech.',
        Icon: VolumeIcon,
        Component: TextToSpeech,
    },
    { 
        id: ServiceId.GROUNDING_SEARCH, 
        name: 'Web & Maps Grounding',
        description: 'Get up-to-date info from Search and Maps.',
        Icon: SearchIcon,
        Component: GroundingSearch,
    },
    { 
        id: ServiceId.COMPLEX_TASK_SOLVER, 
        name: 'Thinking Mode',
        description: 'Solve complex queries with Gemini Pro.',
        Icon: BrainIcon,
        Component: ComplexTaskSolver,
    },
];
import type { Workflow, WorkflowStep } from './types';

// File to Base64
export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // remove data:mime/type;base64, prefix
            resolve(result.split(',')[1]);
        };
        reader.onerror = (error) => reject(error);
    });
};

// Helper to determine mime type if missing (robust fallback)
export const getFileType = (file: File): string => {
    if (file.type) return file.type;
    const ext = file.name.split('.').pop()?.toLowerCase();
    const mimeMap: Record<string, string> = {
        'pdf': 'application/pdf',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'webp': 'image/webp',
        'heic': 'image/heic',
        'heif': 'image/heif',
        'mp3': 'audio/mp3',
        'wav': 'audio/wav',
        'aac': 'audio/aac',
        'flac': 'audio/flac',
        'ogg': 'audio/ogg',
        'm4a': 'audio/m4a',
        'mp4': 'video/mp4',
        'webm': 'video/webm'
    };
    return (ext && mimeMap[ext]) ? mimeMap[ext] : '';
};

// Base64 Audio Decoding for Playback
export const decode = (base64: string): Uint8Array => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
};

export async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

// Audio Encoding for Sending
export const encode = (bytes: Uint8Array): string => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
};

// Generic content exporter
export const exportContent = (content: string | Blob, fileName: string, mimeType: string) => {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};


// Workflow Export
export const exportWorkflow = (workflow: Workflow, format: 'txt' | 'csv') => {
    let content = '';
    let mimeType = '';
    let fileExtension = '';

    const sanitizedTitle = workflow.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    if (format === 'txt') {
        mimeType = 'text/plain';
        fileExtension = 'txt';
        content += `Workflow: ${workflow.title}\n`;
        content += `Summary: ${workflow.summary}\n\n`;
        content += '------------------------------------\n\n';
        workflow.steps.forEach((step, index) => {
            content += `Step ${index + 1}: ${step.title}\n`;
            if (step.estimated_time) {
                content += `Estimated Time: ${step.estimated_time}\n`;
            }
            content += `Description: ${step.description}\n\n`;
        });
    } else if (format === 'csv') {
        mimeType = 'text/csv';
        fileExtension = 'csv';
        const header = ['Step', 'Title', 'Description', 'Estimated Time'];
        const rows = workflow.steps.map((step, index) => 
            [
                index + 1,
                `"${step.title.replace(/"/g, '""')}"`,
                `"${step.description.replace(/"/g, '""')}"`,
                `"${(step.estimated_time || '').replace(/"/g, '""')}"`
            ].join(',')
        );
        content = [header.join(','), ...rows].join('\n');
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sanitizedTitle}_workflow.${fileExtension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};


// Workflow Import from CSV
export const parseCsvToWorkflow = (csvString: string, fileName: string): Workflow => {
    const lines = csvString.split('\n').filter(line => line.trim() !== '');
    const headers = lines.shift()?.split(',').map(h => h.trim().toLowerCase().replace(/"/g, '')) || [];
    
    const titleIndex = headers.indexOf('title');
    const descriptionIndex = headers.indexOf('description');
    const timeIndex = headers.indexOf('estimated time');
    
    if (titleIndex === -1 || descriptionIndex === -1) {
        throw new Error('CSV must contain "Title" and "Description" columns.');
    }

    const steps: WorkflowStep[] = lines.map(line => {
        const data = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(d => d.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
        return {
            title: data[titleIndex] || '',
            description: data[descriptionIndex] || '',
            estimated_time: timeIndex !== -1 ? (data[timeIndex] || '') : undefined
        };
    });

    return {
        title: `Imported from ${fileName}`,
        summary: `This workflow was imported from the CSV file "${fileName}".`,
        steps: steps,
    };
};

// Copy to clipboard
export const copyToClipboard = (text: string): Promise<void> => {
    if (navigator.clipboard) {
        return navigator.clipboard.writeText(text);
    }
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed"; // Avoid scrolling to bottom
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        document.execCommand('copy');
        return Promise.resolve();
    } catch (err) {
        return Promise.reject(err);
    } finally {
        document.body.removeChild(textArea);
    }
};

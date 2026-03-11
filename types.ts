import React from 'react';
import { ServiceId } from './constants';

export interface Service {
    id: ServiceId;
    name: string;
    description: string;
    Icon: React.FC<{ className?: string }>;
    Component: React.FC;
}

export type MessagePart = 
    | { text: string; }
    | { inlineData: { mimeType: string; data: string; }; };

export interface ChatMessage {
    role: 'user' | 'model';
    parts: MessagePart[];
}

export interface WorkflowStep {
    title: string;
    description: string;
    estimated_time?: string;
}

export interface Workflow {
    title: string;
    summary: string;
    steps: WorkflowStep[];
}
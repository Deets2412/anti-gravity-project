import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://complexity-linda-ver-drives.trycloudflare.com',
    headers: { 'Content-Type': 'application/json' },
});

export default api;

// ─── Types ─────────────────────────────────────────────────────────────────

export interface Persona {
    id: string;
    name: string;
    tone: string;
    vocabulary: string;
    pillars: string[];
}

export interface PostContent {
    hook?: string;
    body: string;
    cta?: string;
    hashtags: string[];
}

export interface MediaInstructions {
    type: string;
    prompt: string;
    aspect_ratio: string;
}

export interface PostMetadata {
    tone_score?: number;
    target_audience?: string;
    audience_generation?: string;
    life_event?: string;
}

export interface Post {
    id: string;
    platform: string;
    persona_id: string;
    status: 'draft' | 'review' | 'approved';
    content: PostContent;
    media_instructions: MediaInstructions;
    metadata_field: PostMetadata;
}

export interface DashboardStats {
    total: number;
    drafts: number;
    review: number;
    approved: number;
    personas: number;
}

// ─── API Helpers ────────────────────────────────────────────────────────────

// Personas
export const getPersonas = () => api.get<Persona[]>('/personas/').then(r => r.data);
export const createPersona = (data: Omit<Persona, 'id'>) => api.post<Persona>('/personas/', data).then(r => r.data);
export const deletePersona = (id: string) => api.delete(`/personas/${id}`);

// Posts
export const getPosts = (params?: { platform?: string; status?: string; limit?: number }) =>
    api.get<Post[]>('/posts/', { params }).then(r => r.data);

export const createPost = (data: Omit<Post, 'id'>) =>
    api.post<Post>('/posts/', data).then(r => r.data);

export const updatePost = (id: string, data: Omit<Post, 'id'>) =>
    api.put<Post>(`/posts/${id}`, data).then(r => r.data);

export const patchPostStatus = (id: string, status: string) =>
    api.patch<Post>(`/posts/${id}/status`, null, { params: { status } }).then(r => r.data);

// Stats
export const getStats = () => api.get<DashboardStats>('/posts/stats').then(r => r.data);

// Content generation
export interface GenerateRequest {
    persona_id: string;
    platform: string;
    topic: string;
    audience_generation?: string;
    life_event?: string;
}
export const generateContent = (data: GenerateRequest) =>
    api.post<Omit<Post, 'id'>>('/content/generate', data).then(r => r.data);

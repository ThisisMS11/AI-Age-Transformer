export interface ModelSettings {
    image: string | undefined | null;
    target_age: string;
}

export type PredictionResponse = {
    status: string;
    output_url: string;
    tasks: string;
    num_inference_steps: number;
    mask?: string | null;
    decode_chunk_size: number;
    overlap: number;
    noise_aug_strength: number;
    min_appearance_guidance: number;
    max_appearance_guidance: number;
    i2i_noise_strength: number;
    seed: string | number;
    video_url: string;
    created_at: string;
    completed_at: string;
    predict_time: string | number;
    urls: {
        cancel: string;
        get: string;
        stream: string;
    };
};

export type MongoSave = {
    status: string;
    image_url: string;
    output_url: string;
    target_age: string;
    created_at: string;
    completed_at: string;
    predict_time: string;
};

export interface VideoProcess {
    _id: string;
    video_url: string;
    output_url: string;
    mask?: string;
    status: string;
    created_at: string;
    completed_at: string;
    tasks: string;
    num_inference_steps: number;
    predict_time: string | number;
    decode_chunk_size?: number;
    overlap?: number;
    noise_aug_strength?: number;
    min_appearance_guidance?: number;
    max_appearance_guidance?: number;
    i2i_noise_strength?: number;
    seed: string | number;
}

export interface VideoHistoryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

import { ModelSettings } from '@/types';
import { useRef, useState } from 'react';
import { cloudinaryService, replicateService } from '@/services/api';
import { IMAGE_TYPE, STATUS_MAP, WAIT_TIMES } from '@/constants';

export interface Args {
    uploadCareCdnUrl: string;
    settings: ModelSettings;
    setSettings: (settings: ModelSettings) => void;
}

export const useImageProcessing = () => {
    const [_predictionId, setPredictionId] = useState<string | null>(null);
    const predictionIdRef = useRef<string | null>(null);
    const [status, setStatus] = useState<string>(STATUS_MAP.default);
    const [enhancedImageUrl, setEnhancedImageUrl] = useState<string | null>(
        null
    );
    const [_cloudinaryOriginalUrl, setCloudinaryOriginalUrl] = useState<
        string | null
    >(null);
    const cloudinaryUrlRef = useRef<string | null>(null);

    const validateSettings = (settings: ModelSettings): string | null => {
        if (!settings.image_url) return 'No image URL provided';
        if (!process.env.NEXT_PUBLIC_APP_URL)
            return 'App URL environment variable is not configured';
        return null;
    };

    const startTransformingImage = async (
        settings: ModelSettings
    ): Promise<string> => {
        const validationError = validateSettings(settings);
        if (validationError) {
            console.error(validationError);
            throw new Error(validationError);
        }

        try {
            const response = await replicateService.processVideo(settings);
            if (!response?.id) {
                throw new Error('Invalid response: missing prediction ID');
            }
            setPredictionId(response.id);
            // console.log('Prediction ID:', response.id);
            return response.id;
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Failed to process image';
            console.error('Transformation error:', message);
            throw new Error(`Error starting transformation : ${message}`);
        }
    };

    const handleProcessingImage = async (args: Args) => {
        const { uploadCareCdnUrl, settings, setSettings } = args;

        /* upload the image to cloudinary if not already uploaded */
        let uploadedUrl = cloudinaryUrlRef.current;
        if (!cloudinaryUrlRef.current) {
            setStatus(STATUS_MAP.uploading);
            try {
                const uploadResult = await cloudinaryService.upload(
                    uploadCareCdnUrl,
                    IMAGE_TYPE.ORIGINAL
                );
                if (!uploadResult?.url) {
                    throw new Error('Failed to get upload URL from Cloudinary');
                }
                cloudinaryUrlRef.current = uploadResult.url;
                uploadedUrl = uploadResult.url;
                setCloudinaryOriginalUrl(uploadedUrl);

                // Create updated settings with new image URL
                const updatedSettings = {
                    ...settings,
                    image_url: uploadedUrl,
                };

                setSettings(updatedSettings);

                /* transform the image */
                try {
                    setStatus(STATUS_MAP.processing);

                    /* Adding some delay time to give cloudinary time to upload the image */
                    await new Promise((resolve) =>
                        setTimeout(resolve, WAIT_TIMES.CLOUDINARY_SERVICE)
                    );

                    // Use updated settings directly instead of relying on state
                    const predictionId =
                        await startTransformingImage(updatedSettings);
                    if (!predictionId) {
                        throw new Error('No prediction ID returned');
                    }
                    return predictionId;
                } catch (error) {
                    console.error('Error transforming image:', error);
                    throw new Error(`Error transforming image : ${error}`);
                }
            } catch (error) {
                console.error(
                    'Error uploading original image to cloudinary:',
                    error
                );
                throw new Error(
                    `Error uploading original image to cloudinary : ${error}`
                );
            }
        } else {
            // If cloudinaryOriginalUrl exists, use existing settings
            try {
                setStatus(STATUS_MAP.processing);
                const updatedSettings = {
                    ...settings,
                    image_url: cloudinaryUrlRef.current,
                };
                const predictionId =
                    await startTransformingImage(updatedSettings);
                if (!predictionId) {
                    throw new Error('No prediction ID returned');
                }
                return predictionId;
            } catch (error) {
                console.error('Error Creating GIF:', error);
                throw new Error(`Error Creating GIF : ${error}`);
            }
        }
    };

    return {
        status,
        setStatus,
        setPredictionId,
        enhancedImageUrl,
        setEnhancedImageUrl,
        setCloudinaryOriginalUrl,
        predictionIdRef,
        handleProcessingImage,
        cloudinaryUrlRef,
    };
};

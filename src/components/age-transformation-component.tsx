'use client';
import { useState } from 'react';
import { useImageProcessing } from '@/hooks/useImageProcessing';
import ImageUploader from '@/components/image-uploader';
import RightSideProcess from '@/components/right-side-process';
import { ImageHistoryModal } from './history-modal';
import ActionButtons from '@/components/action-buttons';
import Statistics from '@/components/statistics';
import {
    Card,
    CardContent,
    Separator,
    Tabs,
    TabsTrigger,
    TabsList,
    toast,
    Label,
    Input,
} from '@/imports/Shadcn_imports';
import { Atom } from 'lucide-react';
import { useImageTransformingHandler } from '@/hooks/useImageTransformingHandler';
import { usePredictionHandling } from '@/hooks/usePredictionHandling';
import { RETRIES, STATUS_MAP } from '@/constants';
import { PredictionResponse, ModelSettings } from '@/types';
import { WAIT_TIMES } from '@/constants';

export default function ImageTransformer() {
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [uploadCareCdnUrl, setUploadCareCdnUrl] = useState<string | null>(
        null
    );

    const [settings, setSettings] = useState<ModelSettings>({
        image_url: '',
        target_age: 'default',
    });

    /* Custom Hooks */

    const {
        status,
        setStatus,
        cloudinaryOriginalUrl,
        setCloudinaryOriginalUrl,
        enhancedImageUrl,
        setEnhancedImageUrl,
        setPredictionId,
        finalResponse,
        setFinalResponse,
        startTransformingImage,
    } = useImageProcessing();

    const { pollPredictionStatus, savePredictionData } =
        usePredictionHandling();
    const { handleProcessingImage } = useImageTransformingHandler();

    /* To remove the image from the state */
    const handleRemoveImage = () => {
        setEnhancedImageUrl(null);
        setPredictionId(null);
        setStatus(STATUS_MAP.default);
        setUploadCareCdnUrl(null);
        setCloudinaryOriginalUrl(null);
        setSettings({
            image_url: undefined,
            target_age: 'default',
        });
    };

    /* Start processing image */
    const startProcessingImage = async () => {
        try {
            if (!uploadCareCdnUrl) {
                toast.error('Error', {
                    description: 'No image URL provided',
                    duration: 3000,
                });
                return;
            }

            if (
                typeof settings.target_age === 'number' &&
                settings.target_age >= 300
            ) {
                toast.error('Error', {
                    description:
                        'Please Keep Target Age below 300 to avoid distortion',
                    duration: 3000,
                });
                return;
            }

            const args = {
                uploadCareCdnUrl,
                cloudinaryOriginalUrl,
                setCloudinaryOriginalUrl,
                setStatus,
                settings,
                setSettings,
                startTransformingImage,
            };

            /* upload the image to cloudinary and start the prediction */
            const predictionId = await handleProcessingImage(args);

            if (predictionId) {
                setPredictionId(predictionId);
                handlePredictionResults(predictionId);
            } else {
                throw new Error('Failed to get prediction ID');
            }
        } catch (error) {
            console.error('Error in startProcessingImage:', error);
            toast.error('Error', {
                description: `Error in startProcessingImage`,
                duration: 3000,
            });
            setStatus(STATUS_MAP.error);
        }
    };

    /* handle prediction success */
    const handlePredictionFinalResult = async (
        data: PredictionResponse,
        outputUrl?: string
    ) => {
        const isSuccess = data.status === STATUS_MAP.succeeded;
        await savePredictionData(data, outputUrl);
        setStatus(isSuccess ? STATUS_MAP.succeeded : STATUS_MAP.failed);
        setFinalResponse(data);
        setEnhancedImageUrl(outputUrl ? outputUrl : null);

        if (isSuccess) {
            toast.success('Image Transformed Successfully', {
                description: 'Image Transformed Successfully',
                duration: 3000,
            });
        } else {
            toast.error('Failed to transform the image', {
                description: 'Please try again',
                duration: 3000,
            });
        }
    };

    /* handle prediction results */
    const handlePredictionResults = async (
        predictionId: string,
        ReplicateRetryCount: number = 0
    ) => {
        // console.log(
        //     `Calling handlePredictionResults with predictionId: ${predictionId}`
        // );
        try {
            const predictionData = await pollPredictionStatus(predictionId);
            console.log('Prediction Data:', predictionData);
            if (!predictionData) {
                throw new Error('Failed to get prediction data');
            }

            const outputUrl = predictionData.output_url
                ? JSON.parse(predictionData.output_url)
                : null;
            switch (predictionData.status) {
                case STATUS_MAP.succeeded:
                    await handlePredictionFinalResult(
                        predictionData,
                        outputUrl
                    );
                    break;

                case STATUS_MAP.failed:
                    if (ReplicateRetryCount < RETRIES.REPLICATE_SERVICE) {
                        console.log(
                            `Replicate Service Retry attempt ${ReplicateRetryCount + 1} of ${RETRIES.REPLICATE_SERVICE}`
                        );
                        setStatus(STATUS_MAP.processing);
                        setTimeout(() => {
                            startProcessingImage();
                            handlePredictionResults(
                                predictionId,
                                ReplicateRetryCount + 1
                            );
                        }, WAIT_TIMES.REPLICATE_SERVICE_RETRY);
                    } else {
                        console.log('Failed after 5 retry attempts');
                        await handlePredictionFinalResult(predictionData);
                    }
                    break;

                default:
                    setStatus(STATUS_MAP.processing);
                    setTimeout(
                        () =>
                            handlePredictionResults(
                                predictionId,
                                ReplicateRetryCount
                            ),
                        WAIT_TIMES.PREDICTION_SERVICE
                    );
            }
        } catch (error) {
            console.error('Error in handlePredictionResults:', error);
            handlePredictionResults(predictionId, ReplicateRetryCount);
        }
    };

    return (
        <div className="flex flex-col h-full rounded-sm p-2 lg:w-[80%] w-[90%] items-center">
            <div className="w-full h-full">
                <Tabs defaultValue="text" className="mb-1 h-[4%] w-full">
                    <TabsList className="grid w-full grid-cols-1">
                        <TabsTrigger value="text" className="flex gap-2">
                            <Atom className="w-4 h-4" />
                            AI Age Transformation
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="flex w-full lg:h-[93%] mt-4 gap-2 flex-col lg:flex-row ">
                    {/* Left Side */}
                    <div className="flex-1 p-1 border-r lg:w-[35%] h-full ">
                        <Card className="h-full">
                            <CardContent className="p-2  h-full">
                                <ImageUploader
                                    uploadCareCdnUrl={uploadCareCdnUrl}
                                    onUploadSuccess={setUploadCareCdnUrl}
                                    onRemoveImage={handleRemoveImage}
                                />

                                <Separator className="my-2" />

                                {/* Enter the target age  */}
                                <div className="p-2 h-[43%]">
                                    <h2 className="text-xl mb-4">Settings</h2>

                                    <div className="space-y-2">
                                        <Label>Target Age (Optional)</Label>
                                        <Input
                                            type="number"
                                            value={settings.target_age}
                                            onChange={(e) =>
                                                setSettings((prev) => ({
                                                    ...prev,
                                                    target_age: e.target.value,
                                                }))
                                            }
                                            placeholder="Random"
                                            min={10}
                                            max={300}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Age of the output image, when left
                                            blank a gif for age from 0, 10,
                                            20,...,to 100 will be displayed
                                        </p>
                                    </div>
                                </div>

                                <Separator className="my-2" />

                                <ActionButtons
                                    status={status}
                                    onProcess={startProcessingImage}
                                    onHistory={() => setHistoryModalOpen(true)}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Side */}
                    <div className="flex flex-col lg:w-[65%] h-full lg:border-none lg:rounded-md mt-14 lg:mt-0 w-[95%]  mx-auto">
                        <RightSideProcess
                            status={status}
                            transformedGIFUrl={enhancedImageUrl}
                            onRetry={startProcessingImage}
                        />

                        {(status === STATUS_MAP.succeeded ||
                            status === STATUS_MAP.failed) && (
                            <Statistics data={finalResponse} />
                        )}
                    </div>
                </div>

                <ImageHistoryModal
                    open={historyModalOpen}
                    onOpenChange={setHistoryModalOpen}
                />
            </div>
        </div>
    );
}

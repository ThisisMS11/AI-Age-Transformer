import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Upload, Wand2, XCircle, RefreshCcw } from 'lucide-react';
import { STATUS_MAP } from '@/constants';

interface VideoPreviewProps {
    status: string;
    transformedGIFUrl: string | null;
    onRetry: () => void;
}

export default function RightSideProcess({
    status,
    transformedGIFUrl,
    onRetry,
}: VideoPreviewProps) {
    switch (status) {
        case STATUS_MAP.uploading:
            return (
                <div className="space-y-4  h-full  flex flex-col items-center justify-center">
                    <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center animate-pulse">
                        <Upload className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h2 className="text-2xl font-semibold">
                        Uploading Image...
                    </h2>
                    <Progress value={33} className="w-[65%] mx-auto" />
                </div>
            );
        case STATUS_MAP.processing:
            return (
                <div className="space-y-4  h-full  flex flex-col items-center justify-center">
                    <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center animate-spin">
                        <Wand2 className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h2 className="text-2xl font-semibold">
                        Transforming Image...
                    </h2>
                    <Progress value={66} className="w-[65%] mx-auto" />
                </div>
            );
        case STATUS_MAP.succeeded:
            return (
                <div className="h-[60%]">
                    {transformedGIFUrl ? (
                        <div className="relative w-full h-full bg-muted rounded-lg">
                            <img
                                src={transformedGIFUrl}
                                alt="Transformed GIF"
                                className="rounded-lg h-full w-full object-contain"
                            />
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center">
                            <p className="text-muted-foreground">
                                No GIF found
                            </p>
                        </div>
                    )}
                </div>
            );
        case STATUS_MAP.failed:
            return (
                <div className="h-[60%] flex items-center flex-col justify-center space-y-4">
                    <div className="mx-auto w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
                        <XCircle className="w-10 h-10 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-semibold text-red-600">
                        Processing Failed
                    </h2>
                    <p className="text-muted-foreground">
                        Please try again or contact support if the issue
                        persists.
                    </p>
                    <Button variant="outline" onClick={onRetry}>
                        <RefreshCcw className="w-4 h-4 mr-2" />
                        Retry
                    </Button>
                </div>
            );
        case STATUS_MAP.error:
            return (
                <div className="h-full flex items-center flex-col justify-center space-y-4">
                    <div className="mx-auto w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
                        <XCircle className="w-10 h-10 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-semibold text-red-600">
                        Something went wrong !
                    </h2>
                    <p className="text-muted-foreground">
                        Please try again or contact support if the issue
                        persists.
                    </p>
                    <Button variant="outline" onClick={onRetry}>
                        <RefreshCcw className="w-4 h-4 mr-2" />
                        Retry
                    </Button>
                </div>
            );
        default:
            return (
                <div className="h-full">
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="space-y-4">
                            <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                                <Wand2 className="w-10 h-10 text-muted-foreground" />
                            </div>
                            <h2 className="text-2xl font-semibold">
                                Ready to create AI Generated Age Transformation
                                GIF
                            </h2>
                            <p className="text-muted-foreground">
                                Upload a image and generate your GIF
                            </p>
                        </div>
                    </div>
                </div>
            );
    }
}

export const CardSkeleton = () => {
    return (
        <div className="break-inside-avoid mb-4 w-full">
            <div className="bg-white dark:bg-neutral-900 rounded-lg overflow-hidden border border-neutral-100 dark:border-neutral-800 shadow-sm">
                {/* Image Placeholder */}
                <div className="w-full h-40 bg-neutral-200 dark:bg-neutral-800/50 animate-pulse" />

                {/* Content Placeholder */}
                <div className="p-4 space-y-3">
                    {/* Icon + Category */}
                    <div className="flex items-center gap-2 mb-2">
                        <div className="size-5 rounded bg-neutral-200 dark:bg-neutral-800/50 animate-pulse" />
                        <div className="h-4 w-16 bg-neutral-200 dark:bg-neutral-800/50 rounded animate-pulse" />
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                        <div className="h-4 bg-neutral-200 dark:bg-neutral-800/50 rounded w-full animate-pulse" />
                        <div className="h-4 bg-neutral-200 dark:bg-neutral-800/50 rounded w-2/3 animate-pulse" />
                    </div>
                </div>
            </div>
        </div>
    );
};

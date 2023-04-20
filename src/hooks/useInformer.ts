import { useEffect, useState } from 'react';

import { useSnackbar } from 'notistack';
import { TSubject } from 'react-declarative';

export const useInformer = (source: TSubject<"train" | "upward" | "downward" | null>) => {
    const [type, setType] = useState<"train" | "upward" | "downward" | null>("train");

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    useEffect(() => source.subscribe((type) => setType(type)), [source]);

    useEffect(() => {
        if (type) {
            const msg = type === "train" ? "Net is warming, please wait. Open console for more info"
                : type === "upward"
                ? "Trend is upward"
                : type === "downward"
                ? "Trend is downward"
                : "Unknown";
            const variant = type === "train" ? "warning"
                : type === "upward"
                ? "success"
                : type === "downward"
                ? "error"
                : "info";
            const key = enqueueSnackbar(msg, {
                variant,
                persist: true,
            });
            return () => closeSnackbar(key);
        }
        return undefined;
    }, [type, enqueueSnackbar, closeSnackbar]);
}

export default useInformer;

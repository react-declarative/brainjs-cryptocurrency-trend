import { useEffect, useState } from 'react';

import { useSnackbar } from 'notistack';
import { Subject, Operator } from 'react-declarative';

export const useInformer = (source: Subject<"train" | "upward" | "downward" | "untrained" | null>) => {
    const [type, setType] = useState<"train" | "upward" | "downward" | null>("train");

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    useEffect(() => source.operator(Operator.distinct()).connect((type: any) => setType(type)), [source]);

    useEffect(() => {
        if (type) {
            const msg = type === "train" ? "Net is warming, please wait. Open console for more info"
                : type === "upward"
                ? "Trend is upward"
                : type === "downward"
                ? "Trend is downward"
                : type === "untrained"
                ? "Train error is to high, please retrain"
                : "Unknown";
            const variant = type === "train" ? "warning"
                : type === "upward"
                ? "success"
                : type === "downward"
                ? "error"
                : type === "untrained"
                ? "info"
                : "info"
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

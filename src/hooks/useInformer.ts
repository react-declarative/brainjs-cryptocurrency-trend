import { useSnackbar } from 'notistack';
import { useEffect } from 'react';

export const useInformer = (type: "train" | "upward" | "downward" | null) => {
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
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

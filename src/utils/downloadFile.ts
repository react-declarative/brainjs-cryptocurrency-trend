export const downloadFile = (data: string, name: string) => {
    const blob = new Blob([data], { type: 'text/javascript;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    [a.href, a.download] = [url, name];
    a.click();
    window.URL.revokeObjectURL(url);
};

export default downloadFile;

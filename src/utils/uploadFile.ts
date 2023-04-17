export const uploadFile = () => new Promise<string>((res, rej) => {
    const input = document.createElement('input');
    const reader = new FileReader();
    input.type = 'file';
    input.onchange = () => {
        const file = input.files![0];
        reader.onload = () => {
            const { result } = reader;
            if (result) {
                const data = result.toString();
                res(data);
            } else {
                rej();
            }
        }
        reader.readAsText(file);
    };
    input.click();
});

export default uploadFile;

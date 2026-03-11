/**
 * Copies the provided text to the user's clipboard.
 * @param text The string to copy.
 * @returns A promise resolving to true if successful, false otherwise.
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Failed to copy text: ', err);
        return false;
    }
};

/**
 * Triggers a file download for the given text content.
 * @param text The content of the file.
 * @param filename The desired filename (e.g., transcription.txt).
 */
export const downloadAsTextFile = (text: string, filename: string = 'transcription.txt') => {
    try {
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (err) {
        console.error('Failed to download file: ', err);
    }
};

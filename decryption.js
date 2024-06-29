import { getCryptoKeyFromRawKey } from './CryptoUtils.js';

export async function handleDownload(file, ivString, keyString) {
    // Convert IV string to Uint8Array
    const ivArray = ivString.split(",").map(Number);
    const subtleIv = new Uint8Array(ivArray);

    // Key import
    const subtleKey = await getCryptoKeyFromRawKey(keyString);

    // Request a file handle
    const fileHandle = await window.showSaveFilePicker();

    // Create a writable stream
    const writableStream = await fileHandle.createWritable();

    // Create a readable stream from the file
    const readableStream = file.stream();

    // Create a transform stream that decrypts each chunk
    const transformStream = new TransformStream({
        async transform(chunk, controller) {
            try {
                // Decrypt the chunk using AES-CTR
                const decryptedChunk = await window.crypto.subtle.decrypt(
                    {
                        name: "AES-CTR",
                        counter: subtleIv,
                        length: 128,
                    },
                    subtleKey,
                    chunk
                );

                // Enqueue the decrypted chunk to the writable stream
                controller.enqueue(new Uint8Array(decryptedChunk));
            } catch (error) {
                console.error('Decryption error:', error);
                controller.error(error);
            }
        },
    });

    // Pipe the file's stream through the transform stream and into the writable stream
    try {
        await readableStream.pipeThrough(transformStream).pipeTo(writableStream);
        console.log('File successfully saved!');
    } catch (error) {
        console.error('Error saving file:', error);
    } finally {
        // Close the writable stream
        await writableStream.close();
    }
}

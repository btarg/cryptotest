import { getCryptoKeyFromRawKey, bufToBn, bnToBuf } from './CryptoUtils.js';

export async function handleDownload(file, ivString, keyString) {
    // Convert IV string to Uint8Array
    const ivArray = ivString.split(",").map(Number);
    let subtleIv = new Uint8Array(ivArray);

    // Key import
    var subtleKey = await getCryptoKeyFromRawKey(keyString);

    // Decrypt and concat
    var aesCounter = bufToBn(subtleIv);

    // Request a file handle
    const fileHandle = await window.showSaveFilePicker();

    // Create a writable stream
    const writableStream = await fileHandle.createWritable();

    // Create a transform stream that decrypts each chunk
    const transformStream = new TransformStream({
        async transform(chunk, controller) {
            var decrypted = new Uint8Array(chunk.length);
            var blockPromises = [];
            for (let i = 0; i < chunk.length; i += 16) {
                var end = Math.min(i + 16, chunk.length);
                blockPromises.push(window.crypto.subtle.decrypt({ name: "AES-CTR", counter: bnToBuf(aesCounter), length: 128 }, subtleKey, chunk.slice(i, end))); // length in bits
                aesCounter++;
            }
            var decryptedBlocks = await Promise.all(blockPromises);
            for (let i = 0; i < decryptedBlocks.length; i++) {
                decrypted.set(new Uint8Array(decryptedBlocks[i]), i * 16);
            }
            controller.enqueue(decrypted);
        }
    });

    // Pipe the file's stream through the transform stream and into the writable stream
    file.stream().pipeThrough(transformStream).pipeTo(writableStream);
}
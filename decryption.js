import { getCryptoKeyFromRawKey } from './CryptoUtils.js';

export async function decryptChunk(encryptedChunk, key_encoded) {
    const iv = encryptedChunk.slice(0, 16);
    const encryptedContent = encryptedChunk.slice(16);
    const decryptedContent = await crypto.subtle.decrypt(
        {
            name: 'AES-CTR',
            counter: iv,
            length: 128,
        },
        key_encoded,
        encryptedContent
    );
    return new Uint8Array(decryptedContent);
}

/**
 * @param {Blob} encryptedBlob
 * @param {CryptoKey} subtleKey
 * @returns {Uint8Array}
 */
export async function decryptBlob(encryptedBlob, subtleKey) {
    const chunk_size = 1024 * 1024;
    const encryptedBuffer = await encryptedBlob.arrayBuffer();
    const encryptedArray = new Uint8Array(encryptedBuffer);
    const originalSize = encryptedArray.byteLength - 16 * Math.ceil(encryptedArray.byteLength / (chunk_size + 16));
    const decrypted = new Uint8Array(originalSize);
    const chunks = Math.ceil(encryptedArray.byteLength / (chunk_size + 16));

    console.log("Decrypting file of size", encryptedArray.byteLength, "in", chunks, "chunks");

    for (let i = 0; i < chunks; i++) {
        const offset = i * (16 + chunk_size);
        const encryptedChunk = encryptedArray.slice(offset, offset + 16 + chunk_size);
        console.log("Decrypting chunk", i, "of", chunks, "at offset", offset);
        decrypted.set(await decryptChunk(encryptedChunk, subtleKey), i * chunk_size);
    }

    return decrypted;
}
export async function decryptFile(file, keyString) {
    const subtleKey = await getCryptoKeyFromRawKey(keyString);
    const decryptedFile = await decryptBlob(file, subtleKey);

    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(new Blob([decryptedFile], { type: file.type }));
    downloadLink.download = 'decrypted_file';
    downloadLink.click();
}
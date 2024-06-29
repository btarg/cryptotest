import { getCryptoKeyFromRawKey } from './CryptoUtils.js';

function getFileType(fileName) {
    return {
        mime: "application/octet-stream",
        friendlyName: `Text file`,
        extension: ".txt"
    };
}

export async function encryptChunk(chunk, key_encoded) {
    const iv = crypto.getRandomValues(new Uint8Array(16))
    console.log("IV ", iv, " of length ", iv.byteLength);
    const encrypted_content = await crypto.subtle.encrypt(
        {
            name: 'AES-CTR',
            counter: iv,
            length: 128,
        },
        key_encoded,
        chunk,
    )
    const output = new Uint8Array(iv.byteLength + encrypted_content.byteLength);
    output.set(iv);
    output.set(new Uint8Array(encrypted_content), iv.byteLength);
    return output;
}


/**
 * @param {Uint8Array} file
 * @param {CryptoKey} subtleKey
 * @returns {Blob}
 */
export async function generateEncryptedBlob(file, subtleKey) {
    const chunk_size = 1024 * 1024;
    const originalSize = file.byteLength;
    const chunks = Math.ceil(originalSize / chunk_size);
    console.log("Encrypting file of size", originalSize, "in", chunks, "chunks");
    const encryptedSize = chunks * 16 + originalSize;
    const encrypted = new Uint8Array(encryptedSize);
    for (let i = 0; i < chunks; i++) {
        const offset = i * (16 + chunk_size);
        const chunk = file.subarray(i * chunk_size, (i + 1) * chunk_size);
        console.log("Encrypting chunk", i, "of", chunks, "at offset", offset);
        encrypted.set(await encryptChunk(chunk, subtleKey), offset);
    }

    // Return encrypted file
    return new Blob([encrypted], { type: file.type });
}

export async function encryptAndAssignHash(file, keyString) {

    const subtleKey = await getCryptoKeyFromRawKey(keyString);
    const fileArrayBuffer = await file.arrayBuffer();
    const encryptedFile = await generateEncryptedBlob(new Uint8Array(fileArrayBuffer), subtleKey);

    const arrayBuffer = await encryptedFile.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-1", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const fileHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    console.log("File hash:", fileHash);
    const fileType = await getFileType(file.name);

    encryptedFile.filehash = fileHash;
    encryptedFile.filename = file.name;
    encryptedFile.filetype = fileType;
    return encryptedFile;
}

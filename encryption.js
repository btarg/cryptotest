import { getCryptoKeyFromRawKey } from './CryptoUtils.js';

function getFileType(fileName) {
    return {
        mime: "application/octet-stream",
        friendlyName: `Text file`,
        extension: ".txt"
    };
}

export async function encryptChunk(chunk, iv, keyString) {
    var subtleKey = await getCryptoKeyFromRawKey(keyString);
    const encrypted_content = await crypto.subtle.encrypt(
        {
            name: 'AES-CTR',
            counter: iv,
            length: 128,
        },
        subtleKey,
        chunk,
    )
    const output = new Uint8Array(iv.byteLength + encrypted_content.byteLength)
    output.set(iv)
    output.set(new Uint8Array(encrypted_content), iv.byteLength)
    return output
}

export async function generateEncryptedBlob(file, iv, keyString) {
    const chunk_size = 1024 * 1024;
    const originalSize = file.byteLength;
    const chunks = Math.ceil(originalSize / chunk_size);
    const encryptedSize = chunks * 16 + originalSize;
    const encrypted = new Uint8Array(encryptedSize);
    for (let i = 0; i < chunks; i++) {
        const offset = i * (16 + chunk_size);
        const chunk = file.subarray(i * chunk_size, (i + 1) * chunk_size);
        encrypted.set(await encryptChunk(chunk, iv, keyString), offset);
    }

    // Return encrypted file
    return new Blob([encrypted], { type: file.type });
}

export async function encryptAndAssignHash(file, keyString) {
    let iv = crypto.getRandomValues(new Uint8Array(16));
    const initialIV = new Uint8Array(iv);
    const encryptedFile = await generateEncryptedBlob(file, initialIV, keyString);

    const arrayBuffer = await encryptedFile.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-1", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const fileHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    console.log("File hash:", fileHash);
    const fileType = await getFileType(file.name);

    encryptedFile.filehash = fileHash;
    encryptedFile.filename = file.name;
    encryptedFile.filetype = fileType;
    encryptedFile.iv = initialIV;
    return encryptedFile;
}

import { getCryptoKeyFromRawKey, bufToBn, bnToBuf, merge } from './CryptoUtils.js';

function getFileType(fileName) {
    return {
        mime: "application/octet-stream",
        friendlyName: `Text file`,
        extension: ".txt"
    };
}

async function generateEncryptedBlob(file, subtleIv, keyString) {
    // Key import
    var subtleKey = await getCryptoKeyFromRawKey(keyString);

    // Plaintext import
    var plaintext = new Uint8Array(await file.arrayBuffer());

    // Encrypt and concat
    var length = plaintext.byteLength;
    var chunkSize = 128; // chunkSize in bytes
    var index = 0;
    var chunks = [];
    var aesCounter = bufToBn(subtleIv);
    do {
        var newCount = aesCounter + BigInt(index / 16); // index / 16 = number of blocks
        var encrypted = await window.crypto.subtle.encrypt({ name: "AES-CTR", counter: bnToBuf(newCount), length: 128 }, subtleKey, plaintext.slice(index, index + chunkSize)); // length in bits
        chunks.push(new Uint8Array(encrypted));
        index += chunkSize;
    } while (index < length);
    var mergedChunks = merge(chunks);

    // Return encrypted file
    return new Blob([mergedChunks], { type: file.type });
}

export async function encryptAndAssignHash(file, keyString) {
    let iv = crypto.getRandomValues(new Uint8Array(16));
    const initialIV = new Uint8Array(iv);
    const encryptedFile = await generateEncryptedBlob(file, initialIV, keyString); // add await here

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

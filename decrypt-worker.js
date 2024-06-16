import { getCryptoKeyFromRawKey, bufToBn, bnToBuf, merge } from './CryptoUtils.js';

export async function handleDownload(file, ivString, keyString) {
    // Convert IV string to Uint8Array
    const ivArray = ivString.split(",").map(Number);
    let subtleIv = new Uint8Array(ivArray);

    // Key import
    var subtleKey = await getCryptoKeyFromRawKey(keyString);

    // Ciphertext import
    var ciphertext = new Uint8Array(await file.arrayBuffer());

    // Decrypt and concat
    var length = ciphertext.byteLength;
    var chunkSize = 128; // chunkSize in bytes
    var index = 0;
    var chunks = [];
    var aesCounter = bufToBn(subtleIv);
    do {
        var newCount = aesCounter + BigInt(index / 16); // index / 16 = number of blocks
        var decrypted = await window.crypto.subtle.decrypt({ name: "AES-CTR", counter: bnToBuf(newCount), length: 128 }, subtleKey, ciphertext.slice(index, index + chunkSize)); // length in bits
        chunks.push(new Uint8Array(decrypted));
        index += chunkSize;
    } while (index < length);


    var mergedChunks = merge(chunks);
    // Create a Blob from the decrypted data and save it
    var blob = new Blob([mergedChunks], { type: "application/octet-stream" });

    if (blob instanceof Blob) {
        var url = URL.createObjectURL(blob);

        // Create a link and click it to start the download
        var link = document.createElement('a');
        link.href = url;
        link.download = 'decrypted_file'; // Set the file name here
        link.click();

        // Revoke the URL to free up memory
        URL.revokeObjectURL(url);
    } else {
        console.error('Failed to create Blob object');
    }
}
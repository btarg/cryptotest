export function bufferToHex(buffer) {
    return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
}

async function getHashedKey(rawKey) {
    const encoder = new TextEncoder();
    const data = encoder.encode(rawKey);
    const hash = await crypto.subtle.digest('SHA-256', data);
    console.log("Hashed key as string: " + bufferToHex(hash));
    return hash;
}

export async function getCryptoKeyFromRawKey(rawKey) {
    if (typeof (rawKey) != CryptoKey) {
        const hashedKey = await getHashedKey(rawKey);

        return crypto.subtle.importKey(
            'raw',
            hashedKey,
            { name: "AES-CTR", },
            true,
            ['encrypt', 'decrypt'],
        );
    } else {
        // already converted
        return rawKey;
    }
}
export function merge(chunks){
    let size = 0;
    chunks.forEach(item => {
        size += item.length;
    });
    let mergedArray = new Uint8Array(size);
    let offset = 0;
    chunks.forEach(item => {
        mergedArray.set(item, offset);
        offset += item.length;
    });
    return mergedArray;
}

export function bnToBuf(bn) {
    var hex = BigInt(bn).toString(16);
    if (hex.length % 2) { hex = '0' + hex; }
    var len = hex.length / 2;
    var u8 = new Uint8Array(len);
    var i = 0;
    var j = 0;
    while (i < len) {
        u8[i] = parseInt(hex.slice(j, j+2), 16);
        i += 1;
        j += 2;
    }
    return u8;
}

export function bufToBn(buf) {
    var hex = [];
    var u8 = Uint8Array.from(buf);
    u8.forEach(function (i) {
        var h = i.toString(16);
        if (h.length % 2) { h = '0' + h; }
        hex.push(h);
    });
    return BigInt('0x' + hex.join(''));
}

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
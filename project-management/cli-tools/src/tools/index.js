import fs from 'fs';

function byteToKb(byte) {
    return byte / 1024;
}

function calculateByteSize(text) {
    const encoder = new TextEncoder();
    const encodedText = encoder.encode(text);
    console.log('kb size', byteToKb(encodedText.length));
    return encodedText.length;
}

function readTextFromFile(file) {
    return fs.readFileSync(file, 'utf8');
}

export default { calculateByteSize, readTextFromFile };
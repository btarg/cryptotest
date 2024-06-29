import { encryptAndAssignHash } from './encryption.js';
import { decryptFile } from './decryption.js';

document.getElementById('decryptButton').addEventListener('click', async () => {
    const fileInput = document.getElementById('encryptInput');
    const file = fileInput.files[0];
    const passwordInput = document.getElementById('passwordInput');
    const keyString = passwordInput.value;
    await decryptFile(file, keyString);
});

document.getElementById('encryptButton').addEventListener('click', async () => {
    const fileInput = document.getElementById('encryptInput');
    const file = fileInput.files[0];
    const passwordInput = document.getElementById('passwordInput');
    const keyString = passwordInput.value;
    const encryptedFile = await encryptAndAssignHash(file, keyString);
    // save the encrypted file
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(encryptedFile);
    downloadLink.download = 'encrypted_file';
    downloadLink.click();

});
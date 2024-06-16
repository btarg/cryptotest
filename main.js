import { encryptAndAssignHash } from './encryption.js';
import { handleDownload } from './decrypt-worker.js';

document.getElementById('decryptButton').addEventListener('click', async () => {
    const fileInput = document.getElementById('encryptInput');
    const file = fileInput.files[0];
    const ivInput = document.getElementById('ivInput');
    const ivString = ivInput.value;
    const keyString = 'my-secret-key';
    await handleDownload(file, ivString, keyString);
});

document.getElementById('encryptButton').addEventListener('click', async () => {
    const fileInput = document.getElementById('encryptInput');
    const file = fileInput.files[0];
    const keyString = 'my-secret-key';
    const encryptedFile = await encryptAndAssignHash(file, keyString);
    console.log("Initial IV: " + encryptedFile.iv);
    // save the encrypted file
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(encryptedFile);
    downloadLink.download = 'encrypted_file';
    downloadLink.click();

});
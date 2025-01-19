import fs from 'fs';
export function generateRandomPassword() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 12; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    password += characters[randomIndex];
  }
  return password;
}

export function generateDottedUsername(name) {
  return name.toLowerCase().replace(/\s/g, '.');
}

export function readJsonFile(filePath) {
  const fileData = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(fileData);
}

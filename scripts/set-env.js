const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env');
const envVars = {};

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...val] = trimmed.split('=');
      if (key && val.length > 0) {
        envVars[key.trim()] = val.join('=').trim().replace(/(^['"]|['"]$)/g, '');
      }
    }
  });
}

const apiUrl =
  process.env.API_URL ||
  envVars.API_URL ||
  'https://portafolio-back.onrender.com/api';

const whatsappNumber =
  process.env.WHATSAPP_NUMBER ||
  envVars.WHATSAPP_NUMBER ||
  '573000000000';

const storeName =
  process.env.STORE_NAME ||
  envVars.STORE_NAME ||
  'Vitrina & Catálogo';

const envProdContent = `// Generado automáticamente por scripts/set-env.js
export const environment = {
  production: true,
  apiUrl: '${apiUrl}',
  whatsappNumber: '${whatsappNumber}',
  storeName: '${storeName}',
};
`;

const targetDir = path.resolve(__dirname, '../src/environments');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

fs.writeFileSync(path.join(targetDir, 'environment.prod.ts'), envProdContent);
console.log(`✅ environment.prod.ts generado con API_URL: ${apiUrl}`);


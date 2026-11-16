// Genera src/environments/environment.prod.ts a partir de la variable de entorno API_URL.
// En Vercel: Settings > Environment Variables > API_URL = https://api.tu-dominio.com
// Si API_URL no esta definida, se usa el environment.prod.ts que esta en el repositorio.
import { writeFileSync } from 'node:fs';

const apiUrl = (process.env.API_URL ?? '').trim().replace(/\/+$/, '');

if (!apiUrl) {
  console.log('[set-env] API_URL no definida: se usa environment.prod.ts del repositorio.');
  process.exit(0);
}

if (!/^https:\/\//.test(apiUrl)) {
  console.error(`[set-env] API_URL debe empezar con https:// (recibido: ${apiUrl})`);
  process.exit(1);
}

const apiUrlFinal = apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`;

const contenido = `export const environment = {
  production: true,
  apiUrl: '${apiUrlFinal}',
  storageUrl: '',
};
`;

writeFileSync(new URL('../src/environments/environment.prod.ts', import.meta.url), contenido);
console.log(`[set-env] environment.prod.ts generado con apiUrl = ${apiUrlFinal}`);

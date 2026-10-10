import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'lifeos-api',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/api/data') {
            const dbPath = path.resolve(__dirname, 'data.json');
            
            // Estructura por defecto para inicializar data.json
            const defaultData = {
              transactions: [],
              budgets: {},
              categories: [
                'Comida & Bebida',
                'Vivienda & Renta',
                'Servicios (Luz, Internet, etc.)',
                'Transporte & Gasolina',
                'Salud & Médico',
                'Entretenimiento & Ocio',
                'Suscripciones',
                'Educación',
                'Ingresos (Sueldo/Ventas)',
                'Otros'
              ]
            };

            // Asegurar que exista el archivo
            if (!fs.existsSync(dbPath)) {
              fs.writeFileSync(dbPath, JSON.stringify(defaultData, null, 2), 'utf8');
            }

            // Manejar GET /api/data
            if (req.method === 'GET') {
              try {
                const data = fs.readFileSync(dbPath, 'utf8');
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(data);
              } catch {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Error al leer la base de datos local' }));
              }
              return;
            }

            // Manejar POST /api/data
            if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => {
                body += chunk.toString();
              });
              req.on('end', () => {
                try {
                  const parsed = JSON.parse(body);
                  fs.writeFileSync(dbPath, JSON.stringify(parsed, null, 2), 'utf8');
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ success: true }));
                } catch {
                  res.writeHead(400, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Formato JSON inválido' }));
                }
              });
              return;
            }
          }
          next();
        });
      }
    }
  ]
})

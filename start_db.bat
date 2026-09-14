@echo off
echo Levantando la base de datos PostgreSQL con Docker...
docker-compose up -d

echo Esperando a que la base de datos este lista (5 segundos)...
timeout /t 5 /nobreak > NUL

echo Ejecutando migraciones de Prisma...
npx prisma db push

echo Cargando datos iniciales (Usuarios desde PDF)...
node prisma/seed.js

echo Todo listo! Puedes correr la web con: npm run dev
pause

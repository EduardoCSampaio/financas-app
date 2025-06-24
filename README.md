# Frontend Next.js

## Como rodar localmente

1. Instale as dependências:
   
   ```bash
   cd frontend
   npm install
   ```

2. Rode o servidor de desenvolvimento:
   
   ```bash
   npm run dev
   ```

Acesse: http://localhost:3000

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# Como rodar o projeto

## Rodar tudo junto (backend + frontend)

```
npm run dev:all
```

## Rodar apenas o frontend (Next.js)

```
cd frontend
npm install
npm run dev
```

## Rodar o PWA (build de produção)

```
cd frontend
npm run build:pwa
npm start
```

## Rodar apenas o backend (FastAPI)

```
cd backend
uvicorn app.main:app --reload
```

## Rodar testes do frontend

```
cd frontend
npm test
```

## Rodar testes E2E (Cypress)

```
cd frontend
npx cypress open
```

## Rodar testes do backend

```
cd backend
pytest
```

# Como configurar o frontend para acessar o backend na rede

Crie ou edite o arquivo `.env.local` na pasta frontend:

```
NEXT_PUBLIC_API_URL=http://192.168.15.16:8000
```

Assim o frontend pode se comunicar com o backend pelo IP da máquina.

# Escola das Nações — Reencontro 2006 🎓

Site privado do reencontro de 20 anos da turma de 2006 da Escola das Nações.

---

## Stack

- **Next.js 14** (App Router)
- **Neon** (Postgres serverless) + **Prisma**
- **NextAuth.js v5** (credentials — passphrase compartilhada)
- **Tailwind CSS** + design tokens EDN
- **Uploadthing** (uploads de fotos e vídeos)
- Deploy: **Vercel**

---

## Setup

### 1. Clonar e instalar

```bash
git clone <seu-repo>
cd edn-reunion
npm install
```

### 2. Variáveis de ambiente

```bash
cp .env.example .env.local
```

Preencha os valores no `.env.local`:

| Variável | Onde encontrar |
|---|---|
| `DATABASE_URL` | Neon → Connection Details → Pooled |
| `DIRECT_URL` | Neon → Connection Details → Direct |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `LOGIN_PASSPHRASE` | Defina uma senha para os membros |
| `ADMIN_PASSPHRASE` | Defina uma senha separada para admin |
| `UPLOADTHING_SECRET` | uploadthing.com → seu projeto |
| `UPLOADTHING_APP_ID` | uploadthing.com → seu projeto |

### 3. Banco de dados

```bash
npm run db:push     # cria as tabelas no Neon
npm run db:studio   # (opcional) abre o Prisma Studio
```

### 4. Rodar localmente

```bash
npm run dev
# → http://localhost:3000
```

---

## Uso

### Primeiro acesso (admin)

1. Acesse `/login`
2. Use qualquer e-mail + a `ADMIN_PASSPHRASE`
3. Você será marcado como admin

### Gerar o link de convite

1. Acesse `/admin`
2. Clique em **"Gerar link"**
3. Compartilhe o link gerado com os colegas (ex: WhatsApp)

O link tem o formato:
```
https://seu-site.vercel.app/register/XXXXXXXXXXXXXXXX
```

Ao clicar em **"Rotacionar link"**, o link anterior deixa de funcionar imediatamente.

### Login dos membros

Após criar o perfil via link de convite, os membros acessam `/login` com:
- **E-mail**: o e-mail cadastrado no perfil
- **Senha**: a `LOGIN_PASSPHRASE` que você compartilha com todos

---

## Configurar detalhes do evento

Edite `src/lib/constants.ts`:

```ts
export const EVENT = {
  date:          "2026-09-20",     // data do evento
  time:          "18:00",
  venueName:     "Nome do Local",
  venueAddress:  "Endereço completo",
  venueCity:     "Brasília, DF — Brasil",
  mapsUrl:       "https://maps.google.com/?q=...",
  costPerPerson: 150,              // valor em R$
  paymentInfo:   "PIX: email@email.com",
  whatsIncluded: ["Churrasco", "Chopp", "..."],
};

export const GOOGLE_PHOTOS_ALBUM_URL =
  "https://photos.app.goo.gl/SEU_ALBUM";
```

---

## Deploy no Vercel

```bash
# Instale a CLI do Vercel
npm i -g vercel

# Deploy
vercel

# Configure as variáveis de ambiente no dashboard do Vercel:
# Settings → Environment Variables → (copie do .env.local)
```

Ou conecte o repo ao Vercel pelo GitHub e configure as env vars no dashboard.

---

## Páginas

| Rota | Acesso | Descrição |
|---|---|---|
| `/login` | Público | Login com passphrase |
| `/register/[token]` | Token secreto | Cadastro de novo membro |
| `/dashboard` | Membros | Painel principal |
| `/rsvp` | Membros | Confirmação de presença |
| `/memories` | Membros | Fotos, histórias, citações |
| `/classmates` | Membros | Antes e depois da turma |
| `/messages` | Membros | Mensagens em vídeo |
| `/profile/edit` | Membros | Editar perfil |
| `/admin` | Admin | Painel de administração |

---

## Próximos passos

- [ ] Configurar Uploadthing para upload de fotos (Then & Now) e vídeos
- [ ] Preencher detalhes do evento em `constants.ts`
- [ ] Adicionar link do álbum do Google Fotos em `constants.ts`
- [ ] Definir as passphrases no `.env.local`
- [ ] Fazer o primeiro deploy no Vercel
- [ ] Gerar o primeiro link de convite pelo `/admin`

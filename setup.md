# Quick Setup Guide

## 1. Get Railway Database URL

Go to your Railway dashboard:
1. Open https://railway.com/project/3b8f67bb-17ef-4d9c-87a2-af6e861a25b9
2. Click on the Postgres service
3. Go to the "Variables" tab
4. Copy the `DATABASE_URL` value

## 2. Create .env.local file

Create a `.env.local` file in the root directory with:

```bash
DATABASE_URL=<paste your Railway DATABASE_URL here>
JWT_SECRET=your-super-secret-jwt-key-change-this
PORT=3000
NODE_ENV=development
VITE_API_URL=http://localhost:3000
```

## 3. Install Dependencies

Since the full monorepo install is slow, let's install each part separately:

```bash
# Install database package
cd packages/database
npm install
cd ../..

# Generate Prisma client
npm run db:generate

# Push schema to Railway database
npm run db:push
```

## 4. Install and run the backend (in a new terminal)

```bash
cd apps/bff
npm install
npm run dev
```

## 5. Install and run the frontend (in another terminal)

```bash
cd apps/web
npm install
npm run dev
```

## Alternative: Use Railway CLI

If you want to use Railway variables directly:

```bash
# In the root directory
railway link

# Then select:
# 1. Gaguero's Projects
# 2. staffnbdt
# 3. Postgres (for database commands)

# Now you can run with Railway variables:
railway run npm run db:push
```

## Next Steps

Once setup is complete, we'll use subagents to build:
1. Backend API with NestJS
2. Frontend with React
3. Authentication system
4. All feature modules
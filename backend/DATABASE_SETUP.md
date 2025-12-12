# Database Setup Guide

This guide will help you set up PostgreSQL database for the Sawa App backend.

## 📋 Prerequisites

- PostgreSQL installed locally or access to a PostgreSQL database
- Node.js and npm installed

## 🚀 Quick Start

### 1. Install PostgreSQL

**macOS (using Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download and install from [PostgreSQL Downloads](https://www.postgresql.org/download/windows/)

**Using Docker:**
```bash
docker run --name sawa-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=sawa_db \
  -p 5432:5432 \
  -d postgres:15
```

### 2. Create Database

Connect to PostgreSQL:
```bash
psql -U postgres
```

Create database and user:
```sql
CREATE DATABASE sawa_db;
CREATE USER sawa_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE sawa_db TO sawa_user;
\q
```

### 3. Configure Environment Variables

Copy the example environment file:
```bash
cd backend
cp .env.example .env
```

Update `.env` with your database credentials:
```env
DATABASE_URL=postgresql://sawa_user:your_password@localhost:5432/sawa_db?schema=public
```

**Connection String Format:**
```
postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA
```

### 4. Run Migrations

Generate Prisma Client:
```bash
npm run db:generate
```

Push schema to database (for development):
```bash
npm run db:push
```

Or create a migration (for production):
```bash
npm run db:migrate
```

### 5. Seed Database (Optional)

```bash
npm run db:seed
```

### 6. Verify Connection

Start the server:
```bash
npm run dev
```

Check health endpoint:
```bash
curl http://localhost:3001/health
```

You should see:
```json
{
  "status": "ok",
  "timestamp": "...",
  "environment": "development",
  "database": "connected"
}
```

## 🛠️ Database Commands

### Generate Prisma Client
```bash
npm run db:generate
```
Generates Prisma Client based on your schema.

### Push Schema Changes (Development)
```bash
npm run db:push
```
Pushes schema changes directly to database without creating migration files. Use for rapid prototyping.

### Create Migration (Production)
```bash
npm run db:migrate
```
Creates a migration file and applies it to the database. Use for production-ready changes.

### Deploy Migrations (Production)
```bash
npm run db:migrate:deploy
```
Applies pending migrations to production database without creating new migration files.

### Reset Database
```bash
npm run db:migrate:reset
```
⚠️ **Warning**: This will delete all data and recreate the database.

### Open Prisma Studio
```bash
npm run db:studio
```
Opens a visual database browser at http://localhost:5555

### Seed Database
```bash
npm run db:seed
```
Runs the seed script to populate initial data.

## 📊 Database Schema

The current schema includes:

- **User** model - User accounts

Add more models in `prisma/schema.prisma` as your app grows.

## 🔒 Security Best Practices

1. **Never commit `.env` file** - It contains sensitive credentials
2. **Use strong passwords** - Especially in production
3. **Limit database access** - Use specific users with minimal privileges
4. **Use connection pooling** - Prisma handles this automatically
5. **Enable SSL in production** - Add `?sslmode=require` to DATABASE_URL

## ☁️ Cloud Database Options

### PostgreSQL Cloud Providers:

1. **Supabase** (Free tier available)
   - https://supabase.com
   - Provides PostgreSQL with additional features

2. **Neon** (Serverless PostgreSQL)
   - https://neon.tech
   - Great for serverless deployments

3. **Railway**
   - https://railway.app
   - Easy PostgreSQL hosting

4. **AWS RDS**
   - https://aws.amazon.com/rds/postgresql/
   - Enterprise-grade solution

5. **Heroku Postgres**
   - https://www.heroku.com/postgres
   - Simple managed PostgreSQL

### Using Cloud Database:

1. Create a database instance
2. Get the connection string
3. Update `DATABASE_URL` in `.env`
4. Run migrations: `npm run db:migrate:deploy`

## 🐛 Troubleshooting

### Connection Refused
- Check PostgreSQL is running: `pg_isready`
- Verify port 5432 is not blocked
- Check firewall settings

### Authentication Failed
- Verify username and password in `.env`
- Check PostgreSQL user permissions
- Ensure database exists

### Migration Errors
- Check database connection
- Verify schema syntax in `prisma/schema.prisma`
- Try resetting: `npm run db:migrate:reset` (⚠️ deletes data)

### Prisma Client Not Found
- Run `npm run db:generate`
- Check `node_modules/.prisma/client` exists

## 📚 Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma Migrate Guide](https://www.prisma.io/docs/concepts/components/prisma-migrate)


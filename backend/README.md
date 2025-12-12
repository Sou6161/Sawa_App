# Sawa Backend API

Professional Express.js API server with PostgreSQL database, built with TypeScript and Prisma.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Database

See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed instructions.

Quick setup:
```bash
# Copy environment file
cp .env.example .env

# Update DATABASE_URL in .env
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE

# Generate Prisma Client
npm run db:generate

# Push schema to database (development)
npm run db:push

# Or create migration (production)
npm run db:migrate
```

### 3. Start Development Server
```bash
npm run dev
```

Server will start on `http://localhost:3001`

## 📁 Project Structure

```
backend/
├── src/
│   ├── database/         # Database connection & Prisma client
│   ├── middleware/        # Express middleware
│   ├── routes/           # API route handlers
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   └── index.ts          # Application entry point
├── prisma/
│   ├── schema.prisma     # Database schema
│   ├── migrations/       # Database migrations
│   └── seed.ts           # Database seeding script
└── dist/                 # Compiled JavaScript (generated)
```

## 🛠️ Available Scripts

### Development
- `npm run dev` - Start development server with hot reload
- `npm run type-check` - Type check without compiling

### Database
- `npm run db:generate` - Generate Prisma Client
- `npm run db:push` - Push schema changes (development)
- `npm run db:migrate` - Create and apply migration
- `npm run db:migrate:deploy` - Deploy migrations (production)
- `npm run db:migrate:reset` - Reset database (⚠️ deletes data)
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database

### Production
- `npm run build` - Build for production
- `npm start` - Start production server

### Code Quality
- `npm run lint` - Lint code
- `npm run lint:fix` - Fix linting issues
- `npm run format` - Format code with Prettier

## 🔌 API Endpoints

### Health Checks
- `GET /health` - Server and database health check
- `GET /api/health` - API health check

More endpoints will be added as the application grows.

## 🗄️ Database

This project uses **Prisma** as the ORM and **PostgreSQL** as the database.

### Models

Current models:
- **User** - User accounts

Add more models in `prisma/schema.prisma`.

### Using Prisma Client

```typescript
import { prisma } from "./database";

// Example: Create a user
const user = await prisma.user.create({
  data: {
    email: "user@example.com",
    name: "John Doe",
  },
});

// Example: Find users
const users = await prisma.user.findMany();

// Example: Update user
const updatedUser = await prisma.user.update({
  where: { id: userId },
  data: { name: "Jane Doe" },
});
```

## 🔒 Environment Variables

Required environment variables (see `.env.example`):

- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)
- `CORS_ORIGIN` - Allowed CORS origins
- `JWT_SECRET` - Secret for JWT tokens (if using authentication)

## 📚 Documentation

- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - Database setup guide
- [Prisma Documentation](https://www.prisma.io/docs)
- [Express.js Documentation](https://expressjs.com/)

## 🧪 Testing

Testing setup will be added in future updates.

## 🚀 Deployment

1. Set environment variables
2. Run migrations: `npm run db:migrate:deploy`
3. Build: `npm run build`
4. Start: `npm start`

## 📝 License

ISC


# Project Mate Backend

Express.js + PostgreSQL + Prisma backend for Project Mate tutoring platform.

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher) installed and running
- npm or yarn

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Database

Update the `DATABASE_URL` in `.env` file with your PostgreSQL credentials:

```env
DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/project_mate?schema=public"
```

Replace:
- `USERNAME` - Your PostgreSQL username (default: `postgres`)
- `PASSWORD` - Your PostgreSQL password
- `project_mate` - Database name (you can change this)

### 3. Create Database

Option A: Using psql command line:
```bash
psql -U postgres
CREATE DATABASE project_mate;
\q
```

Option B: Using pgAdmin GUI:
- Open pgAdmin
- Right-click on "Databases"
- Select "Create" > "Database"
- Name it "project_mate"

### 4. Run Database Migrations

This will create all the tables in your database:

```bash
npm run db:push
```

Or if you want to create a migration file:
```bash
npm run db:migrate
```

### 5. Generate Prisma Client

```bash
npm run db:generate
```

### 6. Start Development Server

```bash
npm run dev
```

The backend will run on: `http://localhost:5000`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run db:generate` - Generate Prisma Client
- `npm run db:push` - Push schema changes to database (dev)
- `npm run db:migrate` - Create and run migrations (production-ready)
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run lint` - Type check with TypeScript

## Database Management

### Prisma Studio (Database GUI)

View and edit your database with a GUI:

```bash
npm run db:studio
```

This will open `http://localhost:5555` in your browser.

### View Database Schema

```bash
npx prisma studio
```

### Reset Database (WARNING: Deletes all data)

```bash
npx prisma migrate reset
```

## Project Structure

```
backend/
├── prisma/
│   └── schema.prisma     # Database schema
├── src/
│   ├── config/           # Configuration files
│   ├── middleware/       # Express middleware
│   ├── modules/          # Feature modules (routes, controllers)
│   ├── utils/            # Utility functions
│   ├── app.ts            # Express app setup
│   └── server.ts         # Server entry point
├── .env                  # Environment variables
├── package.json
└── tsconfig.json
```

## API Endpoints

Base URL: `http://localhost:5000/api`

### Health Check
- `GET /api/health` - Check server and database status

### Users
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/users/:id` - Get user profile

### Connections (Coming Soon)
- `POST /api/connections` - Create connection
- `GET /api/connections` - Get user connections
- `POST /api/connections/:id/messages` - Send message

See full API documentation in `/docs/CONNECTION_FLOW.md`

## Environment Variables

```env
# Server Configuration
NODE_ENV=development
PORT=5000
CLIENT_ORIGIN=http://localhost:4200

# Database (Required)
DATABASE_URL="postgresql://postgres:password@localhost:5432/project_mate"

# Authentication
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d

# Logging
LOG_LEVEL=dev
```

## Troubleshooting

### Database Connection Error

**Error:** `Can't reach database server at localhost:5432`

**Solutions:**
1. Check if PostgreSQL is running:
   ```bash
   # Windows
   services.msc  # Look for "postgresql" service
   
   # Or check in Task Manager > Services
   ```

2. Verify PostgreSQL is listening on port 5432:
   ```bash
   netstat -an | findstr 5432
   ```

3. Check your DATABASE_URL credentials in `.env`

### Prisma Generate Error

**Error:** `Prisma schema not found`

**Solution:**
Make sure you're in the `backend/` directory when running Prisma commands.

### Module Not Found

**Error:** `Cannot find module '@prisma/client'`

**Solution:**
```bash
npm install
npm run db:generate
```

## Development Workflow

1. Make changes to Prisma schema (`prisma/schema.prisma`)
2. Push changes to database:
   ```bash
   npm run db:push
   ```
3. Regenerate Prisma Client:
   ```bash
   npm run db:generate
   ```
4. Restart dev server (auto-restarts if using `npm run dev`)

## Testing Database Connection

After setup, test if everything works:

```bash
# Start the server
npm run dev

# In another terminal, test the health endpoint
curl http://localhost:5000/api/health
```

You should see:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "database": {
      "connected": true
    }
  }
}
```

## Next Steps

1. ✅ Database setup complete
2. ⏳ Implement authentication (JWT)
3. ⏳ Implement connection flow
4. ⏳ Implement messaging system
5. ⏳ Connect frontend to backend

See `/docs/CONNECTION_FLOW.md` for the complete implementation plan.

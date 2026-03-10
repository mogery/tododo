# tododo

A self-hostable todo tracking application with recurring tasks, built with Next.js 16, PostgreSQL, and Drizzle ORM.

## Features

- **One-time tasks** - Create tasks with optional due dates and descriptions
- **Recurring tasks** - Set up daily, weekly, or monthly recurring tasks
- **Tags** - Organize tasks with color-coded tags
- **Mobile-first** - Responsive design with bottom navigation on mobile
- **Self-hostable** - Deploy with Docker or run standalone

## Quick Start with Docker

```bash
# Clone the repository
git clone https://github.com/mogery/tododo.git
cd tododo

# Start the application
docker compose up -d

# Open http://localhost:3000
```

## Development

### Prerequisites

- Node.js 20+
- pnpm
- Docker (for PostgreSQL)

### Setup

```bash
# Install dependencies
pnpm install

# Start the database
docker compose up -d db

# Push the database schema
pnpm db:push

# Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Database Commands

```bash
pnpm db:generate  # Generate migrations from schema changes
pnpm db:migrate   # Run migrations
pnpm db:push      # Push schema directly (development)
pnpm db:studio    # Open Drizzle Studio
```

## Deployment

### Using the pre-built image

Create a `compose.yml` file:

```yaml
services:
  app:
    image: ghcr.io/mogery/tododo:main
    restart: unless-stopped
    ports:
      - 3000:3000
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/postgres
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:17
    restart: unless-stopped
    shm_size: 128mb
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    volumes:
      - postgres-data:/var/lib/postgresql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres-data:
```

Then run:

```bash
docker compose up -d
```

### Building from source

```bash
docker compose up -d --build
```

## Tech Stack

- **Framework**: Next.js 16 with React 19
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS 4 with ShadCN components
- **Icons**: Phosphor Icons
- **Deployment**: Docker with GitHub Actions CI/CD

## License

MIT

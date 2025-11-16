# Sentinel

A beautiful, open-source status page monitoring system built with Next.js 15, TypeScript, and PostgreSQL. Self-host your own status page and monitor your services with style.

![License](https://img.shields.io/badge/license-MIT-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED)

## Features

- **Beautiful UI** - Clean, modern interface with smooth animations
- **Real-time Monitoring** - Automatically ping your endpoints at custom intervals (10s, 60s, etc.)
- **90-Day Uptime Visualization** - Uptime graphs showing daily status with color-coded indicators
- **Admin Portal** - Easy-to-use dashboard to manage endpoints and customize your status page
- **Fully Customizable** - Brand your status page with custom colors, logos, and text
- **Self-Hosted** - Own your data, no monthly fees
- **Docker-First** - One command deployment with Docker Compose

## Screenshots

<img src="status-page.png" alt="Status Page" width="600">

<img src="admin-portal.png" alt="Admin Portal" width="600">

## Quick Start

### Prerequisites

- Docker & Docker Compose

That's it.

### Installation

1. **Download the compose file**
```bash
curl -O https://raw.githubusercontent.com/Cosmofy/sentinal/main/compose.yml
```

2. **Start the application**
```bash
docker compose up -d
```

3. **Access your status page**
- **Status Page**: http://localhost:22571
- **Admin Portal**: http://localhost:22571/admin (default password: `admin123`)

### Configuration (Optional)

The only thing you might want to change is the admin password. Edit `compose.yml`:

```yaml
# ⚠️ CHANGE THIS - Your admin portal password (default: admin123)
NEXT_PUBLIC_ADMIN_PASSWORD: your_secure_password
```

Everything else is pre-configured and ready to go!

### Adding Your First Endpoint

1. Navigate to http://localhost:22571/admin
2. Enter the admin password
3. Click "Add Endpoint"
4. Fill in the details:
   - **Title**: Production API
   - **URL**: https://api.example.com/health
   - **Interval**: 60 (seconds)
   - **Expected Status Code**: 200
5. Click "Create"

Monitoring starts automatically!

## Tech Stack

- **Frontend**: Next.js 15 (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Database**: PostgreSQL 15
- **ORM**: Prisma
- **Monitoring**: node-cron + axios
- **Deployment**: Docker + Docker Compose

## Development

To run locally without Docker:

```bash
# Install dependencies
npm install

# Set up database
createdb sentinel
echo 'DATABASE_URL="postgresql://user:password@localhost:5432/sentinel"' > .env
echo 'NEXT_PUBLIC_ADMIN_PASSWORD="admin123"' >> .env

# Run migrations
npx prisma migrate dev

# Start dev server
npm run dev
```

## Stopping the Application

```bash
docker compose down
```

To remove all data including the database:
```bash
docker compose down -v
```

## Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## License

MIT License - see [LICENSE](LICENSE) for details.

---

Made with ❤️ for the open-source community.

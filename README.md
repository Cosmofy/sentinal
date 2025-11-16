# Status Page

A beautiful, open-source status page monitoring system built with Next.js 15, TypeScript, and PostgreSQL. Self-host your own status page for $0/month and monitor your services with style.

![Status Page](https://img.shields.io/badge/Status-Operational-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)
![Next.js](https://img.shields.io/badge/Next.js-15-black)

## Features

- **Beautiful UI** - Heavily inspired by Vercel and Incident.io with smooth animations and polished design
- **Real-time Monitoring** - Automatically ping your endpoints at custom intervals (10s, 60s, etc.)
- **90-Day Uptime Visualization** - Gorgeous uptime graphs showing daily status with color-coded indicators
- **Admin Portal** - Easy-to-use dashboard to manage endpoints and customize your status page
- **Fully Customizable** - Brand your status page with custom colors, logos, and text
- **Self-Hosted** - Own your data, no monthly fees
- **Open Source** - Built for the community, by the community

## Screenshots

*(Coming soon - add screenshots here)*

## Tech Stack

- **Frontend**: Next.js 15 (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Monitoring**: node-cron + axios
- **Icons**: Lucide React

## Quick Start

### Prerequisites

Before you begin, make sure you have:

- Node.js 18 or higher
- PostgreSQL database
- npm or yarn
- Git

### Step 1: Install PostgreSQL

#### macOS (using Homebrew)

```bash
brew install postgresql@15
brew services start postgresql@15
```

#### Ubuntu/Debian

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### Windows

Download and install from [PostgreSQL Downloads](https://www.postgresql.org/download/windows/)

### Step 2: Create a Database

```bash
# Connect to PostgreSQL
psql postgres

# Create a new database
CREATE DATABASE statuspage;

# Create a user (optional but recommended)
CREATE USER statususer WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE statuspage TO statususer;

# Exit
\q
```

### Step 3: Clone and Install

```bash
# Clone the repository
git clone https://github.com/yourusername/status-page.git
cd status-page

# Install dependencies
npm install
```

### Step 4: Configure Environment

```bash
# Copy the example env file
cp .env.example .env
```

Edit your `.env` file:

```env
DATABASE_URL="postgresql://statususer:your_password@localhost:5432/statuspage?schema=public"
NEXT_PUBLIC_ADMIN_PASSWORD="admin123"
```

### Step 5: Initialize the Database

```bash
# Run Prisma migrations to create tables
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate
```

You should see output confirming the tables were created:
- endpoints
- pings
- status_page_config

### Step 6: Start the Application

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm run build
npm start
```

The application will be available at:
- **Public Status Page**: http://localhost:3000
- **Admin Portal**: http://localhost:3000/admin (password: admin123)
- **Settings**: http://localhost:3000/admin/settings

### Step 7: Add Your First Endpoint

1. Navigate to http://localhost:3000/admin
2. Click "Add Endpoint"
3. Fill in the form:
   - Title: Production API
   - URL: https://api.example.com/health
   - Interval: 60 (seconds)
   - Expected Status Code: 200
4. Click "Create"

The monitoring will start automatically!

## Usage

### Adding Endpoints

1. Go to the **Admin Portal** at `/admin`
2. Click **"Add Endpoint"**
3. Fill in the details:
   - **Title**: Display name (e.g., "Production API")
   - **URL**: Endpoint to monitor (e.g., "https://api.example.com/health")
   - **Interval**: How often to ping in seconds (minimum 10s)
   - **Expected Status Code**: Expected HTTP status (usually 200)
4. Click **"Create"**

The monitoring will start automatically!

### Customizing Your Status Page

1. Go to **Settings** at `/admin/settings`
2. Configure:
   - Page title
   - Company name
   - Logo URL
   - Primary color
   - Header/footer text
3. Click **"Save Settings"**

### Understanding the Status Indicators

- **Green (Operational)**: ≥99% uptime for the day
- **Yellow (Degraded)**: 98-99% uptime
- **Red (Down)**: <98% uptime
- **Gray (No Data)**: No monitoring data available

## Project Structure

```
status-page/
├── app/
│   ├── api/              # API routes
│   │   ├── endpoints/    # Endpoint CRUD
│   │   ├── status/       # Public status data
│   │   ├── config/       # Settings management
│   │   └── monitor/      # Monitoring initialization
│   ├── admin/            # Admin portal pages
│   │   ├── page.tsx      # Main admin dashboard
│   │   └── settings/     # Settings page
│   ├── page.tsx          # Public status page
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── lib/
│   ├── prisma.ts         # Prisma client
│   ├── monitor.ts        # Monitoring service
│   └── utils.ts          # Utility functions
├── prisma/
│   └── schema.prisma     # Database schema
└── public/               # Static assets
```

## Configuration

### Environment Variables

```env
DATABASE_URL="postgresql://user:password@localhost:5432/statuspage?schema=public"
```

### Database Schema

The application uses three main tables:

- **endpoints**: Stores monitored endpoints
- **pings**: Stores individual ping results
- **status_page_config**: Stores customization settings

## Troubleshooting

### Database Connection Issues

**Error**: `Can't reach database server`

**Solution**: Make sure PostgreSQL is running:

```bash
# macOS
brew services list

# Linux
sudo systemctl status postgresql

# If not running, start it:
brew services start postgresql@15  # macOS
sudo systemctl start postgresql    # Linux
```

### Port Already in Use

**Error**: `Port 3000 is already in use`

**Solution**: Either stop the process using port 3000, or change the port:

```bash
# Run on a different port
PORT=3001 npm run dev
```

### Prisma Issues

**Error**: `Prisma Client is not generated`

**Solution**: Generate the Prisma Client:

```bash
npx prisma generate
```

### Node Version Issues

**Error**: Issues with dependencies

**Solution**: Make sure you're using Node.js 18+:

```bash
node --version  # Should be v18.0.0 or higher

# If not, use nvm to switch versions
nvm install 18
nvm use 18
```

## Deployment

### Option 1: Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click "New Project"
4. Import your GitHub repository
5. Add environment variables:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `NEXT_PUBLIC_ADMIN_PASSWORD`: Your admin password
6. Click "Deploy"

**Note**: You'll need a hosted PostgreSQL database for production. Options:
- [Neon](https://neon.tech) - Free tier available
- [Supabase](https://supabase.com) - Free tier available
- [Railway](https://railway.app) - PostgreSQL hosting
- [Amazon RDS](https://aws.amazon.com/rds/)

### Option 2: VPS (DigitalOcean, Linode, etc.)

1. Set up a VPS with Ubuntu
2. Install Node.js and PostgreSQL
3. Clone your repository
4. Set up environment variables
5. Use PM2 to keep the app running:

```bash
npm install -g pm2
npm run build
pm2 start npm --name "status-page" -- start
```

### Option 3: Docker

*(Coming soon)*

## Contributing

We love contributions! Whether it's:

- Bug fixes
- New features
- Documentation improvements
- Design enhancements

Please feel free to open an issue or submit a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Show Your Support

If this project helps you, please give it a star on GitHub!

---

Made with ❤️ for the open-source community. No monthly fees, no vendor lock-in, just beautiful monitoring.

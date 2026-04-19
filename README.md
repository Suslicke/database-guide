# ⛁ Database Interview Prep — Senior Level

A comprehensive, interactive study guide for database interviews covering **SQL, NoSQL, indexing, performance, architecture, and more** — from Trainee to Lead level.

![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white)
![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

- **📖 60+ Topics** — Database fundamentals, SQL language, indexing, NoSQL, ClickHouse, Elasticsearch, NewSQL, and more
- **🏭 Real Production Examples** — Instagram, Netflix, Uber, Stripe, Cloudflare, GitHub, and many more
- **✅ Progress Tracking** — Check off topics as you study with visual progress
- **🧭 Interactive DB Selector** — Answer 5 questions, get a personalized database recommendation
- **⚡ Rapid-Fire Cheat Sheet** — Click-to-reveal one-liner answers for speed rounds
- **🔍 Search & Filter** — Search any topic, filter by experience level (Trainee → Lead)
- **📱 Responsive** — Works on desktop and mobile

## Covered Topics

| Section | Topics |
|---|---|
| Database Fundamentals | SQL vs NoSQL, ACID, BASE, Isolation Levels |
| SQL Language | DDL, DML, SELECT, JOINs, GROUP BY, CTEs, Window Functions |
| Indexing | B-Tree internals, all index types (GIN, GiST, BRIN), strategies, EXPLAIN |
| NoSQL | MongoDB, Redis, Cassandra, Neo4j, ClickHouse, Elasticsearch |
| NewSQL & Cloud | CockroachDB, TiDB, Spanner, Snowflake, BigQuery |
| Normalization | 1NF→BCNF, data types, denormalization patterns |
| Procedures & Triggers | Functions, stored procedures, triggers, views |
| MVCC & Transactions | PostgreSQL internals, VACUUM, locking, deadlocks |
| Security | SQL injection, roles, row-level security, encryption |
| Design Patterns | Soft deletes, event sourcing, CQRS, EAV, polymorphic |
| Performance | Query optimization, cursor pagination, partitioning, sharding |
| Tricky Questions | NULL traps, NOT IN gotcha, Nth salary, architecture gotchas |
| Model Answers | "When would you choose NoSQL?", "Design a database for X" |

## Quick Start

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/db-interview-prep.git
cd db-interview-prep

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Build for Production

```bash
npm run build
```

Output goes to `dist/` folder.

## Deploy to Cloudflare Pages

### Option 1: Git Integration (Recommended)

1. Push this repo to GitHub
2. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **Create**
3. Select **Pages** → **Connect to Git**
4. Select your repository
5. Set build settings:
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
6. Click **Save and Deploy**

Every push to `main` will auto-deploy.

### Option 2: Direct Upload

```bash
# Build first
npm run build

# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy
wrangler pages deploy dist --project-name=db-interview-prep
```

### Option 3: Drag & Drop

1. Run `npm run build`
2. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **Create**
3. Select **Pages** → **Upload assets**
4. Drag the `dist/` folder into the upload area
5. Deploy

## Tech Stack

- **Vite** — Fast build tool
- **React 18** — UI library
- **Outfit** — Display font
- **JetBrains Mono** — Code font
- No external UI libraries — pure React with inline styles

## License

MIT — use it however you want. Good luck with your interview! 🚀

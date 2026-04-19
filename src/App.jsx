import { useState, useRef, useEffect } from "react";

/*───────────────────────────────────────────────────────────
  DATA
───────────────────────────────────────────────────────────*/

const GUIDE_SECTIONS = [
  {
    id: "fundamentals",
    icon: "🧱",
    title: "Database Fundamentals",
    subtitle: "The foundation everything else builds on",
    topics: [
      {
        id: "what-is-db",
        title: "What Is a Database, Really?",
        level: "trainee",
        explanation: `Think of a database like a super-powered spreadsheet. Instead of just storing data in rows and columns, it gives you rules to keep data clean, ways to search through millions of rows in milliseconds, and guarantees that your data won't get corrupted even if the server crashes mid-operation.\n\nThere are two big families:\n\n**Relational (SQL) databases** store data in structured tables with predefined columns — like a well-organized filing cabinet where every document follows the same template. You define the structure first, then insert data.\n\n**Non-relational (NoSQL) databases** are more flexible — like a storage unit where you can throw in boxes of different sizes and shapes. You don't need to decide the structure upfront.`,
        production: `🏭 **Real-world example — E-commerce platform (Shopify-like):**\nPostgreSQL stores the core: orders, users, products, inventory with strict rules (you can't sell negative stock). Redis sits in front as a cache for product pages. Elasticsearch powers the search bar ("red shoes size 10"). This is called **polyglot persistence** — using different databases for different jobs.`,
        code: null,
      },
      {
        id: "sql-vs-nosql",
        title: "SQL vs NoSQL — Side by Side",
        level: "trainee",
        explanation: `The biggest misconception: "NoSQL is newer and better." In reality, each shines in different scenarios.\n\n**SQL databases** are like a strict accountant — everything must follow rules, every transaction is tracked, and the books always balance. Perfect when data integrity matters (money, medical records, inventory).\n\n**NoSQL databases** are like a flexible notepad — write whatever you want, in whatever format. Perfect when you need speed, scale, or your data doesn't fit neatly into tables.\n\n**Key differences:**\n→ Schema: SQL = fixed/rigid, NoSQL = flexible/dynamic\n→ Scaling: SQL = vertical (bigger server), NoSQL = horizontal (more servers)\n→ Transactions: SQL = strong ACID, NoSQL = eventual consistency (BASE)\n→ Queries: SQL = standardized language, NoSQL = varies per database`,
        production: `🏭 **When Instagram was growing:**\nThey started with PostgreSQL for user accounts and relationships. But as they hit 100M+ photos, they added Cassandra for the activity feed (billions of "Alice liked your photo" events) and Redis for caching. They didn't replace PostgreSQL — they added specialized tools.\n\n🏭 **When Uber handles ride matching:**\nMySQL/PostgreSQL for trip records and billing (needs ACID — you can't charge someone twice). But real-time location tracking at 1M+ updates/second? That goes to a custom solution built on top of Google's Spanner.`,
        code: `-- SQL: Structured, predictable, relational
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),  -- enforced relationship
    total DECIMAL(10,2) CHECK (total >= 0),  -- enforced rule
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- vs NoSQL (MongoDB): Flexible, nested, schema-free
// {
//   "_id": "order_abc123",
//   "user": { "id": "u_456", "name": "Alice" },
//   "items": [
//     { "product": "Widget", "qty": 3, "price": 29.99 },
//     { "product": "Gadget", "qty": 1, "price": 149.99,
//       "customization": { "color": "blue", "engraving": "Hello" } }
//   ],
//   "shipping": { "method": "express", "tracking": null }
// }`,
      },
      {
        id: "acid",
        title: "ACID — Why Banks Trust SQL",
        level: "junior",
        explanation: `ACID is a set of four guarantees that SQL databases provide for every transaction. Think of transferring $500 from Account A to Account B:\n\n**Atomicity** — "All or nothing." Either BOTH the debit from A AND the credit to B happen, or NEITHER does. No half-transfers.\n\n**Consistency** — "The rules always hold." If you have a rule that account balances can't go negative, no transaction can break that — the DB will reject it.\n\n**Isolation** — "No peeking at half-done work." Two simultaneous transfers don't interfere with each other.\n\n**Durability** — "Once confirmed, it's permanent." If the server crashes 1ms after "transfer complete," the data is still there when it reboots. Written to disk, not just memory.`,
        production: `🏭 **Why Stripe/PayPal absolutely need ACID:**\nImagine without atomicity: you charge a customer $100, the debit goes through, but the server crashes before crediting the merchant. Without ACID, $100 just vanished. With ACID, the entire transaction rolls back — the customer gets their money back automatically.\n\n🏭 **Knight Capital Group (2012):**\nA software bug caused millions of erroneous trading orders. Because the database tracked every transaction atomically, they could trace exactly what happened. The financial damage ($440M) could have been impossible to untangle without ACID.`,
        code: `-- Money transfer with full ACID guarantees
BEGIN;  -- start transaction (atomicity begins)

-- Debit from sender (consistency: check sufficient funds)
UPDATE accounts SET balance = balance - 500
WHERE id = 1 AND balance >= 500;

-- Credit to receiver
UPDATE accounts SET balance = balance + 500
WHERE id = 2;

-- If anything fails, ROLLBACK undoes everything
COMMIT;  -- durability: now written to disk permanently

-- ISOLATION happens automatically:
-- Other queries see OLD balances until COMMIT completes`,
      },
      {
        id: "base",
        title: "BASE — Why Netflix Accepts Stale Data",
        level: "junior",
        explanation: `BASE is the trade-off NoSQL databases make. Instead of strict consistency, they prioritize availability and performance:\n\n**Basically Available** — The system always responds, even if some nodes are down. Netflix doesn't show an error page — it might show slightly outdated recommendations, but it ALWAYS works.\n\n**Soft State** — Data might not be 100% consistent right now. Your "like" might take 2 seconds to appear for others.\n\n**Eventually Consistent** — Give it a moment and all copies of the data will agree. Like a group text — not everyone sees it at the exact same millisecond, but everyone gets it.\n\nThis is NOT worse than ACID — it's a different trade-off. For social media likes, eventual consistency is fine. For bank transfers, it's not.`,
        production: `🏭 **Amazon's shopping cart (DynamoDB origin story):**\nDuring Black Friday, Amazon decided it's better to ALWAYS let you add items to your cart (even if DB nodes disagree temporarily) than to show an error. If two replicas get conflicting cart updates, they MERGE them. They literally invented DynamoDB because of this philosophy.\n\n🏭 **Twitter's like count:**\nWhen a tweet gets 1M likes, some users might see 999,998 for a few seconds. Nobody notices, and the system handles 500K likes/second because of this flexibility.`,
        code: null,
      },
      {
        id: "isolation-levels",
        title: "Isolation Levels — The Performance vs Safety Dial",
        level: "mid",
        explanation: `Isolation levels are a dial between "maximum safety" and "maximum speed."\n\n**READ UNCOMMITTED** — See other transactions' uncommitted changes ("dirty reads"). Almost never used.\n\n**READ COMMITTED** (PostgreSQL default) — Only see committed data. But same row might change between two reads in one transaction.\n\n**REPEATABLE READ** (MySQL InnoDB default) — Once you read a row, it won't change for your transaction. But new rows may appear ("phantom reads").\n\n**SERIALIZABLE** — Full isolation. Transactions behave as if sequential. Safest but slowest.\n\n**Interview tip:** Know the DEFAULT isolation level of PostgreSQL vs MySQL, and explain WHY you'd change it.`,
        production: `🏭 **Airline booking system:**\nAt REPEATABLE READ: Two customers both see "Seat 14A available," both click "book." Without careful handling, both might succeed. Solution: SERIALIZABLE or SELECT ... FOR UPDATE.\n\n🏭 **Bank report generation:**\nA 30-minute financial report needs REPEATABLE READ or higher — otherwise data changes mid-report and totals won't add up. PostgreSQL's MVCC handles this efficiently with consistent snapshots.`,
        code: `-- Set isolation level for a transaction
BEGIN ISOLATION LEVEL SERIALIZABLE;
SELECT * FROM seats WHERE flight = 'UA123' AND status = 'available';
UPDATE seats SET status = 'booked', passenger = 'Alice'
WHERE flight = 'UA123' AND seat = '14A' AND status = 'available';
COMMIT;  -- fails if another TX already booked it

-- Check current isolation level (PostgreSQL)
SHOW default_transaction_isolation;`,
      },
    ],
  },
  {
    id: "sql-language",
    icon: "📝",
    title: "SQL Language — Complete Reference",
    subtitle: "Every SQL clause with clear explanations",
    topics: [
      {
        id: "ddl",
        title: "DDL — Building Your Schema",
        level: "trainee",
        explanation: `DDL (Data Definition Language) creates the structure of your database — like drawing the blueprint before building.\n\nKey commands: **CREATE** (build), **ALTER** (modify), **DROP** (demolish), **TRUNCATE** (empty out).\n\nThe most important part is **constraints** — rules that protect your data:\n→ PRIMARY KEY — uniquely identifies each row\n→ FOREIGN KEY — enforces relationships between tables\n→ UNIQUE — prevents duplicate values\n→ NOT NULL — column must have a value\n→ CHECK — custom validation rules\n→ DEFAULT — fallback value if none provided`,
        production: `🏭 **SaaS schema design (like Slack):**\nUsers, workspaces, channels, messages — all linked with foreign keys. The schema enforces "a message must belong to a channel" and "a channel must belong to a workspace." This prevents orphan records that would break the UI.`,
        code: `-- Production-style table with all constraint types
CREATE TABLE products (
    id          BIGSERIAL PRIMARY KEY,
    sku         VARCHAR(50) UNIQUE NOT NULL,
    name        VARCHAR(200) NOT NULL,
    description TEXT,
    price       DECIMAL(10,2) NOT NULL CHECK (price > 0),
    stock       INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    category_id INT REFERENCES categories(id) ON DELETE SET NULL,
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ALTER: Add column, constraint
ALTER TABLE products ADD COLUMN weight_kg DECIMAL(6,2);
ALTER TABLE products ADD CONSTRAINT uq_sku_vendor UNIQUE (vendor_id, sku);

-- TRUNCATE vs DROP
TRUNCATE TABLE logs;              -- deletes all rows, keeps structure
DROP TABLE IF EXISTS temp CASCADE; -- deletes entire table`,
      },
      {
        id: "dml",
        title: "DML — INSERT, UPDATE, DELETE & UPSERT",
        level: "trainee",
        explanation: `DML (Data Manipulation Language) is your day-to-day SQL.\n\n**UPSERT** (INSERT ... ON CONFLICT) is a production essential — "insert this, but if it exists, update instead." Without it, you'd need to check existence first, creating a race condition.\n\n**Batch operations** are crucial — inserting 10,000 rows one at a time is 100x slower than a single batch statement.\n\n**INSERT ... SELECT** copies data between tables — great for archiving old records.`,
        production: `🏭 **Product catalog sync:**\nEvery night, a supplier sends updated products. Some are new (INSERT), some have changed prices (UPDATE). UPSERT handles both in one statement.\n\n🏭 **High-volume event tracking:**\nEvery click, view, and action logged as batch INSERTs or via PostgreSQL COPY for maximum throughput.`,
        code: `-- Batch INSERT (much faster than one-by-one)
INSERT INTO events (user_id, event_type, metadata) VALUES
    (1, 'page_view', '{"page": "/home"}'),
    (1, 'click', '{"button": "signup"}'),
    (2, 'page_view', '{"page": "/pricing"}');

-- UPSERT: Insert or update on conflict
INSERT INTO products (sku, name, price, stock)
VALUES ('WIDGET-001', 'Blue Widget', 29.99, 150)
ON CONFLICT (sku) DO UPDATE SET
    price = EXCLUDED.price,
    stock = EXCLUDED.stock,
    updated_at = NOW();

-- UPDATE with JOIN
UPDATE products p SET is_active = false
FROM categories c
WHERE p.category_id = c.id AND c.name = 'Discontinued';

-- INSERT from SELECT (archive old data)
INSERT INTO orders_archive SELECT * FROM orders
WHERE created_at < NOW() - INTERVAL '2 years';

-- DELETE with subquery
DELETE FROM sessions WHERE user_id IN (
    SELECT id FROM users WHERE deleted_at IS NOT NULL
);`,
      },
      {
        id: "select-full",
        title: "SELECT — Filtering, Sorting, Pagination",
        level: "trainee",
        explanation: `SELECT is the most-used SQL statement. The key insight is **execution order** — SQL doesn't run in the order you write it:\n\n**Actual execution order:**\nFROM → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY → LIMIT\n\nThis is why you CAN'T use a column alias from SELECT in WHERE, but you CAN use it in ORDER BY.\n\n**Pagination tip:** OFFSET gets slower as pages increase (scans & discards all skipped rows). Use keyset/cursor pagination for production.`,
        production: `🏭 **Admin dashboard with dynamic filters:**\nFilter users by status, search by name, sort by signup date, paginate. It's one SELECT with dynamic WHERE clauses, built safely with parameterized queries to prevent SQL injection.`,
        code: `-- Full dashboard query with aggregation
SELECT
    u.id, u.name, u.email, u.plan,
    COUNT(o.id) AS order_count,
    COALESCE(SUM(o.total), 0) AS lifetime_value
FROM users u
LEFT JOIN orders o ON u.id = o.user_id AND o.status = 'completed'
WHERE u.created_at >= '2024-01-01'
  AND u.status = 'active'
  AND u.name ILIKE '%alice%'       -- case-insensitive search
GROUP BY u.id, u.name, u.email, u.plan
HAVING COUNT(o.id) > 0
ORDER BY lifetime_value DESC
LIMIT 20 OFFSET 0;

-- BETWEEN, IN, IS NULL
SELECT * FROM products
WHERE price BETWEEN 10 AND 100
  AND category IN ('Electronics', 'Books')
  AND deleted_at IS NULL;          -- NOT = NULL!`,
      },
      {
        id: "joins",
        title: "All JOIN Types Explained",
        level: "junior",
        explanation: `**INNER JOIN** — Only rows that match in BOTH tables. If an employee has no department, they're excluded.\n\n**LEFT JOIN** — All from left table + matching from right (NULL if no match). The most common JOIN in production.\n\n**RIGHT JOIN** — Keep all from the right. Rarely used — just swap tables and use LEFT JOIN.\n\n**FULL OUTER JOIN** — All from both. NULLs on both sides where no match. Great for data reconciliation.\n\n**CROSS JOIN** — Every row × every row (cartesian product). Useful for generating combinations but dangerous on large tables.\n\n**SELF JOIN** — Table joined to itself. Classic: employees and their managers.`,
        production: `🏭 **Finding users who NEVER ordered:**\nLEFT JOIN users to orders, then WHERE order.id IS NULL. Much faster than NOT IN with a subquery.\n\n🏭 **Order report with 4 tables:**\nOrders → order_items → products → customers. Use LEFT JOIN from orders so even deleted products still show.`,
        code: `-- ALL customers, even those without orders
SELECT c.name, c.email, o.id AS order_id, o.total
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id;

-- Customers who NEVER ordered
SELECT c.name, c.email
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
WHERE o.id IS NULL;

-- Full order details (multiple JOINs)
SELECT o.id, c.name AS customer, p.name AS product,
       oi.quantity, oi.unit_price,
       oi.quantity * oi.unit_price AS line_total
FROM orders o
JOIN customers c ON o.customer_id = c.id
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
WHERE o.created_at >= '2024-01-01'
ORDER BY o.created_at DESC;

-- SELF JOIN: Employee and their manager
SELECT e.name AS employee, e.title,
       m.name AS manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id;`,
      },
      {
        id: "aggregation",
        title: "GROUP BY, HAVING & Aggregation",
        level: "junior",
        explanation: `Aggregation collapses rows into summaries. GROUP BY defines groups; aggregate functions compute over each group.\n\n**Critical rule:** Every SELECT column must be in GROUP BY or wrapped in an aggregate. PostgreSQL enforces this. MySQL's non-strict mode picks random values — a dangerous gotcha!\n\n**WHERE vs HAVING:**\n→ WHERE filters rows BEFORE grouping\n→ HAVING filters groups AFTER aggregation\nThey solve different problems.`,
        production: `🏭 **Monthly revenue dashboard:**\nCEO wants revenue, order count, and average order value per month. GROUP BY month, SUM/COUNT/AVG. HAVING to show only months above a threshold.`,
        code: `-- Revenue report by department and month
SELECT
    d.name AS department,
    DATE_TRUNC('month', o.created_at) AS month,
    COUNT(o.id) AS total_orders,
    SUM(o.total) AS revenue,
    ROUND(AVG(o.total), 2) AS avg_order_value,
    COUNT(DISTINCT o.customer_id) AS unique_customers
FROM orders o
JOIN departments d ON o.dept_id = d.id
WHERE o.status = 'completed'
  AND o.created_at >= '2024-01-01'
GROUP BY d.name, DATE_TRUNC('month', o.created_at)
HAVING SUM(o.total) > 10000
ORDER BY month DESC, revenue DESC;`,
      },
      {
        id: "ctes-recursive",
        title: "CTEs, Subqueries & Recursive Queries",
        level: "mid",
        explanation: `**CTEs (WITH clause)** are named subqueries that make complex queries readable. Think of them as temporary named result sets.\n\n**Subquery types:**\n→ Scalar — returns one value\n→ Row/Table — returns a set (use with IN, EXISTS)\n→ Correlated — references outer query (runs per row — can be slow!)\n\n**Recursive CTEs** traverse hierarchies (org charts, category trees) that are impossible with regular SQL.\n\n**Tip:** EXISTS is usually faster than IN for large datasets (stops at first match). NOT IN has a NULL trap — always use NOT EXISTS.`,
        production: `🏭 **Org chart traversal:** Find everyone who reports to a specific VP (directly or indirectly). Impossible without recursive SQL unless you denormalize.\n\n🏭 **Cohort analysis:** "Of users who signed up in January, what % purchased within 30/60/90 days?" Chain 3-4 CTEs together.`,
        code: `-- CTE: Month-over-month revenue growth
WITH monthly_revenue AS (
    SELECT DATE_TRUNC('month', created_at) AS month,
           SUM(total) AS revenue
    FROM orders WHERE status = 'completed'
    GROUP BY 1
),
with_growth AS (
    SELECT month, revenue,
           LAG(revenue) OVER (ORDER BY month) AS prev_month,
           ROUND((revenue - LAG(revenue) OVER (ORDER BY month))
               / NULLIF(LAG(revenue) OVER (ORDER BY month), 0) * 100, 1) AS growth_pct
    FROM monthly_revenue
)
SELECT * FROM with_growth ORDER BY month DESC;

-- Recursive CTE: Org chart
WITH RECURSIVE team AS (
    SELECT id, name, title, manager_id, 1 AS depth
    FROM employees WHERE id = 42  -- starting person
    UNION ALL
    SELECT e.id, e.name, e.title, e.manager_id, t.depth + 1
    FROM employees e JOIN team t ON e.manager_id = t.id
    WHERE t.depth < 10  -- safety limit
)
SELECT depth, repeat('  ', depth-1) || name AS tree, title FROM team;`,
      },
      {
        id: "window-functions",
        title: "Window Functions — Senior SQL Superpower",
        level: "senior",
        explanation: `Window functions compute across a set of related rows WITHOUT collapsing them like GROUP BY. The #1 topic separating mid from senior SQL skills.\n\n**OVER clause** defines the "window":\n→ PARTITION BY — divide into groups (keeps all rows)\n→ ORDER BY — order within each partition\n→ Frame (ROWS BETWEEN) — which rows to include\n\n**Key functions:**\n→ ROW_NUMBER() — unique sequential (1,2,3,4)\n→ RANK() — ties get same rank, gaps after (1,2,2,4)\n→ DENSE_RANK() — ties, no gaps (1,2,2,3)\n→ LAG/LEAD — previous/next row value\n→ SUM/AVG as window — running totals, moving averages\n→ NTILE(n) — divide into n equal buckets`,
        production: `🏭 **Spotify Wrapped:** "You were in the top 3% of listeners." That's NTILE(100) partitioned by artist.\n\n🏭 **SaaS analytics:** "Each customer's MRR, rank in their plan tier, month-over-month growth." RANK() + LAG() in one query.\n\n🏭 **Fraud detection:** "Flag transactions >3x the customer's average." Window AVG() OVER (PARTITION BY customer_id).`,
        code: `-- Rank, running total, and comparison in one query
SELECT name, department, salary,
    DENSE_RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS dept_rank,
    SUM(salary) OVER (PARTITION BY department ORDER BY salary DESC
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total,
    ROUND(salary * 100.0 / SUM(salary) OVER (PARTITION BY department), 1)
        AS pct_of_dept
FROM employees ORDER BY department, salary DESC;

-- Top 3 products by revenue per category
SELECT * FROM (
    SELECT p.name, c.name AS category,
        SUM(oi.quantity * oi.price) AS revenue,
        ROW_NUMBER() OVER (
            PARTITION BY c.id ORDER BY SUM(oi.quantity * oi.price) DESC
        ) AS rank_in_cat
    FROM products p
    JOIN categories c ON p.category_id = c.id
    JOIN order_items oi ON oi.product_id = p.id
    GROUP BY p.id, p.name, c.id, c.name
) ranked WHERE rank_in_cat <= 3;

-- 7-day rolling average of daily signups
SELECT signup_date, daily_count,
    ROUND(AVG(daily_count) OVER (
        ORDER BY signup_date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ), 1) AS rolling_7day_avg
FROM daily_signups;`,
      },
    ],
  },
  {
    id: "indexing",
    icon: "📑",
    title: "Indexing — Making Queries Fast",
    subtitle: "The single biggest performance lever you have",
    topics: [
      {
        id: "how-indexes-work",
        title: "How Indexes Actually Work",
        level: "junior",
        explanation: `An index is like the index at the back of a textbook. Without it, finding "photosynthesis" means reading every page (full table scan). With it, you jump to page 247 directly.\n\n**B-Tree** (default) — balanced tree, O(log n) lookups. 1 billion rows = ~30 comparisons.\n\n**The trade-off:** Every index speeds reads but slows writes. Each INSERT/UPDATE/DELETE also updates every index.\n\n**Composite index rule (critical!):** Index on (A, B, C) helps queries on A, A+B, or A+B+C — but NOT B alone or C alone. This is the "leftmost prefix" rule.\n\n**Index types:**\n→ B-Tree (default) — equality, range, sorting\n→ Hash — equality only\n→ GIN — full-text search, JSONB, arrays\n→ GiST — geometric, proximity\n→ BRIN — very large naturally sorted tables`,
        production: `🏭 **Startup's DB melted:**\n"SELECT * FROM events WHERE user_id = ? AND created_at > ?" took 8 seconds with 50M rows. Adding composite index on (user_id, created_at) → 2ms.\n\n🏭 **Too many indexes hurt:**\nPayment table had 12 indexes. Every INSERT updated all 12. Write latency 5ms → 200ms. Dropped 7 unused indexes → 4x faster writes.`,
        code: `-- Find unused indexes (safe to drop)
SELECT indexrelname, idx_scan, pg_size_pretty(pg_relation_size(indexrelid))
FROM pg_stat_user_indexes
WHERE idx_scan = 0 AND indexrelname NOT LIKE '%pkey%'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Composite index (ORDER MATTERS!)
CREATE INDEX idx_user_events ON events(user_id, created_at DESC);
-- ✅ WHERE user_id = 5
-- ✅ WHERE user_id = 5 AND created_at > '2024-01-01'
-- ❌ WHERE created_at > '2024-01-01' (no leftmost column)

-- Partial index: only index rows you query
CREATE INDEX idx_pending ON orders(created_at) WHERE status = 'pending';

-- Covering index: avoids table lookup entirely
CREATE INDEX idx_cover ON users(email) INCLUDE (name, plan);

-- Expression index
CREATE INDEX idx_lower_email ON users(LOWER(email));`,
      },
      {
        id: "explain",
        title: "EXPLAIN ANALYZE — X-Ray Vision",
        level: "mid",
        explanation: `EXPLAIN ANALYZE shows exactly how the DB executes your query and how long each step takes.\n\n**Look for:**\n→ Seq Scan on large table = needs an index\n→ Index Scan = good\n→ Rows estimated vs actual = if wildly different, run ANALYZE\n→ Nested Loop on large result = probably bad\n→ Sort with high cost = needs matching index\n\n**Golden rule:** If PostgreSQL estimates 10 rows but gets 100K, it chose a terrible plan. Run ANALYZE to update statistics.`,
        production: `🏭 **Slow dashboard debugging:**\nEXPLAIN revealed nested loop join over 4.2M row combos. Fix: composite index turned it into hash join on 2,000 rows. 12s → 30ms.`,
        code: `EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT c.name, COUNT(o.id), SUM(o.total)
FROM customers c
JOIN orders o ON c.id = o.customer_id
WHERE o.created_at >= '2024-01-01'
GROUP BY c.id, c.name
ORDER BY SUM(o.total) DESC LIMIT 10;

-- Fix stale statistics
ANALYZE orders;
ANALYZE customers;

-- Find slowest queries
SELECT query, calls, mean_exec_time, total_exec_time
FROM pg_stat_statements
ORDER BY total_exec_time DESC LIMIT 10;`,
      },
      {
        id: "btree-internals",
        title: "B-Tree Internals — How Indexes Really Work",
        level: "senior",
        explanation: `A B-Tree is a balanced tree where every path from root to leaf has the same length. Each node is a "page" (typically 8KB in PostgreSQL).\n\n**Structure:**\n→ Root page → branch pages → leaf pages → actual data pointers\n→ Leaf pages are linked (doubly-linked list) for efficient range scans\n→ Each node holds sorted keys and pointers to children\n\n**Why it matters for interviews:**\n→ INSERT in the middle causes page splits → fragmentation → index bloat\n→ Random UUIDs cause maximum page splits (every insert is random position)\n→ Sequential IDs cause minimal splits (always appends to the rightmost leaf)\n→ This is why UUIDv7 (time-sorted) is better than UUIDv4 (random)\n\n**Key metrics to know:**\n→ 1 billion rows with B-Tree = ~4 levels deep = ~4 page reads to find any row\n→ Each page holds ~200-500 keys depending on key size\n→ The root page is almost always cached in memory`,
        production: `🏭 **Index bloat at a SaaS company:**\nAfter months of heavy UPDATE/DELETE operations, their indexes were 3x larger than the actual data. Queries slowed down because the B-Tree had tons of dead space. Fix: REINDEX or pg_repack to rebuild without locking.\n\n🏭 **Why UUID indexes are 2-3x larger than BIGINT:**\nUUID = 16 bytes per key. BIGINT = 8 bytes. In a B-Tree, fewer keys fit per page → more levels → more I/O. On a 100M row table, the UUID index was 4.2GB vs 1.5GB for BIGINT.`,
        code: `-- Check index size vs table size (find bloated indexes)
SELECT
    relname AS table_name,
    pg_size_pretty(pg_table_size(relid)) AS table_size,
    indexrelname AS index_name,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
    idx_scan AS times_used
FROM pg_stat_user_indexes
JOIN pg_class ON pg_class.oid = indexrelid
ORDER BY pg_relation_size(indexrelid) DESC;

-- Check index bloat estimate (PostgreSQL)
-- pgstattuple extension gives precise bloat info
CREATE EXTENSION IF NOT EXISTS pgstattuple;
SELECT * FROM pgstatindex('idx_users_email');

-- Rebuild a bloated index (locks table!)
REINDEX INDEX idx_users_email;

-- Rebuild without locking (use pg_repack or CONCURRENTLY)
REINDEX INDEX CONCURRENTLY idx_users_email;  -- PG 12+`,
      },
      {
        id: "all-index-types",
        title: "Every Index Type with Real Use Cases",
        level: "mid",
        explanation: `**B-Tree (default)** — The workhorse. Handles =, <, >, <=, >=, BETWEEN, IS NULL, LIKE 'prefix%'. Used for 95% of indexes.\n\n**Hash** — Only equality (=). Slightly faster than B-Tree for exact match. Rarely used because B-Tree does everything Hash does plus more. Useful in PostgreSQL 10+ (finally WAL-logged).\n\n**GIN (Generalized Inverted Index)** — For values that contain multiple elements: arrays, JSONB, full-text search (tsvector). The index maps each element → list of rows containing it. Like Elasticsearch's inverted index but inside PostgreSQL.\n\n**GiST (Generalized Search Tree)** — For geometric, range, and proximity queries. Used by PostGIS for geospatial ("find points within polygon"), range types ("find overlapping time ranges"), and nearest-neighbor search.\n\n**BRIN (Block Range Index)** — Stores min/max values per block of table pages. Tiny index size, great for naturally-ordered data (timestamps in append-only tables). Scans blocks, not individual rows.\n\n**SP-GiST** — For partitioned search trees. Used for IP addresses (inet type), phone numbers, and quadtree spatial data.`,
        production: `🏭 **GIN for JSONB (replacing MongoDB):**\nA product attributes JSONB column with a GIN index lets you query any nested field efficiently: WHERE attributes @> '{"color":"red"}'. Without GIN, PostgreSQL does a full table scan of every JSON document.\n\n🏭 **BRIN for time-series logs:**\nA 500GB events table with created_at in natural order. A B-Tree index on created_at would be 11GB. A BRIN index? Just 120KB. Because events arrive in chronological order, BRIN's block-range summaries work perfectly.\n\n🏭 **GiST for Uber-style geospatial:**\nPostGIS uses GiST indexes for "find all drivers within 2km of this location" queries. Without GiST, it would check every single driver in the table.`,
        code: `-- GIN: Index JSONB for flexible queries
CREATE INDEX idx_attrs_gin ON products USING GIN (attributes);
-- Now these are fast:
SELECT * FROM products WHERE attributes @> '{"color": "red"}';
SELECT * FROM products WHERE attributes ? 'wireless';

-- GIN: Full-text search
CREATE INDEX idx_search ON articles USING GIN (
    to_tsvector('english', title || ' ' || body)
);
SELECT * FROM articles
WHERE to_tsvector('english', title || ' ' || body) @@ to_tsquery('database & performance');

-- GIN: Array containment
CREATE INDEX idx_tags ON posts USING GIN (tags);
SELECT * FROM posts WHERE tags @> ARRAY['postgresql', 'indexing'];

-- GiST: Geospatial (PostGIS)
CREATE INDEX idx_location ON restaurants USING GIST (location);
SELECT name FROM restaurants
WHERE ST_DWithin(location, ST_MakePoint(-73.99, 40.73)::geography, 1000);

-- GiST: Range overlap (booking conflicts)
CREATE INDEX idx_booking_range ON bookings USING GIST (
    tstzrange(check_in, check_out)
);
SELECT * FROM bookings
WHERE tstzrange(check_in, check_out) && tstzrange('2024-06-01', '2024-06-05');

-- BRIN: Tiny index for naturally ordered data
CREATE INDEX idx_events_brin ON events USING BRIN (created_at)
    WITH (pages_per_range = 32);
-- Index size: ~1000x smaller than B-Tree for time-ordered data`,
      },
      {
        id: "index-strategies",
        title: "Index Strategy & Maintenance",
        level: "senior",
        explanation: `**Selectivity** — How unique the values are. High selectivity (email, user_id) = good for indexing. Low selectivity (boolean, status with 3 values) = usually bad because the optimizer prefers a full scan over reading 40% of the index.\n\n**Partial indexes** — Only index rows matching a condition. If 95% of orders are 'completed' but you only query 'pending', index only 'pending'. Dramatically smaller and faster.\n\n**Covering indexes (INCLUDE)** — Add extra columns to the index so the query never needs to read the actual table (index-only scan). Huge speedup for specific query patterns.\n\n**Multi-column index strategy:**\n→ Put equality columns first, range columns last\n→ WHERE user_id = ? AND created_at > ? → index(user_id, created_at) ✅\n→ WHERE created_at > ? AND user_id = ? → same index works (optimizer reorders)\n→ WHERE user_id = ? ORDER BY created_at DESC → index(user_id, created_at DESC) ✅\n\n**Index maintenance:**\n→ VACUUM cleans dead tuples but doesn't shrink indexes\n→ REINDEX rebuilds (locks table — use CONCURRENTLY in production)\n→ pg_repack rebuilds tables and indexes without locking\n→ Monitor with pg_stat_user_indexes (unused indexes waste writes)`,
        production: `🏭 **Partial index saving 90% disk:**\nAn orders table with 100M rows. Only 500K are 'pending'. A full index on status wastes space. CREATE INDEX idx_pending ON orders(created_at) WHERE status = 'pending' — tiny index, instant queries for the active workflow.\n\n🏭 **Covering index eliminating table reads:**\nA dashboard query: SELECT name, plan FROM users WHERE email = 'x'. With CREATE INDEX idx ON users(email) INCLUDE (name, plan), PostgreSQL reads ONLY the index — never touches the 50GB table. Response time: 0.05ms.`,
        code: `-- Check index usage statistics
SELECT
    schemaname, relname AS table,
    indexrelname AS index,
    idx_scan AS scans,
    idx_tup_read AS tuples_read,
    idx_tup_fetch AS tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;  -- least-used first (candidates to drop)

-- Multi-column index: optimal column order
-- Query: WHERE tenant_id = ? AND status = ? AND created_at > ?
-- Best index: (tenant_id, status, created_at)
-- Equality columns first, range column last!
CREATE INDEX idx_orders_lookup
ON orders(tenant_id, status, created_at DESC);

-- Partial index: only index what you query
CREATE INDEX idx_unprocessed ON payments(created_at)
WHERE processed = false;  -- only ~1% of rows

-- Covering index: avoid table lookups entirely
CREATE INDEX idx_user_lookup ON users(email)
INCLUDE (id, name, plan, status);
-- SELECT id, name, plan FROM users WHERE email = ? → index-only scan

-- Index-only scan check in EXPLAIN
-- Look for "Index Only Scan" (good) vs "Index Scan" (still touches table)
EXPLAIN ANALYZE SELECT id, name FROM users WHERE email = 'alice@co.com';`,
      },
    ],
  },
  {
    id: "nosql-guide",
    icon: "🗄️",
    title: "NoSQL Databases — When & Why",
    subtitle: "Each type with real production examples",
    topics: [
      {
        id: "document-stores",
        title: "Document Stores (MongoDB, Firestore)",
        level: "junior",
        explanation: `Store data as JSON-like documents in collections. Each document can have different structure.\n\n**Why it matters:** User profiles — User A has 2 addresses, User B has 5. In SQL, you need separate tables. In MongoDB, each document stores what it has.\n\n✅ Schema changes frequently (startups, MVPs)\n✅ Data is nested/hierarchical (catalogs, CMS)\n✅ Read patterns are document-centric ("get everything about this user")\n❌ Heavy relationships / many-to-many\n❌ Complex reporting with joins\n❌ Need strong multi-document transactions`,
        production: `🏭 **Content Management System (like Contentful):**\nBlog posts have "author" and "tags." Product pages have "price" and "specs." MongoDB lets each document have its own shape without ALTER TABLE.\n\n🏭 **Real-time gaming profiles:**\nInventory (variable items), achievements (growing list), settings (platform-specific). Accessed by player_id — no joins needed.`,
        code: `// MongoDB aggregation (their version of SQL joins + grouping)
db.orders.aggregate([
  { $match: { createdAt: { $gte: ISODate("2024-01-01") } } },
  { $lookup: {
      from: "customers", localField: "customerId",
      foreignField: "_id", as: "customer"
  }},
  { $group: {
      _id: "$customerId",
      totalSpent: { $sum: "$total" },
      orderCount: { $sum: 1 }
  }},
  { $sort: { totalSpent: -1 } },
  { $limit: 10 }
])`,
      },
      {
        id: "key-value",
        title: "Key-Value Stores (Redis, DynamoDB)",
        level: "junior",
        explanation: `Simplest and fastest: give a key, get a value. Sub-millisecond latency.\n\n**Redis** — In-memory data structure server. Lists, sets, sorted sets, hashes, streams, pub/sub. NOT just a cache.\n\n**DynamoDB** — AWS managed, infinite scale, consistent single-digit ms latency.\n\n✅ Caching, sessions, leaderboards, rate limiting\n✅ Feature flags, shopping carts, message queues\n❌ Complex queries, relationships, searching by value`,
        production: `🏭 **Twitter timelines (Redis sorted sets):**\nEach user's timeline = sorted set (score = timestamp). New tweet? ZADD to each follower. Load timeline? ZREVRANGE top 50. Millions of loads/second.\n\n🏭 **Rate limiting:**\n"100 API calls per user per minute." INCR key, EXPIRE 60s. If count > 100, reject.\n\n🏭 **DynamoDB at Lyft:**\nEvery ride request and driver location → DynamoDB. Millions of writes/sec, consistent <10ms, simple get/put by ride_id.`,
        code: `// Redis patterns (conceptual)
SET product:123 '{"name":"Widget","price":29.99}' EX 3600
GET product:123

// Rate limiting
INCR   api:user:456:requests
EXPIRE api:user:456:requests 60

// Leaderboard (sorted set)
ZADD leaderboard 1500 "player:alice"
ZADD leaderboard 2200 "player:bob"
ZREVRANGE leaderboard 0 9 WITHSCORES  // top 10

// Session management
HSET session:abc userId 42 role "admin"
EXPIRE session:abc 1800  // 30 min timeout`,
      },
      {
        id: "wide-column",
        title: "Wide-Column (Cassandra, ScyllaDB)",
        level: "mid",
        explanation: `Designed for massive write throughput at planetary scale. 1M+ writes/second.\n\n**Critical rule:** Model data around QUERIES, not entities. In SQL, normalize and join at query time. In Cassandra, denormalize — write duplicate data to serve each query directly.\n\n✅ Time-series data (IoT, metrics, logs)\n✅ Write-heavy (100K+ writes/sec)\n✅ Multi-datacenter (built-in replication)\n❌ Ad-hoc queries or analytics\n❌ Small datasets (< 1TB) — overkill`,
        production: `🏭 **Netflix — 16 trillion rows:**\nEvery play, pause, seek event from 200M+ users. Petabytes per day. Never goes down — even when an AWS region fails.\n\n🏭 **IoT platform:**\n10,000 sensors every second. Partition key = sensor_id, clustering = timestamp. "Sensor X last 24hrs" = single partition read.`,
        code: null,
      },
      {
        id: "graph-dbs",
        title: "Graph Databases (Neo4j, Neptune)",
        level: "mid",
        explanation: `Nodes (entities) + Edges (relationships) + Properties. Relationship traversal is O(1) regardless of dataset size.\n\n**The "friend-of-friend" problem:** In SQL, 6 degrees of separation = 6 nested joins on a billion rows — it'll never finish. In Neo4j? Milliseconds.\n\n✅ Social networks, recommendations, fraud detection\n✅ Knowledge graphs, access control\n❌ Simple CRUD, bulk analytics`,
        production: `🏭 **Panama Papers:** Journalists traced hidden company ownership across 200K+ entities. Graph traversal revealed paths SQL couldn't handle.\n\n🏭 **LinkedIn's "People You May Know":** Graph query — 2-3 connections away, shared companies/schools, ranked by strength. Real-time for 900M+ users.`,
        code: `// Neo4j Cypher
// Friends of friends recommendation
MATCH (me:Person {name: "Alice"})-[:KNOWS*2..3]-(suggested)
WHERE suggested <> me AND NOT (me)-[:KNOWS]-(suggested)
RETURN suggested.name, COUNT(*) AS mutuals
ORDER BY mutuals DESC LIMIT 10;

// Fraud: find circular money flows
MATCH path = (a:Account)-[:TRANSFERRED*3..6]->(a)
WHERE ALL(t IN relationships(path) WHERE t.amount > 10000)
RETURN path;`,
      },
      {
        id: "clickhouse-olap",
        title: "ClickHouse & Column-Store Analytics",
        level: "mid",
        explanation: `**ClickHouse** is a column-oriented OLAP database built for blazing-fast analytical queries over billions of rows. While PostgreSQL might take minutes for a complex aggregation on 1B rows, ClickHouse does it in seconds.\n\n**Why column-oriented matters:**\nRow-stores (PostgreSQL, MySQL) read entire rows from disk — great for "get me user #123" but wasteful for "what's the average order value this month?" because you only need one column but read all of them.\n\nColumn-stores (ClickHouse, BigQuery) store each column separately. Aggregating one column over 1B rows? It reads only that column, skips everything else, and compresses beautifully (same data type = great compression).\n\n✅ Real-time analytics dashboards with billions of rows\n✅ Log and event analytics (alternative to Elasticsearch for structured logs)\n✅ Ad-tech: click tracking, impression counting, attribution\n✅ Product analytics (like Amplitude, Mixpanel internals)\n✅ Time-series aggregation at massive scale\n❌ Point lookups by primary key (use PostgreSQL)\n❌ Frequent UPDATEs or DELETEs (append-optimized)\n❌ Transactions (no ACID)\n❌ Small datasets where PostgreSQL is fast enough`,
        production: `🏭 **Cloudflare — ClickHouse at planet scale:**\nCloudflare uses ClickHouse to analyze HTTP traffic analytics — billions of requests per day. Their dashboard lets customers query "show me all 404 errors from mobile devices in Germany last week" and get results in <1 second over petabytes of data.\n\n🏭 **GitLab — replaced PostgreSQL for analytics:**\nGitLab moved their analytics workload from PostgreSQL to ClickHouse. Queries that took 30+ seconds on PostgreSQL ran in under 100ms on ClickHouse. They kept PostgreSQL for transactional data.\n\n🏭 **Uber's logging platform:**\nUber processes ~100TB of log data per day. They use ClickHouse for log analytics — engineers search through billions of log lines interactively. Previously this required expensive Elasticsearch clusters.`,
        code: `-- ClickHouse: Create a table with MergeTree engine
CREATE TABLE events (
    event_date Date,
    event_time DateTime,
    user_id UInt64,
    event_type LowCardinality(String),  -- optimization for repeated values
    page_url String,
    country LowCardinality(String),
    duration_ms UInt32
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_date)       -- partition by month
ORDER BY (event_type, user_id, event_time); -- sort key = query pattern

-- Aggregate 1 billion rows in seconds
SELECT
    event_type,
    count() AS total,
    uniq(user_id) AS unique_users,       -- HyperLogLog approximation
    avg(duration_ms) AS avg_duration,
    quantile(0.95)(duration_ms) AS p95
FROM events
WHERE event_date >= '2024-01-01'
  AND country = 'US'
GROUP BY event_type
ORDER BY total DESC;

-- Materialized views for real-time aggregation
CREATE MATERIALIZED VIEW events_daily_mv
ENGINE = SummingMergeTree()
ORDER BY (event_date, event_type, country)
AS SELECT
    event_date, event_type, country,
    count() AS events,
    uniq(user_id) AS users
FROM events GROUP BY event_date, event_type, country;`,
      },
      {
        id: "elasticsearch",
        title: "Elasticsearch & OpenSearch — Full-Text Search",
        level: "mid",
        explanation: `Elasticsearch is a distributed search and analytics engine built on Apache Lucene. It's NOT a general-purpose database — it's a search engine that happens to store data.\n\n**What makes it special:**\n→ **Inverted index** — instead of "document → words," it stores "word → documents." Finding all products mentioning "wireless bluetooth" across 50M products takes milliseconds.\n→ **Relevance scoring** — results ranked by how well they match, not just if they match\n→ **Fuzzy matching** — handles typos ("iPhne" → "iPhone")\n→ **Faceted search** — "Show me laptops, and on the side show counts by brand, price range, rating"\n→ **Aggregations** — powerful analytics on text and structured data\n\n✅ Product search with filters and autocomplete\n✅ Log aggregation and analysis (ELK stack)\n✅ Geospatial search ("hotels near me")\n✅ Full-text search across documents\n❌ Primary data store (no ACID, data can lag behind source)\n❌ Frequent updates (reindexing is expensive)\n❌ Strong consistency requirements`,
        production: `🏭 **Every e-commerce search bar:**\nWhen you type "red running shoes size 10" on Amazon/Shopify, that query hits Elasticsearch. It tokenizes your query, matches against product names/descriptions/attributes, applies filters (size=10, color=red), scores by relevance, and returns results with faceted counts ("Nike (42), Adidas (38)") — all in <50ms.\n\n🏭 **GitHub code search:**\nGitHub indexes billions of lines of code with Elasticsearch. When you search for a function name, it searches across millions of repositories in real-time. They recently rebuilt this with a custom Rust-based engine, but Elasticsearch powered it for years.\n\n🏭 **Datadog / observability platforms:**\nCollect logs from thousands of servers, index them in Elasticsearch, let engineers search "show me all ERROR logs from service X in the last hour." The ELK stack (Elasticsearch + Logstash + Kibana) is the industry standard for log management.`,
        code: `// Elasticsearch: Search with filters, fuzzy matching, and aggregations
POST /products/_search
{
  "query": {
    "bool": {
      "must": [
        { "multi_match": {
            "query": "wireless bluetooth headphones",
            "fields": ["name^3", "description", "brand"],
            "fuzziness": "AUTO"
        }}
      ],
      "filter": [
        { "range": { "price": { "gte": 50, "lte": 200 } } },
        { "term": { "in_stock": true } }
      ]
    }
  },
  "aggs": {
    "by_brand": { "terms": { "field": "brand.keyword", "size": 10 } },
    "price_ranges": {
      "range": {
        "field": "price",
        "ranges": [
          { "to": 50 }, { "from": 50, "to": 100 },
          { "from": 100, "to": 200 }, { "from": 200 }
        ]
      }
    },
    "avg_rating": { "avg": { "field": "rating" } }
  },
  "highlight": { "fields": { "name": {}, "description": {} } },
  "size": 20
}`,
      },
      {
        id: "newsql",
        title: "NewSQL — CockroachDB, TiDB, Spanner",
        level: "senior",
        explanation: `NewSQL databases try to give you the best of both worlds: the SQL interface and ACID guarantees of PostgreSQL, with the horizontal scalability of NoSQL.\n\n**CockroachDB** — PostgreSQL-compatible, survives node/region failures automatically. Named after cockroaches because it's hard to kill.\n\n**TiDB** — MySQL-compatible, open-source, built by PingCAP. Separates storage and compute for independent scaling.\n\n**Google Spanner** — The original. Global consistency with TrueTime (atomic clocks in every datacenter). Only available as a GCP service.\n\n**YugabyteDB** — PostgreSQL-compatible, open-source alternative to Spanner.\n\n**When to choose:**\n✅ You need SQL + ACID but PostgreSQL can't scale enough\n✅ Multi-region deployment with strong consistency\n✅ You want horizontal write scaling without giving up transactions\n\n**When NOT to:**\n❌ You don't actually need horizontal scaling (most companies don't)\n❌ Latency-sensitive single-region apps (regular PostgreSQL is faster)\n❌ Your team can't handle the operational complexity`,
        production: `🏭 **DoorDash moved to CockroachDB:**\nThey outgrew their Aurora PostgreSQL setup. Order volume required horizontal write scaling across regions but they couldn't give up ACID (double-charging for food delivery = very bad). CockroachDB gave them multi-region SQL.\n\n🏭 **Google Spanner powers Google Ads:**\nThe ad-serving system needs globally consistent data — an ad budget spent in the US must be instantly reflected for European requests. Spanner's TrueTime protocol ensures global consistency with minimal latency.`,
        code: `-- CockroachDB: Standard PostgreSQL syntax + multi-region
CREATE TABLE orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    region crdb_internal_region NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
) LOCALITY REGIONAL BY ROW;  -- data pinned to nearest region

-- Same SQL you already know
SELECT customer_id, SUM(total) AS lifetime_value
FROM orders WHERE created_at >= '2024-01-01'
GROUP BY customer_id ORDER BY lifetime_value DESC LIMIT 10;

-- Survive region failures automatically
ALTER DATABASE commerce SURVIVE REGION FAILURE;`,
      },
      {
        id: "cloud-warehouses",
        title: "Cloud Warehouses — Snowflake, BigQuery, Redshift",
        level: "senior",
        explanation: `Cloud data warehouses are managed OLAP databases designed for analytics at scale. They separate storage from compute, so you can store petabytes cheaply and spin up compute only when querying.\n\n**Snowflake** — Multi-cloud (AWS, Azure, GCP). Unique "virtual warehouse" model — multiple teams can query the same data independently without contention.\n\n**BigQuery** — Google's serverless warehouse. No infrastructure to manage. Pay per query scanned. Great for ad-hoc analysis.\n\n**Redshift** — AWS's warehouse. Tight integration with AWS ecosystem. Based on PostgreSQL (modified).\n\n**When to choose these over ClickHouse:**\n→ Your team wants zero infrastructure management\n→ You need to separate storage and compute costs\n→ Multiple teams need independent query workloads\n→ You're already deep in a cloud ecosystem\n\n**ClickHouse vs Cloud Warehouses:**\n→ ClickHouse: self-hosted (or ClickHouse Cloud), real-time inserts, sub-second queries, lower cost at scale\n→ Snowflake/BQ: fully managed, better for batch/scheduled analytics, easier for data teams, higher cost`,
        production: `🏭 **Spotify uses BigQuery for analytics:**\nAll listening events, user interactions, and content metadata flow into BigQuery. Data analysts and ML engineers query petabytes of data for recommendations, Wrapped stats, and A/B test analysis — all serverless.\n\n🏭 **Many companies use a two-tier approach:**\nClickHouse for real-time operational analytics (dashboards that refresh every 10 seconds) + Snowflake for deep historical analysis (data science, quarterly reports). Different tools for different latency requirements.`,
        code: `-- Snowflake: Virtual warehouses for independent compute
CREATE WAREHOUSE analytics_wh
    WITH WAREHOUSE_SIZE = 'MEDIUM'
    AUTO_SUSPEND = 300        -- suspend after 5 min idle
    AUTO_RESUME = TRUE;

-- Query petabytes with standard SQL
SELECT DATE_TRUNC('month', event_time) AS month,
       product_category,
       COUNT(DISTINCT user_id) AS unique_users,
       SUM(revenue) AS total_revenue
FROM events.page_views
WHERE event_time >= DATEADD('year', -1, CURRENT_DATE())
GROUP BY 1, 2
ORDER BY total_revenue DESC;

-- BigQuery: Serverless, pay-per-query
-- No infrastructure setup needed
SELECT FORMAT_DATE('%Y-%m', event_date) AS month,
       country, COUNT(*) AS events,
       APPROX_COUNT_DISTINCT(user_id) AS users
FROM \`project.dataset.events\`
WHERE event_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 1 YEAR)
GROUP BY 1, 2 ORDER BY events DESC;`,
      },
    ],
  },
  {
    id: "db-selector",
    icon: "🧭",
    title: "Database Selection Guide",
    subtitle: "Stop overthinking — use this framework",
    topics: [
      {
        id: "5-questions",
        title: "The 5-Question Decision Framework",
        level: "junior",
        explanation: `Ask these 5 questions in order:\n\n**Q1: Do I need complex relationships and joins?**\n→ Yes → Start with PostgreSQL.\n\n**Q2: What's my main access pattern?**\n→ "Get by ID" → Redis / DynamoDB\n→ "Search text" → Elasticsearch\n→ "Traverse relationships" → Neo4j\n→ "Flexible documents" → MongoDB\n→ "Write time-series" → Cassandra / TimescaleDB\n→ "Analytics over billions of rows" → ClickHouse / Snowflake\n→ "SQL + horizontal scale" → CockroachDB / TiDB\n\n**Q3: How much data / writes per second?**\n→ Under 1TB, under 10K writes/sec → PostgreSQL is fine\n→ Over 1TB or 100K+ writes/sec → specialized database\n\n**Q4: How critical is consistency?**\n→ Money, inventory, medical → SQL (ACID)\n→ Likes, views, recommendations → NoSQL is fine\n\n**Q5: What can your team operate?**\n→ A DB nobody knows = a DB that fails at 3 AM\n\n**Golden rule: Start with PostgreSQL.** Add specialized DBs only for PROVEN bottlenecks.`,
        production: `🏭 **Fintech startup's real journey:**\nDay 1: Everything in PostgreSQL.\nMonth 6: Added Redis for session caching.\nYear 1: Added Elasticsearch for transaction search.\nYear 2: Added TimescaleDB extension for analytics.\nThey NEVER needed MongoDB or Cassandra. PostgreSQL + Redis + Elasticsearch covers 95% of startups.`,
        code: null,
      },
      {
        id: "postgres-everything",
        title: "PostgreSQL — The Swiss Army Knife",
        level: "junior",
        explanation: `PostgreSQL isn't just a relational DB anymore:\n\n→ **JSONB** → Replaces MongoDB for 90% of use cases\n→ **PostGIS** → Geospatial. "Restaurants within 5km." Uber-grade.\n→ **TimescaleDB** → Time-series on PostgreSQL\n→ **pg_trgm** → Fuzzy search, "did you mean...?"\n→ **Full-text search** → Built-in with ranking & stemming\n→ **Apache AGE** → Graph queries inside PostgreSQL\n→ **Citus** → Horizontal sharding for PostgreSQL\n→ **pgvector** → Vector similarity for AI/ML embeddings\n\nYou can delay multi-database complexity by years.`,
        production: `🏭 **JSONB replacing MongoDB:**\nProduct catalog with 200 categories, each with different attributes. Shirts have "size" and "color," laptops have "RAM" and "CPU." Store attributes as JSONB — flexible schema WITH relational safety.`,
        code: `-- PostgreSQL as document store (JSONB)
CREATE TABLE products (
    id SERIAL PRIMARY KEY, name TEXT NOT NULL,
    category TEXT NOT NULL,
    attributes JSONB NOT NULL DEFAULT '{}'
);

SELECT name, attributes->>'color' AS color FROM products
WHERE attributes->>'waterproof' = 'true';

CREATE INDEX idx_attrs ON products USING GIN (attributes);

-- PostgreSQL as geospatial DB (PostGIS)
SELECT name, ST_Distance(location, ST_MakePoint(-73.99,40.73)::geography)
FROM restaurants
WHERE ST_DWithin(location, ST_MakePoint(-73.99,40.73)::geography, 5000)
ORDER BY 2;

-- PostgreSQL as time-series (TimescaleDB)
SELECT time_bucket('1 hour', ts) AS hour, sensor_id,
       AVG(temperature), MAX(temperature)
FROM readings WHERE ts > NOW() - INTERVAL '7 days'
GROUP BY hour, sensor_id ORDER BY hour DESC;`,
      },
    ],
  },
  {
    id: "performance",
    icon: "🚀",
    title: "Performance & Scaling",
    subtitle: "Making things fast and keeping them running",
    topics: [
      {
        id: "perf-playbook",
        title: "The Performance Debugging Playbook",
        level: "mid",
        explanation: `When a query is slow, follow this systematic approach:\n\n**Step 1: Identify** — Which query? pg_stat_statements, slow query log, or APM tools.\n**Step 2: Analyze** — EXPLAIN ANALYZE. Look for seq scans, bad estimates, expensive sorts.\n**Step 3: Quick fixes** — Add indexes, rewrite query, update statistics (ANALYZE).\n**Step 4: Caching** — Redis for hot paths. Cache invalidation strategy matters.\n**Step 5: Read replicas** — Route reads to replicas.\n**Step 6: Restructure** — Materialized views, denormalization, cursor pagination.\n**Step 7: Scale** — Connection pooling, partitioning, and ultimately sharding (last resort).`,
        production: `🏭 **How Slack fixed slow channel loading:**\nKeyset pagination (WHERE id > last_seen ORDER BY id DESC LIMIT 50) + index on (channel_id, id DESC). Loads in <10ms regardless of channel size.\n\n🏭 **N+1 disaster:** Page showing 50 orders fired 51 queries (1 for orders + 50 for customers). Fix: eager loading / JOIN. 3s → 80ms.`,
        code: `-- Cursor pagination (fast at ANY depth)
SELECT * FROM messages
WHERE channel_id = 'C123' AND id < :last_seen_id
ORDER BY id DESC LIMIT 20;

-- Materialized view for dashboards
CREATE MATERIALIZED VIEW mv_daily_stats AS
SELECT DATE(created_at) AS day, COUNT(*) AS orders,
       SUM(total) AS revenue
FROM orders WHERE status = 'completed'
GROUP BY DATE(created_at);

REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_stats;`,
      },
      {
        id: "scaling",
        title: "Replicas, Partitioning & Sharding",
        level: "senior",
        explanation: `**Read Replicas** — First scaling move. Write to primary, read from replicas. Caveat: 10ms-1s replication lag.\n\n**Partitioning** — Split ONE large table into smaller pieces (by date range, category, hash). Same DB server. Automatic query routing.\n\n**Sharding** — Split data across SEPARATE SERVERS. Most complex strategy.\n\n**When to shard (almost never):**\nTry first: vertical scaling → query optimization → caching → read replicas → partitioning → connection pooling → archiving. Only shard when ALL of those are exhausted.\n\n**Sharding trade-offs:**\n❌ Cross-shard JOINs impossible\n❌ Distributed transactions very hard\n❌ Rebalancing is painful\n❌ Application complexity explodes`,
        production: `🏭 **GitHub:** Shard MySQL by repository ID. Most queries scoped to one repo.\n\n🏭 **Notion:** Single PostgreSQL for years, then Citus (PG extension) for horizontal sharding — same SQL, distributed.`,
        code: `-- Table partitioning (PostgreSQL 10+)
CREATE TABLE events (
    id BIGSERIAL, event_type VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL, payload JSONB
) PARTITION BY RANGE (created_at);

CREATE TABLE events_2024_q1 PARTITION OF events
    FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');
CREATE TABLE events_2024_q2 PARTITION OF events
    FOR VALUES FROM ('2024-04-01') TO ('2024-07-01');

-- Queries auto-hit the right partition
SELECT * FROM events WHERE created_at >= '2024-01-15';`,
      },
    ],
  },
  {
    id: "tricky",
    icon: "🧩",
    title: "Tricky Interview Questions",
    subtitle: "Gotchas that catch even experienced devs",
    topics: [
      {
        id: "null-traps",
        title: "NULL Traps — The #1 SQL Gotcha",
        level: "mid",
        explanation: `NULL is "unknown" — NOT a value. Any comparison with NULL returns NULL.\n\n**Trap 1:** NULL = NULL is NOT true. Use IS NULL.\n**Trap 2:** NOT IN with NULLs returns NOTHING. Use NOT EXISTS.\n**Trap 3:** AVG ignores NULLs. 3 of 5 values NULL → averages only 2.\n**Trap 4:** Multiple NULLs allowed in UNIQUE columns (NULL ≠ NULL).`,
        production: `🏭 **Payment bug:** NOT IN query to find unprocessed payments. A NULL payment_id in the processed table → query returned zero rows → thousands of payments missed. Fix: NOT EXISTS.`,
        code: `-- NOT IN + NULL DISASTER
-- Returns ZERO ROWS if subquery has ANY NULL:
SELECT * FROM orders
WHERE id NOT IN (SELECT order_id FROM refunds);

-- SAFE: use NOT EXISTS
SELECT * FROM orders o
WHERE NOT EXISTS (
    SELECT 1 FROM refunds r WHERE r.order_id = o.id
);

-- NULL arithmetic
SELECT 1+NULL, NULL=NULL, NULL!=NULL, COALESCE(NULL, 0);
-- Result: NULL, NULL, NULL, 0`,
      },
      {
        id: "query-puzzles",
        title: "Classic SQL Puzzles",
        level: "mid",
        explanation: `Patterns that come up repeatedly:\n\n→ **Nth salary** — DENSE_RANK (handles ties)\n→ **Delete duplicates** — Self-join or ROW_NUMBER keeping lowest ID\n→ **Find gaps** — LAG window function\n→ **Employees earning more than manager** — Self-join\n→ **UNION vs UNION ALL** — UNION deduplicates (slow). UNION ALL keeps all (fast). Always use UNION ALL unless you need dedup.`,
        production: null,
        code: `-- Nth highest salary (handles ties)
SELECT salary FROM (
    SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS rnk
    FROM employees
) ranked WHERE rnk = 3;

-- Delete duplicates, keep lowest ID
DELETE FROM employees e1 USING employees e2
WHERE e1.email = e2.email AND e1.id > e2.id;

-- Employees earning more than their manager
SELECT e.name, e.salary, m.name AS manager, m.salary AS mgr_salary
FROM employees e JOIN employees m ON e.manager_id = m.id
WHERE e.salary > m.salary;

-- Find gaps in ID sequence
SELECT prev_id + 1 AS gap_start, id - 1 AS gap_end
FROM (SELECT id, LAG(id) OVER (ORDER BY id) AS prev_id FROM orders) t
WHERE id - prev_id > 1;`,
      },
      {
        id: "arch-gotchas",
        title: "Architecture Gotchas (Senior/Lead)",
        level: "senior",
        explanation: `**ALTER TABLE on 500M rows?**\nPG 11+: ADD COLUMN with DEFAULT is instant. But NOT NULL constraint rewrites entire table → locked for hours.\n→ Fix: Expand-contract (add nullable → backfill in batches → add constraint).\n\n**UUIDs as PKs?**\nRandom UUIDs cause B-Tree fragmentation.\n→ Fix: UUIDv7 (time-ordered) or ULID.\n\n**OFFSET pagination breaks with live data.**\nRow inserted between pages → skip or duplicate.\n→ Fix: Keyset/cursor pagination.\n\n**Noisy neighbor in multi-tenant SaaS?**\nOne tenant's query kills DB.\n→ Fix: statement_timeout per role → connection limits → tenant-aware sharding.`,
        production: `🏭 **GitHub 2012 outage:** ALTER TABLE locked a large MySQL table for hours. They built gh-ost (GitHub Online Schema Tool) — shadow table, background copy, swap.\n\n🏭 **Multi-tenant SaaS:** One customer's analytics query consumed all resources. Fix: per-tenant statement_timeout, PgBouncer connection limits, eventually separate DBs for large tenants.`,
        code: `-- Safe ALTER on large table (expand-contract)
-- Step 1: Add nullable (instant in PG 11+)
ALTER TABLE users ADD COLUMN phone VARCHAR(20);

-- Step 2: Backfill in batches
UPDATE users SET phone = src.phone FROM source src
WHERE users.id = src.user_id AND users.id BETWEEN 1 AND 100000;

-- Step 3: Add constraint after backfill
ALTER TABLE users ALTER COLUMN phone SET NOT NULL;

-- Optimistic locking (prevent lost updates)
UPDATE products SET price = 29.99, version = version + 1
WHERE id = 42 AND version = 7;
-- 0 rows = conflict → retry`,
      },
    ],
  },
  {
    id: "model-answers",
    icon: "💬",
    title: "Model Interview Answers",
    subtitle: "What a senior/lead candidate sounds like",
    topics: [
      {
        id: "when-nosql",
        title: '"When would you choose NoSQL over SQL?"',
        level: "senior",
        explanation: `**Strong answer:**\n"I start with PostgreSQL for almost everything — it handles relational data, JSON, full-text search, and scales well. I'd add specialized databases only for proven needs:\n\n→ **Redis** for caching and real-time (sessions, leaderboards, rate limiting) — almost always the first addition.\n→ **ClickHouse** for analytics over billions of rows — when PostgreSQL's aggregation queries get too slow for dashboards.\n→ **Elasticsearch** for complex search UIs with facets, fuzzy matching, and relevance scoring.\n→ **MongoDB** if schema truly varies AND we don't need cross-document transactions — but I'd first try PostgreSQL's JSONB.\n→ **Cassandra** only for extreme writes (100K+/sec) or multi-DC — operationally complex.\n→ **CockroachDB/TiDB** when you need SQL + ACID but must scale writes horizontally across regions.\n\nThe key: each new database is an operational cost — monitoring, backups, on-call expertise, failure handling."`,
        production: null,
        code: null,
      },
      {
        id: "slow-query-answer",
        title: '"How do you handle a slow query in production?"',
        level: "senior",
        explanation: `**Strong answer:**\n"Systematically. First, pg_stat_statements sorted by total execution time — a 10ms query running 1M times is worse than a 5s query running once.\n\nThen EXPLAIN ANALYZE. I look for: seq scans on large tables, bad row estimates (→ ANALYZE), nested loops on large sets, sorts spilling to disk.\n\nQuick fixes usually work: composite index matching WHERE + ORDER BY, EXISTS instead of IN, eliminate SELECT *. For analytics, materialized views.\n\nBroader issues: PgBouncer for connection pooling, read replicas for reporting, Redis for hot data. Sharding is absolute last resort."`,
        production: null,
        code: null,
      },
      {
        id: "design-answer",
        title: '"Design the database for [any system]"',
        level: "lead",
        explanation: `**Framework for any system design question:**\n\n**Step 1: Clarify** — "What scale? Read or write heavy? Consistency requirements?"\n**Step 2: Identify entities** — Draw relationships. Users, Orders, Products, etc.\n**Step 3: Choose primary DB** — Almost always PostgreSQL. Justify it.\n**Step 4: Find hot paths** — "Product page hit 10K/sec" → Cache with Redis.\n**Step 5: Special access patterns** — Text search → Elasticsearch. Relationships → Graph.\n**Step 6: Discuss trade-offs** — Normalization vs denormalization. Consistency vs availability.\n**Step 7: Plan for growth** — Read replicas, partitioning, cache invalidation.\n\n**The interviewer wants REASONING, not a perfect schema.** Show trade-offs, not certainty.`,
        production: null,
        code: null,
      },
    ],
  },
  {
    id: "normalization",
    icon: "🗂️",
    title: "Normalization & Data Modeling",
    subtitle: "Structuring data correctly from day one",
    topics: [
      {
        id: "normal-forms",
        title: "1NF → 3NF → BCNF — With Real Examples",
        level: "junior",
        explanation: `Normalization eliminates data redundancy and anomalies. Each normal form builds on the previous.\n\n**1NF (First Normal Form):**\n→ Every column holds atomic (single) values\n→ No repeating groups or arrays in a cell\n→ Violation: skills = "Java, Python, Go" in one column\n→ Fix: Create a separate employee_skills table\n\n**2NF (Second Normal Form):**\n→ 1NF + no partial dependencies\n→ Every non-key column depends on the FULL primary key\n→ Violation: In (student_id, course_id → student_name), student_name depends only on student_id\n→ Fix: Move student_name to a students table\n\n**3NF (Third Normal Form):**\n→ 2NF + no transitive dependencies (non-key → non-key)\n→ Violation: employees table has dept_id AND dept_name — dept_name depends on dept_id, not on employee\n→ Fix: Move dept_name to a departments table\n\n**BCNF (Boyce-Codd):**\n→ Every determinant is a candidate key. Stricter than 3NF. Rarely needed in practice.\n\n**When to denormalize:**\n→ Read-heavy dashboards needing speed over write-safety\n→ Eliminate expensive JOINs for hot paths\n→ Caching frequently accessed aggregations\n→ Trade-off: faster reads, slower writes, potential inconsistency`,
        production: `🏭 **E-commerce order denormalization:**\nStrictly normalized: orders only store product_id, look up price from products table at display time. Problem: if you change a product's price, old orders show the NEW price. Fix: Denormalize — store price_at_time_of_purchase in order_items. This is intentional denormalization for data integrity.\n\n🏭 **User activity feed:**\nNormalized: JOIN users + posts + comments + likes. 5 tables joined per feed item × 50 items = brutal. Denormalized: Store a pre-built JSON activity feed per user. Update it asynchronously. Read time: 1ms vs 200ms.`,
        code: `-- BAD: 1NF violation (repeating groups)
CREATE TABLE employees_bad (
    id INT, name TEXT,
    skills TEXT  -- "Java, Python, Go" — not atomic!
);

-- GOOD: Normalized with junction table
CREATE TABLE employees (id SERIAL PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE skills (id SERIAL PRIMARY KEY, name TEXT UNIQUE NOT NULL);
CREATE TABLE employee_skills (
    employee_id INT REFERENCES employees(id) ON DELETE CASCADE,
    skill_id INT REFERENCES skills(id) ON DELETE CASCADE,
    proficiency VARCHAR(20) DEFAULT 'intermediate',
    PRIMARY KEY (employee_id, skill_id)
);

-- Intentional denormalization: snapshot price at order time
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id),
    product_id INT REFERENCES products(id),
    product_name TEXT NOT NULL,           -- denormalized snapshot
    unit_price DECIMAL(10,2) NOT NULL,    -- price at time of purchase
    quantity INT NOT NULL CHECK (quantity > 0)
);`,
      },
      {
        id: "data-types",
        title: "Choosing the Right Data Types",
        level: "junior",
        explanation: `Choosing correct types prevents bugs, saves storage, and improves query performance.\n\n**Numbers:**\n→ INT / BIGINT — exact integers. Use BIGINT for IDs (INT max = 2.1 billion, runs out faster than you think)\n→ DECIMAL(p,s) — exact decimal. Use for money! Never FLOAT for money (0.1 + 0.2 ≠ 0.3)\n→ FLOAT/DOUBLE — approximate. Use for scientific calculations, coordinates\n\n**Text:**\n→ VARCHAR(n) — variable length with limit. Use for emails, names, SKUs\n→ TEXT — unlimited length. Use for descriptions, content. In PostgreSQL, there's no performance difference between VARCHAR and TEXT\n→ CHAR(n) — fixed length, padded with spaces. Rarely useful\n\n**Dates:**\n→ TIMESTAMP — date + time. Always use TIMESTAMPTZ (with timezone) in PostgreSQL!\n→ DATE — date only. Use for birthdays, business dates\n→ INTERVAL — duration. Great for "created_at + INTERVAL '30 days'"\n\n**Other essentials:**\n→ BOOLEAN — true/false/null\n→ UUID — universally unique ID. Use UUIDv7 for primary keys (time-ordered)\n→ JSONB — flexible semi-structured data (PostgreSQL). Indexed with GIN\n→ ARRAY — PostgreSQL native arrays. Great for tags, categories\n→ ENUM — fixed set of values. Use sparingly (hard to modify). Consider a lookup table instead`,
        production: `🏭 **The FLOAT money disaster:**\nA fintech stored prices as FLOAT. 19.99 * 100 items = 1998.9999999997, not 1999.00. Customers were charged wrong amounts. Fix: DECIMAL(10,2) everywhere.\n\n🏭 **TIMESTAMP vs TIMESTAMPTZ:**\nA global app stored local times as TIMESTAMP (without timezone). Users in Tokyo saw event times meant for NYC. Chaos. TIMESTAMPTZ stores everything as UTC internally and converts per session timezone.`,
        code: `-- Money: ALWAYS use DECIMAL, never FLOAT
CREATE TABLE invoices (
    total DECIMAL(12,2) NOT NULL,    -- ✅ exact
    -- total FLOAT NOT NULL,         -- ❌ 0.1 + 0.2 ≠ 0.3
);

-- Timestamps: ALWAYS use TIMESTAMPTZ
CREATE TABLE events (
    created_at TIMESTAMPTZ DEFAULT NOW(),  -- ✅ timezone-aware
    -- created_at TIMESTAMP,               -- ❌ ambiguous timezone
);

-- UUID v7 for primary keys (time-sorted = B-Tree friendly)
CREATE EXTENSION IF NOT EXISTS pg_uuidv7;
CREATE TABLE orders (
    id UUID DEFAULT uuid_generate_v7() PRIMARY KEY
);

-- ENUM vs lookup table
-- ENUM (simple but hard to modify):
CREATE TYPE order_status AS ENUM ('pending','processing','shipped','delivered');
-- Lookup table (flexible, can add metadata):
CREATE TABLE statuses (id SERIAL PRIMARY KEY, name TEXT UNIQUE, display_order INT);`,
      },
    ],
  },
  {
    id: "procedures-triggers",
    icon: "⚙️",
    title: "Procedures, Functions, Triggers & Views",
    subtitle: "Server-side logic and virtual tables",
    topics: [
      {
        id: "functions-procs",
        title: "Functions vs Stored Procedures",
        level: "mid",
        explanation: `**Functions** return a value and can be used inside SQL statements (SELECT, WHERE). They run within the calling transaction.\n\n**Stored Procedures** (PostgreSQL 11+) can manage transactions (COMMIT/ROLLBACK inside the procedure). Used for complex multi-step operations.\n\n**When to use:**\n✅ Complex business logic that must run atomically\n✅ Data validation beyond what CHECK constraints offer\n✅ Batch processing (backfills, cleanups)\n✅ Encapsulating common query patterns\n\n**When NOT to:**\n❌ Simple CRUD operations (do it in your app)\n❌ Complex application logic (hard to test, version, debug)\n❌ Anything that needs to call external services\n\n**Interview opinion:** "I prefer keeping business logic in the application layer for testability and version control, but use database functions for data integrity rules, complex aggregations, and operations that would be inefficient over the network."`,
        production: `🏭 **Audit logging with functions:**\nInstead of trusting every application to log changes, a database function ensures every UPDATE to sensitive tables creates an audit record. No app-level bug can bypass it.`,
        code: `-- Function: reusable calculation inside SQL
CREATE OR REPLACE FUNCTION calculate_discount(
    total DECIMAL, tier VARCHAR
) RETURNS DECIMAL AS $$
BEGIN
    RETURN CASE tier
        WHEN 'gold' THEN total * 0.20
        WHEN 'silver' THEN total * 0.10
        ELSE total * 0.05
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Use in queries:
SELECT name, total, calculate_discount(total, customer_tier) AS discount
FROM orders;

-- Stored Procedure: multi-step with transaction control
CREATE OR REPLACE PROCEDURE transfer_funds(
    sender_id INT, receiver_id INT, amount DECIMAL
) LANGUAGE plpgsql AS $$
BEGIN
    UPDATE accounts SET balance = balance - amount
    WHERE id = sender_id AND balance >= amount;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Insufficient funds';
    END IF;
    UPDATE accounts SET balance = balance + amount WHERE id = receiver_id;
    -- Log the transfer
    INSERT INTO transfers(from_id, to_id, amount) VALUES(sender_id, receiver_id, amount);
    COMMIT;
END;
$$;
CALL transfer_funds(1, 2, 500.00);`,
      },
      {
        id: "triggers",
        title: "Triggers — Automatic Reactions to Data Changes",
        level: "mid",
        explanation: `Triggers automatically execute a function BEFORE or AFTER INSERT, UPDATE, or DELETE on a table. They're invisible to the application — the DB handles them.\n\n**BEFORE triggers** — Modify data before it's written (validation, auto-fill columns).\n**AFTER triggers** — React after the change is committed (audit logs, notifications, syncing).\n**INSTEAD OF triggers** — Replace the operation entirely (used on views).\n\n**Dangers of triggers:**\n❌ Hidden logic — developers don't see them in app code\n❌ Performance — fire on EVERY matching operation\n❌ Cascading triggers — trigger A fires trigger B fires trigger C...\n❌ Hard to debug and test\n\n**Rule of thumb:** Use triggers for audit logs, updated_at timestamps, and data integrity. NOT for business logic.`,
        production: `🏭 **Auto-updating updated_at (every company does this):**\nInstead of relying on every app to SET updated_at = NOW(), a trigger does it automatically. Bulletproof.\n\n🏭 **Audit trail at a bank:**\nEvery change to account balances triggers an audit log entry with old value, new value, who changed it, and when. Regulators require this. A trigger ensures no application bug can skip the audit.`,
        code: `-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Audit trail trigger
CREATE OR REPLACE FUNCTION audit_account_changes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO account_audit (account_id, field, old_val, new_val, changed_at)
    SELECT NEW.id, 'balance', OLD.balance::TEXT, NEW.balance::TEXT, NOW()
    WHERE OLD.balance IS DISTINCT FROM NEW.balance;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_accounts
AFTER UPDATE ON accounts
FOR EACH ROW EXECUTE FUNCTION audit_account_changes();

-- Prevent deletes (soft-delete enforcement)
CREATE TRIGGER prevent_hard_delete
BEFORE DELETE ON customers
FOR EACH ROW EXECUTE FUNCTION redirect_to_soft_delete();`,
      },
      {
        id: "views-types",
        title: "Views & Materialized Views",
        level: "junior",
        explanation: `**View** — A saved query that acts like a virtual table. Runs the underlying query each time you SELECT from it. Zero storage cost. Always up-to-date.\n\n**Materialized View** — A cached result of a query stored as a real table. Blazing fast reads but requires manual REFRESH. May serve stale data.\n\n**When to use Views:**\n→ Simplify complex JOINs that many queries use\n→ Security: expose only certain columns/rows to certain roles\n→ API stability: app queries the view, underlying tables can change\n\n**When to use Materialized Views:**\n→ Dashboard queries that aggregate millions of rows\n→ Reports that don't need real-time data\n→ Expensive queries called repeatedly (cache the result)`,
        production: `🏭 **Security view at a healthcare company:**\nDoctors see patient records through a view that filters by their department and excludes billing info. The underlying table has everything, but the view enforces column-level and row-level access.\n\n🏭 **Dashboard materialized view:**\nA SaaS dashboard shows "revenue by plan by month." Without MV: 12-second query on every page load. With MV refreshed every 5 minutes: 3ms. Users don't notice the 5-minute lag.`,
        code: `-- View: simplify a complex query
CREATE VIEW v_order_summary AS
SELECT o.id, c.name AS customer, c.email,
    SUM(oi.quantity * oi.unit_price) AS total,
    COUNT(oi.id) AS item_count, o.created_at
FROM orders o
JOIN customers c ON o.customer_id = c.id
JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, c.name, c.email, o.created_at;

-- Use it like a table
SELECT * FROM v_order_summary WHERE total > 1000;

-- Security view: limit what a role can see
CREATE VIEW v_public_users AS
SELECT id, name, avatar_url FROM users WHERE is_public = true;
GRANT SELECT ON v_public_users TO public_api_role;

-- Materialized View: cached expensive report
CREATE MATERIALIZED VIEW mv_monthly_revenue AS
SELECT DATE_TRUNC('month', created_at) AS month,
    plan, COUNT(*) AS subscriptions, SUM(amount) AS revenue
FROM payments WHERE status = 'succeeded'
GROUP BY 1, 2;

CREATE UNIQUE INDEX ON mv_monthly_revenue(month, plan);
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_monthly_revenue;`,
      },
    ],
  },
  {
    id: "mvcc-transactions",
    icon: "🔄",
    title: "MVCC, VACUUM & Transactions",
    subtitle: "How PostgreSQL handles concurrency internally",
    topics: [
      {
        id: "mvcc-explained",
        title: "MVCC — How Reads Never Block Writes",
        level: "senior",
        explanation: `MVCC (Multi-Version Concurrency Control) is PostgreSQL's secret weapon. Instead of locking rows during reads, it keeps multiple versions of each row.\n\n**How it works:**\n→ Each row has hidden columns: xmin (created by TX#) and xmax (deleted by TX#)\n→ When you UPDATE a row, PostgreSQL doesn't modify it — it creates a NEW version and marks the old one as dead\n→ Each transaction sees a "snapshot" — it can only see rows where xmin < my_tx AND (xmax is empty OR xmax > my_tx)\n→ This means readers NEVER block writers and writers NEVER block readers\n\n**The cost:**\n→ Dead row versions ("dead tuples") accumulate\n→ Tables grow even without new data (table bloat)\n→ This is why PostgreSQL needs VACUUM\n\n**How other databases handle this:**\n→ PostgreSQL: old versions in the same table (heap)\n→ MySQL InnoDB: old versions in a separate "undo log"\n→ Oracle: also uses undo tablespace\n→ PostgreSQL's approach is simpler but creates more bloat`,
        production: `🏭 **Why VACUUM matters — the table that grew to 500GB:**\nA table with 10M rows was receiving 50K updates/second. Each update created a dead tuple. Without aggressive VACUUM, the table grew from 2GB to 500GB of mostly dead data. Queries slowed because PostgreSQL scanned dead rows. Fix: tune autovacuum to run more frequently on hot tables.\n\n🏭 **Transaction ID wraparound — the scariest PostgreSQL issue:**\nPostgreSQL uses 32-bit transaction IDs (~4 billion). If VACUUM doesn't run, old TX IDs aren't reclaimed, and eventually the DB hits wraparound — it SHUTS DOWN to prevent data corruption. This is why autovacuum must never be disabled.`,
        code: `-- Check dead tuples (bloat indicator)
SELECT relname, n_live_tup, n_dead_tup,
    ROUND(n_dead_tup * 100.0 / NULLIF(n_live_tup + n_dead_tup, 0), 1) AS dead_pct
FROM pg_stat_user_tables
WHERE n_dead_tup > 10000
ORDER BY n_dead_tup DESC;

-- Check when autovacuum last ran
SELECT relname, last_vacuum, last_autovacuum, last_analyze,
    autovacuum_count, vacuum_count
FROM pg_stat_user_tables ORDER BY n_dead_tup DESC;

-- Tune autovacuum for a hot table
ALTER TABLE events SET (
    autovacuum_vacuum_threshold = 1000,
    autovacuum_vacuum_scale_factor = 0.01,  -- vacuum after 1% changes
    autovacuum_analyze_threshold = 500
);

-- Check for transaction ID wraparound risk
SELECT datname, age(datfrozenxid), current_setting('autovacuum_freeze_max_age')
FROM pg_database ORDER BY age(datfrozenxid) DESC;`,
      },
      {
        id: "locking",
        title: "Locking — Row, Table & Advisory Locks",
        level: "senior",
        explanation: `**Row-level locks (most common):**\n→ SELECT ... FOR UPDATE — exclusive lock, blocks other FOR UPDATE\n→ SELECT ... FOR SHARE — shared lock, allows other FOR SHARE but blocks FOR UPDATE\n→ SELECT ... FOR UPDATE NOWAIT — fails immediately if locked (don't wait)\n→ SELECT ... FOR UPDATE SKIP LOCKED — skip locked rows (great for job queues)\n\n**Table-level locks:**\n→ ACCESS SHARE — acquired by SELECT (doesn't block anything)\n→ ROW EXCLUSIVE — acquired by INSERT/UPDATE/DELETE\n→ ACCESS EXCLUSIVE — acquired by ALTER TABLE, REINDEX (blocks everything!)\n\n**Advisory locks (application-level):**\n→ Voluntary locks that the DB doesn't enforce — your app checks them\n→ Great for: "only one worker processes this job at a time"\n→ Faster than row locks because no actual row is involved\n\n**Deadlock prevention:**\n→ Always access tables/rows in the same order\n→ Keep transactions short\n→ Use NOWAIT or lock timeouts\n→ PostgreSQL detects deadlocks and kills one transaction (the "victim")`,
        production: `🏭 **Job queue with SKIP LOCKED (real pattern):**\nMultiple workers pulling tasks from a queue table. Without SKIP LOCKED, they all try to lock the same first row. With it, each worker grabs the next unlocked row — zero contention, maximum throughput.\n\n🏭 **Deadlock in a payment system:**\nTX1: Lock order → Lock payment. TX2: Lock payment → Lock order. Deadlock! Fix: Always lock order THEN payment (consistent order). This is the #1 cause of production deadlocks.`,
        code: `-- Job queue with SKIP LOCKED (production pattern)
-- Multiple workers can call this concurrently
WITH next_job AS (
    SELECT id FROM job_queue
    WHERE status = 'pending'
    ORDER BY created_at
    LIMIT 1
    FOR UPDATE SKIP LOCKED  -- skip rows other workers grabbed
)
UPDATE job_queue SET status = 'processing', worker_id = 'worker-1'
FROM next_job WHERE job_queue.id = next_job.id
RETURNING job_queue.*;

-- Advisory lock: ensure only one cron runs at a time
SELECT pg_try_advisory_lock(12345);  -- returns true if acquired
-- ... do work ...
SELECT pg_advisory_unlock(12345);

-- Check current locks (debugging)
SELECT pid, locktype, relation::regclass, mode, granted, waitstart
FROM pg_locks WHERE NOT granted;  -- shows waiting locks

-- Check for long-running queries (potential lock holders)
SELECT pid, now() - pg_stat_activity.query_start AS duration,
    query, state
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY duration DESC;`,
      },
    ],
  },
  {
    id: "security",
    icon: "🔒",
    title: "Database Security",
    subtitle: "SQL injection, permissions, encryption",
    topics: [
      {
        id: "sql-injection",
        title: "SQL Injection — The #1 Web Vulnerability",
        level: "junior",
        explanation: `SQL injection happens when user input is concatenated directly into SQL strings. The attacker sends input that changes the query's meaning.\n\n**The attack:**\nInput field: ' OR '1'='1\nBecomes: SELECT * FROM users WHERE email = '' OR '1'='1'\n→ Returns ALL users! The attacker just dumped your user table.\n\nWorse: '; DROP TABLE users; --\n→ Deletes your entire users table.\n\n**The fix: ALWAYS use parameterized queries (prepared statements).**\nNever concatenate user input into SQL. Every language and ORM supports parameterized queries. There is NO exception.\n\n**Even if you use an ORM:** Be careful with raw SQL methods (e.g., Rails' .where("name = '#{input}'") is vulnerable, but .where(name: input) is safe).`,
        production: `🏭 **The 2017 Equifax breach:**\nAffected 147 million people. While the root cause was a different vulnerability (Apache Struts), the data extracted included SQL-accessible personal records. SQL injection remains in the OWASP Top 10 every year.\n\n🏭 **Bobby Tables (xkcd/real story):**\nA student's registration system was vulnerable. Input: Robert'); DROP TABLE students;-- actually dropped the table. The school lost all student records. This is why "Little Bobby Tables" is famous in tech.`,
        code: `-- ❌ VULNERABLE (string concatenation)
-- Python: f"SELECT * FROM users WHERE email = '{user_input}'"
-- Java:  "SELECT * FROM users WHERE email = '" + input + "'"
-- If input = "' OR '1'='1" → returns ALL users

-- ✅ SAFE (parameterized queries)
-- Python (psycopg2):
-- cursor.execute("SELECT * FROM users WHERE email = %s", (user_input,))

-- Node.js (pg):
-- client.query('SELECT * FROM users WHERE email = $1', [userInput])

-- Java (PreparedStatement):
-- ps = conn.prepareStatement("SELECT * FROM users WHERE email = ?");
-- ps.setString(1, userInput);

-- ORM example (safe by default):
-- Django:  User.objects.filter(email=user_input)
-- Rails:   User.where(email: user_input)
-- SQLAlchemy: session.query(User).filter_by(email=user_input)`,
      },
      {
        id: "permissions-rls",
        title: "Permissions, Roles & Row-Level Security",
        level: "mid",
        explanation: `**Principle of Least Privilege:** Every user/service gets the minimum permissions needed. Your web app should NOT connect as a superuser.\n\n**PostgreSQL role system:**\n→ Roles can own objects, have permissions, and inherit from other roles\n→ GRANT/REVOKE control access at table, column, and row level\n→ Separate roles for: read-only analytics, read-write app, admin\n\n**Row-Level Security (RLS):**\nAutomatically filter rows based on the current user. Perfect for multi-tenant SaaS — each tenant only sees their own data, enforced at the DB level. Even if the app has a bug, data can't leak between tenants.`,
        production: `🏭 **Multi-tenant SaaS with RLS:**\nInstead of every query including AND tenant_id = current_tenant (which developers might forget), RLS automatically adds this filter. Even direct SQL access from an admin tool respects RLS policies. This is how PostgREST and Supabase handle multi-tenancy.`,
        code: `-- Create roles with minimal permissions
CREATE ROLE app_readonly;
GRANT CONNECT ON DATABASE myapp TO app_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_readonly;

CREATE ROLE app_readwrite;
GRANT CONNECT ON DATABASE myapp TO app_readwrite;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_readwrite;

-- Row-Level Security for multi-tenancy
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON orders
    USING (tenant_id = current_setting('app.current_tenant')::INT);

-- App sets tenant context per request:
-- SET LOCAL app.current_tenant = '42';
-- SELECT * FROM orders;  -- automatically filtered to tenant 42

-- Column-level permissions
GRANT SELECT (id, name, email) ON users TO support_role;
-- Support can see id, name, email but NOT password_hash, ssn, etc.

-- Encryption at rest and in transit
-- At rest: Enable TDE (Transparent Data Encryption) or use encrypted volumes
-- In transit: Always require SSL connections
ALTER SYSTEM SET ssl = on;`,
      },
    ],
  },
  {
    id: "design-patterns",
    icon: "🏛️",
    title: "Database Design Patterns",
    subtitle: "Battle-tested patterns used in production",
    topics: [
      {
        id: "soft-deletes",
        title: "Soft Deletes & Audit Trails",
        level: "mid",
        explanation: `**Soft deletes:** Instead of DELETE, set a deleted_at timestamp. The row stays in the DB but is filtered out of normal queries.\n\n**Why:**\n→ Undo deletes ("I accidentally deleted that order!")\n→ Legal/compliance requirements (retain records for 7 years)\n→ Data integrity (other tables may reference the row)\n\n**Danger:** Every query must include WHERE deleted_at IS NULL. Use a view or RLS policy to enforce this automatically.\n\n**Audit trail:** Log every change (INSERT, UPDATE, DELETE) with who, when, old value, and new value. Essential for regulated industries (finance, healthcare) and useful everywhere for debugging.`,
        production: `🏭 **Stripe's approach:**\nWhen you "delete" a customer in Stripe, they're soft-deleted. The payment history, invoices, and audit trail remain for compliance. Only after a retention period does data actually get purged.`,
        code: `-- Soft delete pattern
ALTER TABLE customers ADD COLUMN deleted_at TIMESTAMPTZ;
CREATE INDEX idx_active_customers ON customers(id) WHERE deleted_at IS NULL;

-- "Delete" = set timestamp
UPDATE customers SET deleted_at = NOW() WHERE id = 42;

-- View to hide deleted records automatically
CREATE VIEW active_customers AS
SELECT * FROM customers WHERE deleted_at IS NULL;

-- Audit trail with trigger
CREATE TABLE audit_log (
    id BIGSERIAL PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id BIGINT NOT NULL,
    action TEXT NOT NULL,  -- INSERT, UPDATE, DELETE
    old_data JSONB,
    new_data JSONB,
    changed_by TEXT DEFAULT current_user,
    changed_at TIMESTAMPTZ DEFAULT NOW()
);`,
      },
      {
        id: "common-patterns",
        title: "EAV, Polymorphic, Event Sourcing",
        level: "senior",
        explanation: `**EAV (Entity-Attribute-Value):**\nA flexible schema pattern: (entity_id, attribute_name, attribute_value). Used when attributes vary wildly per entity. Problem: terrible query performance and no type safety.\n→ Better alternative: PostgreSQL JSONB column with GIN index.\n\n**Polymorphic associations:**\nA comments table that can belong to posts, products, or tickets. Two approaches:\n→ Separate FK columns (post_id, product_id, ticket_id) — simple but nullable\n→ Type + ID columns (commentable_type, commentable_id) — flexible but no FK constraint\n\n**Event Sourcing:**\nStore events (facts), not current state. The account balance isn't stored — it's computed by replaying all transactions. Every state change is an immutable event in an append-only log.\n→ Use when: audit trail is critical, need temporal queries ("what was the state on March 15?"), undo/replay\n\n**CQRS (Command Query Responsibility Segregation):**\nSeparate write model (normalized, consistent) from read model (denormalized, fast). Write events to one store, project them into optimized read views.`,
        production: `🏭 **Bank ledger (event sourcing):**\nThe balance isn't a mutable field — it's the sum of all credit/debit events. To find "what was the balance at 3pm yesterday?" just SUM events up to that timestamp. No need for time-travel queries or audit reconstruction.\n\n🏭 **Shopify uses CQRS:**\nWrites go to a normalized MySQL database. Reads for the storefront come from denormalized, cached read models optimized for each page type. The two models are synced asynchronously.`,
        code: `-- Event sourcing: immutable event log
CREATE TABLE account_events (
    id BIGSERIAL PRIMARY KEY,
    account_id INT NOT NULL,
    event_type VARCHAR(50) NOT NULL,  -- 'deposit', 'withdrawal', 'fee'
    amount DECIMAL(12,2) NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Current balance = replay all events
SELECT account_id,
    SUM(CASE WHEN event_type IN ('deposit','refund') THEN amount
             WHEN event_type IN ('withdrawal','fee') THEN -amount
    END) AS balance
FROM account_events
WHERE account_id = 42
GROUP BY account_id;

-- Balance at a specific point in time
SELECT SUM(CASE WHEN event_type IN ('deposit','refund') THEN amount
                WHEN event_type IN ('withdrawal','fee') THEN -amount END)
FROM account_events
WHERE account_id = 42 AND created_at <= '2024-03-15 15:00:00';

-- Polymorphic: separate FKs (simpler, type-safe)
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    body TEXT NOT NULL,
    post_id INT REFERENCES posts(id),
    product_id INT REFERENCES products(id),
    CONSTRAINT one_parent CHECK (
        (post_id IS NOT NULL)::INT + (product_id IS NOT NULL)::INT = 1
    )
);`,
      },
    ],
  },
];

const LEVEL_COLORS = {
  trainee: { bg: "#1a2744", text: "#60a5fa", border: "#1e3a5f", label: "Trainee" },
  junior: { bg: "#1a3a2a", text: "#4ade80", border: "#16542e", label: "Junior" },
  mid: { bg: "#2a2a1a", text: "#facc15", border: "#544416", label: "Mid" },
  senior: { bg: "#2a1a2a", text: "#e879f9", border: "#541654", label: "Senior" },
  lead: { bg: "#2a1a1a", text: "#fb923c", border: "#542216", label: "Lead" },
};

/*── WIZARD ──*/
const WIZ_QS = [
  { q: "What kind of data are you storing?", opts: [
    { label: "Structured business data (users, orders, products)", val: "structured" },
    { label: "Flexible/varied documents (CMS, profiles, catalogs)", val: "documents" },
    { label: "Time-series / sensor data / metrics", val: "timeseries" },
    { label: "Analytics / logs / events (billions of rows, aggregations)", val: "analytics" },
    { label: "Relationships & connections (social, recommendations)", val: "graph" },
    { label: "Full-text search (products, content, logs)", val: "search" },
    { label: "Simple key→value (cache, sessions, configs)", val: "kv" },
  ]},
  { q: "How much data will you have?", opts: [
    { label: "Small (under 100GB)", val: "small" },
    { label: "Medium (100GB – 1TB)", val: "medium" },
    { label: "Large (1TB+)", val: "large" },
  ]},
  { q: "What's your write volume?", opts: [
    { label: "Low–Medium (< 10K writes/sec)", val: "low" },
    { label: "High (10K–100K writes/sec)", val: "high" },
    { label: "Extreme (100K+ writes/sec)", val: "extreme" },
  ]},
  { q: "How critical is data consistency?", opts: [
    { label: "Critical — money, inventory, medical (ACID required)", val: "strict" },
    { label: "Important but slight delay is OK", val: "moderate" },
    { label: "Relaxed — eventual consistency is fine", val: "relaxed" },
  ]},
  { q: "Do you need complex queries (joins, aggregations)?", opts: [
    { label: "Yes — complex joins, reports, analytics", val: "complex" },
    { label: "Some — moderate queries", val: "some" },
    { label: "No — mostly lookups by ID/key", val: "simple" },
  ]},
];

function getRec(a) {
  const [dt, sz, wr, cn, qu] = a;
  const r = [];
  if (dt==="kv") r.push({ db:"Redis", icon:"🔴", why:"Perfect for key-value lookups, caching, sessions. Sub-ms latency.", tip:"Add DynamoDB if you need persistence guarantees and managed infra." });
  else if (dt==="graph") r.push({ db:"Neo4j", icon:"🔵", why:"Built for relationship traversal. Social networks, recommendations, fraud detection.", tip:"For simpler needs, PostgreSQL with Apache AGE extension might suffice." });
  else if (dt==="search") r.push({ db:"Elasticsearch / OpenSearch", icon:"🔎", why:"Inverted index for full-text search with relevance scoring, fuzzy matching, faceted navigation, and autocomplete.", tip:"Always pair with a primary DB (PostgreSQL). Elasticsearch is a search index, not a source of truth." });
  else if (dt==="analytics") {
    if (sz==="small") r.push({ db:"ClickHouse (or PostgreSQL)", icon:"🟡", why:"For smaller analytics, PostgreSQL with materialized views may suffice. ClickHouse shines when you hit hundreds of millions of rows and need sub-second aggregations.", tip:"If your team prefers zero-ops, consider Snowflake or BigQuery instead." });
    else r.push({ db:"ClickHouse", icon:"🟡", why:"Column-oriented OLAP engine. Aggregates billions of rows in seconds. Open-source or ClickHouse Cloud. Much cheaper than Snowflake/BigQuery at scale.", tip:"Snowflake/BigQuery for fully-managed batch analytics. ClickHouse for real-time dashboards. Many companies use both." });
  } else if (dt==="timeseries") {
    if (wr==="extreme") r.push({ db:"Cassandra / ScyllaDB", icon:"🟠", why:"Extreme write throughput and massive time-series. Multi-DC replication built-in.", tip:"If already on PostgreSQL, try TimescaleDB extension first. For analytics over time-series, consider ClickHouse." });
    else r.push({ db:"TimescaleDB (PostgreSQL)", icon:"🐘", why:"Time-series on PostgreSQL. Full SQL power plus auto-partitioning and compression.", tip:"For pure monitoring, InfluxDB. For analytics over time-series at massive scale, ClickHouse." });
  } else if (dt==="documents") {
    if (cn==="strict") r.push({ db:"PostgreSQL (JSONB)", icon:"🐘", why:"Flexible documents WITH ACID, joins, and indexing. Best of both worlds.", tip:"MongoDB 4.0+ has transactions too, but PG's JSONB is often sufficient." });
    else r.push({ db:"MongoDB", icon:"🍃", why:"Native document model, flexible schema. Great for document-centric access patterns.", tip:"Consider PostgreSQL JSONB if you also need relational data alongside." });
  } else {
    if (wr==="extreme"&&cn==="relaxed") r.push({ db:"Cassandra / ScyllaDB", icon:"🟠", why:"Extreme write throughput with eventual consistency.", tip:"Need SQL + scale? Consider CockroachDB or TiDB (NewSQL)." });
    else if (wr==="extreme"&&cn==="strict") r.push({ db:"CockroachDB / TiDB (NewSQL)", icon:"🪳", why:"Horizontal write scaling WITH full ACID and SQL. CockroachDB = PostgreSQL-compatible, TiDB = MySQL-compatible.", tip:"Only if you truly need horizontal writes. Regular PostgreSQL + read replicas handles most workloads." });
    else r.push({ db:"PostgreSQL", icon:"🐘", why:"The most versatile database. Handles relational, JSON, full-text search, geospatial, and scales well with extensions.", tip: qu==="complex"?"Add Redis for caching. Read replicas when reads >> writes.":"MySQL is comparable for simpler workloads if your team prefers it." });
  }
  if (r[0].db!=="Redis") r.push({ db:"+ Redis", icon:"🔴", why:"Add alongside your primary DB for caching, sessions, and real-time features. Almost every production system benefits.", tip:null });
  return r;
}

/*── CHEAT SHEET ──*/
const CHEAT = [
  { q:"DELETE vs TRUNCATE?", a:"DELETE logs row-by-row (rollback, triggers fire). TRUNCATE removes all instantly (minimal log, resets auto-increment)." },
  { q:"WHERE vs HAVING?", a:"WHERE filters rows BEFORE grouping. HAVING filters groups AFTER aggregation." },
  { q:"CHAR vs VARCHAR?", a:"CHAR = fixed-length (padded). VARCHAR = variable-length. Use VARCHAR." },
  { q:"View vs Materialized View?", a:"View = saved query, runs each time. MV = cached result, needs REFRESH." },
  { q:"Clustered vs Non-Clustered Index?", a:"Clustered: table data sorted by index (1 per table). Non-clustered: separate structure (many allowed)." },
  { q:"Optimistic vs Pessimistic Locking?", a:"Optimistic: check version at commit. Pessimistic: lock row at read." },
  { q:"OLTP vs OLAP?", a:"OLTP = fast small transactions (row-store). OLAP = complex analytics (column-store)." },
  { q:"Logical vs Physical Replication?", a:"Logical: SQL-level (selective). Physical: byte-level WAL copy (full, fast)." },
  { q:"2PC?", a:"Two-Phase Commit: prepare → commit/abort. Distributed atomicity. Safe but slow." },
  { q:"UNION vs UNION ALL?", a:"UNION deduplicates (slow). UNION ALL keeps all (fast). Default to UNION ALL." },
  { q:"EXISTS vs IN?", a:"EXISTS stops at first match. NOT IN breaks with NULLs — use NOT EXISTS." },
  { q:"WAL?", a:"Write-Ahead Log: changes logged before applied. Enables crash recovery + replication." },
  { q:"MVCC?", a:"Multi-Version Concurrency Control: readers don't block writers. Snapshot-based." },
  { q:"Deadlock?", a:"Two TXs each waiting for the other's lock. DB kills one. Prevent: access rows in same order." },
  { q:"CAP Theorem?", a:"Distributed: pick 2 of 3 (Consistency, Availability, Partition tolerance). Really CP or AP." },
  { q:"N+1 Problem?", a:"Loading N items then querying each individually. Fix: JOIN or eager load." },
  { q:"Sharding vs Partitioning?", a:"Partitioning = split within one server. Sharding = split across servers." },
  { q:"CDC?", a:"Change Data Capture: stream DB changes in real-time (Debezium). For sync, events, cache invalidation." },
  { q:"Hot vs Cold Data?", a:"Hot = frequent access (SSD, cache). Cold = archival (compressed, cheap)." },
  { q:"Row-store vs Column-store?", a:"Row-store (PostgreSQL): reads full rows, great for OLTP. Column-store (ClickHouse): reads columns independently, great for aggregations/OLAP." },
  { q:"ClickHouse vs PostgreSQL for analytics?", a:"PostgreSQL is fine for millions of rows. ClickHouse handles billions with sub-second aggregations — 10-100x faster for analytical queries." },
  { q:"ClickHouse vs Snowflake/BigQuery?", a:"ClickHouse: real-time, self-hosted (or Cloud), cheaper at scale. Snowflake/BQ: serverless, zero-ops, better for data teams, higher cost." },
  { q:"Elasticsearch vs PostgreSQL full-text search?", a:"PG full-text is good for basic search. Elasticsearch wins for relevance scoring, fuzzy matching, facets, autocomplete, and scale." },
  { q:"What is NewSQL?", a:"SQL + ACID + horizontal scaling. CockroachDB (PG-compatible), TiDB (MySQL-compatible), Google Spanner. For when PostgreSQL can't scale enough." },
  { q:"Inverted Index?", a:"Maps terms → documents (opposite of normal). Enables full-text search in O(1). Used by Elasticsearch, Lucene, PostgreSQL GIN." },
  { q:"Star Schema?", a:"Data warehouse pattern: central fact table (events/transactions) + dimension tables (users, products, dates). Optimized for analytical queries." },
];

function CheatCard({ item }) {
  const [show, setShow] = useState(false);
  return (
    <div onClick={()=>setShow(!show)} style={{background:"#111827",border:"1px solid #1e293b",borderRadius:10,padding:"12px 16px",marginBottom:6,cursor:"pointer"}}>
      <div style={{display:"flex",alignItems:"center",fontSize:14,fontWeight:600,color:"#f1f5f9",lineHeight:1.5}}>
        <span style={{color:"#f59e0b",marginRight:8,fontWeight:700}}>Q</span>{item.q}
        <span style={{marginLeft:"auto",color:"#475569",fontSize:12,flexShrink:0}}>{show?"▾":"▸"}</span>
      </div>
      {show && <div style={{marginTop:8,paddingTop:8,borderTop:"1px solid #1e293b",fontSize:13,color:"#94a3b8",lineHeight:1.7}}><span style={{color:"#4ade80",marginRight:8,fontWeight:700}}>A</span>{item.a}</div>}
    </div>
  );
}

/*───────────────────────────────────────────────────────────
  MAIN COMPONENT
───────────────────────────────────────────────────────────*/
// ============== PERSISTENCE ==============
// Survives page reloads. Stored as plain JSON under a single key so we can
// extend later (bookmarks, levelFilter, etc.) without bumping the schema.
const STORAGE_KEY = "db-prep:v1";

function loadStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStored(patch) {
  try {
    const cur = loadStored();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...cur, ...patch }));
  } catch {
    /* quota exceeded or private mode — silently ignore */
  }
}

export default function App() {
  const initial = useState(() => loadStored())[0];

  const [tab, setTab] = useState("guide");
  const [checked, setChecked] = useState(initial.checked || {});
  const [activeSection, setActiveSection] = useState(GUIDE_SECTIONS[0].id);
  const [expanded, setExpanded] = useState(initial.expanded || {});
  const [codeOpen, setCodeOpen] = useState({});
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [levelFilter, setLevelFilter] = useState(initial.levelFilter || "all");
  const [wizStep, setWizStep] = useState(0);
  const [wizAns, setWizAns] = useState([]);

  // Persist progress on every change (cheap — just a JSON.stringify of small objects).
  useEffect(() => { saveStored({ checked }); }, [checked]);
  useEffect(() => { saveStored({ expanded }); }, [expanded]);
  useEffect(() => { saveStored({ levelFilter }); }, [levelFilter]);

  const total = GUIDE_SECTIONS.reduce((a,s)=>a+s.topics.length,0);
  const done = Object.values(checked).filter(Boolean).length;
  const pct = Math.round(done/total*100);

  const filtSections = GUIDE_SECTIONS.map(s=>({...s, topics:s.topics.filter(t=>{
    const ms = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.explanation.toLowerCase().includes(search.toLowerCase());
    const ml = levelFilter==="all" || t.level===levelFilter;
    return ms && ml;
  })})).filter(s=>s.topics.length>0);

  const scrollTo = id => { setActiveSection(id); setSidebarOpen(false); document.getElementById(`s-${id}`)?.scrollIntoView({behavior:"smooth",block:"start"}); };
  const sDone = s => s.topics.filter(t=>checked[t.id]).length;

  const wizResult = wizAns.length===WIZ_QS.length ? getRec(wizAns) : null;

  const renderLine = (line, palette) => {
    if (!line.trim()) return <div style={{height:6}}/>;
    let h = line.replace(/\*\*(.+?)\*\*/g, `<b style="color:${palette==="prod"?"#fde68a":"#e2e8f0"}">$1</b>`)
      .replace(/→/g,"<span style='color:#f59e0b'>→</span>")
      .replace(/✅/g,"<span style='color:#4ade80'>✅</span>")
      .replace(/❌/g,"<span style='color:#f87171'>❌</span>");
    return <p style={{fontSize:13,color:palette==="prod"?"#d4a574":"#94a3b8",lineHeight:1.75,marginBottom:5}} dangerouslySetInnerHTML={{__html:h}}/>;
  };

  return (
    <div style={{display:"flex",height:"100vh",fontFamily:"'Outfit',sans-serif",background:"#0b0f1a",color:"#e2e8f0",overflow:"hidden"}}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {sidebarOpen && <div className="sidebar-mobile-overlay" style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:90}} onClick={()=>setSidebarOpen(false)}/>}

      {/* SIDEBAR */}
      {tab==="guide" && (
        <aside className={sidebarOpen ? "sidebar-mobile" : "sidebar-desktop"} style={{width:260,minWidth:260,background:"#0f1629",borderRight:"1px solid #1e293b",display:"flex",flexDirection:"column",zIndex:100,...(sidebarOpen?{position:"fixed",left:0,top:0,bottom:0}:{})}}>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"14px 12px",borderBottom:"1px solid #1e293b"}}>
            <div style={{fontSize:22,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,#f59e0b22,#f59e0b11)",borderRadius:8,border:"1px solid #f59e0b33"}}>⛁</div>
            <div><div style={{fontSize:13,fontWeight:700,color:"#f8fafc"}}>DB Interview Prep</div><div style={{fontSize:9,color:"#f59e0b",fontWeight:600,textTransform:"uppercase",letterSpacing:".05em"}}>Senior · Full Guide</div></div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 12px",borderBottom:"1px solid #1e293b"}}>
            <div style={{position:"relative",width:64,height:64,flexShrink:0}}>
              <svg width="64" height="64" viewBox="0 0 64 64"><circle cx="32" cy="32" r="26" fill="none" stroke="#1e293b" strokeWidth="4"/><circle cx="32" cy="32" r="26" fill="none" stroke={pct===100?"#34d399":"#f59e0b"} strokeWidth="4" strokeLinecap="round" strokeDasharray={`${pct/100*163.4} 163.4`} transform="rotate(-90 32 32)" style={{transition:"stroke-dasharray .5s"}}/></svg>
              <span style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"#f8fafc",fontFamily:"'JetBrains Mono',monospace"}}>{pct}%</span>
            </div>
            <div><div style={{fontSize:12,color:"#e2e8f0",fontWeight:600}}>{done}/{total}</div><div style={{fontSize:10,color:"#64748b"}}>topics reviewed</div></div>
          </div>
          <div style={{flex:1,overflow:"auto",padding:"6px 5px"}}>
            {GUIDE_SECTIONS.map(s=>{const d=sDone(s);return(
              <button key={s.id} onClick={()=>scrollTo(s.id)} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 8px",border:"none",background:activeSection===s.id?"#1e293b":"transparent",borderRadius:6,cursor:"pointer",color:activeSection===s.id?"#f8fafc":"#94a3b8",fontSize:11,fontFamily:"'Outfit',sans-serif",textAlign:"left",width:"100%",transition:"all .15s",marginBottom:1}}>
                <span style={{fontSize:14,width:22,textAlign:"center"}}>{s.icon}</span>
                <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.title}</span>
                <span style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",padding:"2px 5px",borderRadius:4,background:d===s.topics.length?"#065f46":"#1e293b",color:d===s.topics.length?"#34d399":"#64748b",fontWeight:600}}>{d}/{s.topics.length}</span>
              </button>
            );})}
          </div>
        </aside>
      )}

      {/* MAIN */}
      <main style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",borderBottom:"1px solid #1e293b",background:"#0f1629",flexWrap:"wrap"}}>
          {tab==="guide"&&<button className="menu-btn" onClick={()=>setSidebarOpen(true)} style={{display:"none",background:"transparent",border:"1px solid #1e293b",color:"#94a3b8",fontSize:16,padding:"2px 8px",borderRadius:6,cursor:"pointer"}}>☰</button>}
          <div style={{display:"flex",gap:2,background:"#1e293b",borderRadius:7,padding:2}}>
            {[["guide","📖 Study Guide"],["selector","🧭 DB Selector"],["cheatsheet","⚡ Rapid-Fire"]].map(([k,l])=>(
              <button key={k} onClick={()=>setTab(k)} style={{border:"none",background:tab===k?"#334155":"transparent",color:tab===k?"#f8fafc":"#94a3b8",fontSize:11.5,fontWeight:600,padding:"5px 11px",borderRadius:5,cursor:"pointer",fontFamily:"'Outfit',sans-serif",whiteSpace:"nowrap"}}>{l}</button>
            ))}
          </div>
          {tab==="guide"&&<div className="top-right" style={{display:"flex",gap:8,marginLeft:"auto",alignItems:"center"}}>
            <div style={{position:"relative",width:180}}>
              <span style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",color:"#475569",fontSize:13}}>⌕</span>
              <input style={{width:"100%",padding:"5px 26px 5px 26px",background:"#1e293b",border:"1px solid #334155",borderRadius:6,color:"#e2e8f0",fontSize:11.5,fontFamily:"'Outfit',sans-serif",outline:"none"}} placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}/>
              {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:5,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#64748b",cursor:"pointer",fontSize:11}}>✕</button>}
            </div>
            <select style={{background:"#1e293b",border:"1px solid #334155",borderRadius:6,color:"#e2e8f0",fontSize:11.5,padding:"5px 6px",fontFamily:"'Outfit',sans-serif",outline:"none",cursor:"pointer"}} value={levelFilter} onChange={e=>setLevelFilter(e.target.value)}>
              <option value="all">All Levels</option>
              {Object.entries(LEVEL_COLORS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>}
        </div>

        <div className="content-area" style={{flex:1,overflow:"auto",padding:"18px 22px 60px"}}>

          {/* GUIDE */}
          {tab==="guide"&&<div>
            {filtSections.length===0&&<div style={{textAlign:"center",padding:80}}><span style={{fontSize:48}}>🔍</span><p style={{color:"#64748b",marginTop:12}}>No topics found.</p></div>}
            {filtSections.map(section=>(
              <div key={section.id} id={`s-${section.id}`} style={{marginBottom:32}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,paddingBottom:10,borderBottom:"1px solid #1e293b"}}>
                  <span style={{fontSize:24}}>{section.icon}</span>
                  <div style={{flex:1}}><h2 style={{fontSize:18,fontWeight:700,color:"#f8fafc"}}>{section.title}</h2><p style={{fontSize:11,color:"#64748b",marginTop:1}}>{section.subtitle}</p></div>
                  <span style={{fontSize:10,fontFamily:"'JetBrains Mono',monospace",color:"#64748b",background:"#1e293b",padding:"3px 8px",borderRadius:6,fontWeight:600}}>{sDone(section)}/{section.topics.length}</span>
                </div>
                {section.topics.map(topic=>{
                  const isDone=checked[topic.id], isOpen=expanded[topic.id]!==false, showCode=codeOpen[topic.id], lv=LEVEL_COLORS[topic.level];
                  return(
                    <div key={topic.id} style={{background:isDone?"#0b1a14":"#111827",border:`1px solid ${isDone?"#065f46":"#1e293b"}`,borderRadius:11,marginBottom:7,overflow:"hidden",transition:"all .25s"}}>
                      <div onClick={()=>setExpanded(p=>({...p,[topic.id]:!isOpen}))} style={{display:"flex",alignItems:"center",gap:9,padding:"12px 14px",cursor:"pointer"}}>
                        <button onClick={e=>{e.stopPropagation();setChecked(p=>({...p,[topic.id]:!isDone}))}} style={{width:21,height:21,minWidth:21,borderRadius:6,border:`2px solid ${isDone?"#f59e0b":"#334155"}`,background:isDone?"linear-gradient(135deg,#f59e0b,#d97706)":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0,transition:"all .2s"}}>
                          {isDone&&<svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2.5 7.5L5.5 10.5L11.5 3.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </button>
                        <h3 style={{flex:1,fontSize:13.5,fontWeight:600,color:isDone?"#34d399":"#f1f5f9",lineHeight:1.4}}>{topic.title}</h3>
                        <span style={{fontSize:8.5,fontWeight:700,padding:"2px 6px",borderRadius:4,textTransform:"uppercase",letterSpacing:".04em",background:lv.bg,color:lv.text,border:`1px solid ${lv.border}`,flexShrink:0}}>{lv.label}</span>
                        <span style={{color:"#475569",fontSize:11,width:16,textAlign:"center"}}>{isOpen?"▾":"▸"}</span>
                      </div>
                      {isOpen&&<div style={{padding:"0 14px 14px 44px",animation:"fadeUp .2s ease"}}>
                        <div style={{background:"#0c1425",border:"1px solid #1e293b",borderRadius:9,padding:"12px 14px",marginBottom:8}}>
                          <div style={{fontSize:10,fontWeight:700,color:"#60a5fa",textTransform:"uppercase",letterSpacing:".06em",marginBottom:7}}>📘 Explanation</div>
                          {topic.explanation.split("\n").map((l,i)=><span key={i}>{renderLine(l,"explain")}</span>)}
                        </div>
                        {topic.production&&<div style={{background:"#1a1308",border:"1px solid #854d0e44",borderRadius:9,padding:"12px 14px",marginBottom:8}}>
                          <div style={{fontSize:10,fontWeight:700,color:"#fbbf24",textTransform:"uppercase",letterSpacing:".06em",marginBottom:7}}>🏭 Real Production Examples</div>
                          {topic.production.split("\n").map((l,i)=><span key={i}>{renderLine(l.replace(/^🏭\s*/,""),"prod")}</span>)}
                        </div>}
                        {topic.code&&<div>
                          <button onClick={()=>setCodeOpen(p=>({...p,[topic.id]:!showCode}))} style={{background:"transparent",border:"1px solid #1e293b",borderRadius:5,color:"#f59e0b",fontSize:10.5,fontFamily:"'JetBrains Mono',monospace",padding:"3px 10px",cursor:"pointer",fontWeight:600,marginBottom:5}}>{showCode?"▾ Hide Code":"▸ Show Code"}</button>
                          {showCode&&<pre style={{padding:"12px 14px",background:"#080c15",border:"1px solid #1e293b",borderRadius:7,overflow:"auto",fontSize:11,lineHeight:1.7,fontFamily:"'JetBrains Mono',monospace",color:"#8be9fd",maxHeight:400}}><code>{topic.code}</code></pre>}
                        </div>}
                      </div>}
                    </div>
                  );
                })}
              </div>
            ))}
            <div style={{textAlign:"center",padding:"36px 20px"}}><div style={{fontSize:38,marginBottom:6}}>🚀</div><div style={{fontSize:18,fontWeight:700,color:"#f8fafc"}}>Good luck on Monday!</div><div style={{fontSize:13,color:"#64748b",marginTop:3}}>{pct===100?"All reviewed — you're ready!":`${total-done} topics left`}</div></div>
          </div>}

          {/* SELECTOR */}
          {tab==="selector"&&<div style={{maxWidth:640,margin:"0 auto",padding:"16px 0"}}>
            <h2 style={{fontSize:22,fontWeight:800,color:"#f8fafc",marginBottom:2}}>🧭 Which Database Should I Use?</h2>
            <p style={{color:"#94a3b8",fontSize:13,marginBottom:24}}>Answer 5 simple questions. Get a real recommendation with reasoning.</p>
            {!wizResult?<div>
              <div style={{display:"flex",gap:5,marginBottom:20}}>{WIZ_QS.map((_,i)=><div key={i} style={{flex:1,height:3.5,borderRadius:2,background:i<wizStep?"#f59e0b":i===wizStep?"#fbbf24":"#1e293b",transition:"background .3s"}}/>)}</div>
              <div style={{background:"#111827",border:"1px solid #1e293b",borderRadius:12,padding:20}}>
                <div style={{fontSize:11,color:"#64748b",fontFamily:"'JetBrains Mono',monospace",marginBottom:6}}>Q{wizStep+1}/{WIZ_QS.length}</div>
                <h3 style={{fontSize:16,fontWeight:700,color:"#f8fafc",marginBottom:16}}>{WIZ_QS[wizStep].q}</h3>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {WIZ_QS[wizStep].opts.map((o,i)=>(
                    <button key={i} onClick={()=>{const n=[...wizAns,o.val];setWizAns(n);if(wizStep<WIZ_QS.length-1)setWizStep(wizStep+1);}} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 13px",background:"#0f1629",border:"1px solid #1e293b",borderRadius:9,color:"#e2e8f0",fontSize:13,fontFamily:"'Outfit',sans-serif",cursor:"pointer",textAlign:"left",width:"100%",lineHeight:1.5}}>
                      <span style={{width:24,height:24,borderRadius:6,background:"#1e293b",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#f59e0b",flexShrink:0,fontFamily:"'JetBrains Mono',monospace"}}>{String.fromCharCode(65+i)}</span>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              {wizStep>0&&<button onClick={()=>{setWizStep(wizStep-1);setWizAns(wizAns.slice(0,-1))}} style={{background:"transparent",border:"1px solid #1e293b",borderRadius:7,color:"#94a3b8",fontSize:12,padding:"7px 14px",cursor:"pointer",fontFamily:"'Outfit',sans-serif",marginTop:10}}>← Back</button>}
            </div>:<div>
              <div style={{background:"linear-gradient(135deg,#1a2744,#111827)",border:"1px solid #1e3a5f",borderRadius:12,padding:20,marginBottom:12}}>
                <div style={{fontSize:11,color:"#60a5fa",fontWeight:600,textTransform:"uppercase",letterSpacing:".08em",marginBottom:14}}>🎯 Recommendation</div>
                {wizResult.map((r,i)=>(
                  <div key={i} style={{background:i===0?"#0f1629":"#111827",border:`1px solid ${i===0?"#f59e0b44":"#1e293b"}`,borderRadius:10,padding:"14px 16px",marginBottom:8}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                      <span style={{fontSize:24}}>{r.icon}</span>
                      <span style={{fontSize:17,fontWeight:700,color:i===0?"#f59e0b":"#e2e8f0"}}>{r.db}</span>
                      {i===0&&<span style={{background:"#f59e0b22",color:"#f59e0b",fontSize:9,padding:"2px 7px",borderRadius:5,fontWeight:700,textTransform:"uppercase"}}>Primary Pick</span>}
                    </div>
                    <p style={{color:"#cbd5e1",fontSize:13,lineHeight:1.7,marginBottom:4}}>{r.why}</p>
                    {r.tip&&<p style={{color:"#64748b",fontSize:12,lineHeight:1.6,fontStyle:"italic"}}>💡 {r.tip}</p>}
                  </div>
                ))}
              </div>
              <button onClick={()=>{setWizStep(0);setWizAns([])}} style={{background:"transparent",border:"1px solid #1e293b",borderRadius:7,color:"#94a3b8",fontSize:12,padding:"7px 14px",cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>↻ Start Over</button>
            </div>}
          </div>}

          {/* CHEAT SHEET */}
          {tab==="cheatsheet"&&<div style={{maxWidth:640,margin:"0 auto",padding:"16px 0"}}>
            <h2 style={{fontSize:22,fontWeight:800,color:"#f8fafc",marginBottom:2}}>⚡ Rapid-Fire Cheat Sheet</h2>
            <p style={{color:"#94a3b8",fontSize:13,marginBottom:20}}>Click any question to reveal the one-liner answer. Perfect for speed rounds.</p>
            {CHEAT.map((c,i)=><CheatCard key={i} item={c}/>)}
          </div>}

        </div>
      </main>
    </div>
  );
}

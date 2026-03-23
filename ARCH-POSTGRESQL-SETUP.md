# Arch Linux PostgreSQL Setup

## Problem

You have `postgresql-libs` installed but NOT `postgresql` (the server package).

## Solution

### Step 1: Install PostgreSQL Server

```bash
sudo pacman -S postgresql
```

This will install:
- PostgreSQL server
- Systemd service files
- Data initialization tools

### Step 2: Initialize PostgreSQL Data Directory

```bash
# Stop PostgreSQL if it's partially running
sudo systemctl stop postgresql 2>/dev/null || true

# Remove broken data directory
sudo rm -rf /var/lib/postgres/data

# Initialize PostgreSQL data directory
sudo -u postgres initdb --locale=C.UTF-8 -D /var/lib/postgres/data

# Start PostgreSQL service
sudo systemctl start postgresql

# Enable PostgreSQL to start on boot
sudo systemctl enable postgresql

# Verify PostgreSQL is running
sudo systemctl status postgresql
```

Expected output:
```
● postgresql.service - active (running)
```

### Step 3: Create Database and User

```bash
# Create your database
sudo -u postgres createdb ai_spec_breakdown

# Or create a database with your username (recommended)
createdb ai_spec_breakdown
```

### Step 4. Test PostgreSQL Connection

```bash
# Test with postgres user
psql -h localhost -d ai_spec_breakdown

# Or test with your own user
psql -h localhost -d ai_spec_breakdown
```

### Step 5: Run Database Schema

```bash
psql -h localhost -d ai_spec_breakdown -f backend/src/database/schema.sql
```

### Step 6: Verify Tables Were Created

```bash
psql -h localhost -d ai_spec_breakdown -c "\dt"
```

You should see all tables:
- users
- projects
- specification_documents
- suggestion_batches
- generated_tasks
- audit_events
- jira_connections

### Step 7: Update Backend .env

Edit `/home/tn/projects/CS485-P2/backend/.env`:

```bash
cd /home/tn/projects/CS485-P2/backend
nano .env
```

Set:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_spec_breakdown
DB_USER=postgres
DB_PASSWORD=postgres
```

**Note**: If you created the database with your own username, update `DB_USER` accordingly.

### Step 8: Test Backend Connection

```bash
cd /home/tn/projects/CS485-P2/backend
node --test tests/structure-verification.test.js
```

All tests should pass!

---

## Start the Backend

```bash
cd /home/tn/projects/CS485-P2/backend
npm run dev
```

You should see:
```
✓ Database connected successfully
╔═══════════════════════════════════════════════════════╗
║   AI Specification Breakdown API                      ║
╠═════════════════════════════════════════════════════╣
║   Environment: development                    ║
║   Port: 3001                                      ║
║   URL: http://localhost:3001                   ║
║   Database: ✓ Connected                              ║
╚═══════════════════════════════════════════════════════╝
```

---

## Troubleshooting

### Error: "initdb: directory \"/var/lib/postgres/data\" exists but is not empty"

```bash
# Stop PostgreSQL
sudo systemctl stop postgresql

# Remove existing data
sudo rm -rf /var/lib/postgres/data/*

# Reinitialize
sudo -u postgres initdb --locale=C.UTF-8 -D /var/lib/postgres/data

# Start PostgreSQL
sudo systemctl start postgresql
```

### Error: "FATAL: could not create shared memory segment"

This usually means PostgreSQL is already running. Stop it first:

```bash
sudo systemctl stop postgresql
sudo systemctl start postgresql
```

### Error: "could not connect to server: Connection refused"

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# If not running, start it
sudo systemctl start postgresql

# Check if port 5432 is open
netstat -tuln | grep 5432
```

---

## Alternative: User-Space PostgreSQL

If system-wide PostgreSQL gives you trouble, run PostgreSQL in your user directory:

```bash
# Create data directory in your home
mkdir -p ~/postgresql/data

# Initialize PostgreSQL in your home directory
initdb -D ~/postgresql/data

# Start PostgreSQL manually
pg_ctl -D ~/postgresql/data -l ~/postgresql/log start

# Stop when done
pg_ctl -D ~/postgresql/data -l ~/postgresql/log stop

# Start with custom config:
pg_ctl -D ~/postgresql/data -o "-k ~/postgresql/data" start
```

Then update backend `.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_spec_breakdown
DB_USER=your_username
DB_PASSWORD=your_password
```

---

## Post-Setup Checklist

- [ ] Installed `postgresql` package (not just `postgresql-libs`)
- [ ] Initialized PostgreSQL data directory
- [ ] PostgreSQL service is running (`systemctl status postgresql`)
- [ ] Created `ai_spec_breakdown` database
- [ ] Ran schema (`psql ... -f backend/src/database/schema.sql`)
- [ ] Verified tables exist (`\dt` command)
- [ ] Updated backend `.env` with database credentials
- [ ] Backend connects successfully
- [ ] All tests pass

---

## What's Different

| Component | Old (Broken) | New (Fixed) |
|-----------|--------------|------------|
| **Package** | `postgresql-libs` only | `postgresql` + `postgresql-libs` |
| **Server** | Not installed | ✅ Installed |
| **Service** | Not available | ✅ systemd postgresql.service |
| **Data Dir** | Not initialized | ✅ Initialized with initdb |
| **Auto-start** | No | ✅ Enabled with systemctl |

---

## Next Steps

Once PostgreSQL is working:

1. ✅ Database is running
2. ✅ Database `ai_spec_breakdown` exists
3. ✅ Schema is loaded
4. ✅ Backend `.env` is configured
5. ✅ Backend starts successfully
6. ✅ AI integration works with your API key

Then:
7. Start frontend: `cd ../frontend && npm run dev`
8. Open browser: http://localhost:5173
9. Test AI-powered issue generation!

---

**You're almost there!** Just install the `postgresql` package, initialize the data directory, and you'll be all set up. 🚀

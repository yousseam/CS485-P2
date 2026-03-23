# PostgreSQL Troubleshooting Guide

## Problem

PostgreSQL is failing to start with error:
```
/var/lib/postgres/data" is missing or empty
```

And:
```
systemctl status postgresql.service: Control process exited, code=exite
```

## Diagnosis

This is a **PostgreSQL data directory initialization issue**. The database cluster needs to be initialized.

---

## Solution Options

### Option 1: Reinitialize PostgreSQL Data Directory (Recommended)

You'll need `sudo` access for this:

```bash
# 1. Stop PostgreSQL service (if running)
sudo systemctl stop postgresql

# 2. Remove the existing (broken) data directory
sudo rm -rf /var/lib/postgres/data

# 3. Reinitialize PostgreSQL data directory
sudo -u postgres initdb --locale=C.UTF-8 -D /var/lib/postgres/data

# 4. Start PostgreSQL service
sudo systemctl start postgresql

# 5. Verify PostgreSQL is running
sudo systemctl status postgresql
```

Expected output should show:
```
● postgresql.service - active (running)
```

### Option 2: Use PostgreSQL in User Home Directory (Simpler Alternative)

If you prefer to avoid system-wide PostgreSQL, you can run PostgreSQL from your home directory:

```bash
# 1. Create a data directory in your home
mkdir -p ~/postgresql/data

# 2. Initialize PostgreSQL cluster in home directory
initdb -D ~/postgresql/data

# 3. Start PostgreSQL manually
pg_ctl -D ~/postgresql/data -l ~/postgresql/log start

# 4. Stop PostgreSQL when done
pg_ctl -D ~/postgresql/data -l ~/postgresql/log stop
```

Then update your backend `.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_spec_breakdown
DB_USER=postgres
DB_PASSWORD=postgres
```

**Note**: When running PostgreSQL this way, you'll need to manually start it each time you want to use the backend.

### Option 3: Check for Arch-Specific PostgreSQL Issues

On Arch Linux, sometimes there are package conflicts:

```bash
# Check which PostgreSQL packages are installed
pacman -Qs postgresql postgresql-libs

# Remove both if there are conflicts
sudo pacman -Rdd postgresql postgresql-libs

# Reinstall PostgreSQL
sudo pacman -S postgresql postgresql-libs postgresql-upgrade

# Initialize PostgreSQL
sudo -u postgres initdb -D /var/lib/postgres/data

# Start PostgreSQL
sudo systemctl start postgresql

# Enable PostgreSQL to start on boot
sudo systemctl enable postgresql
```

---

## Alternative: Use SQLite for Testing

If you're having persistent PostgreSQL issues and just want to test the backend, we can temporarily switch to SQLite.

**This would require:**
1. Installing `sqlite3` package: `npm install sqlite3`
2. Modifying `src/database/connection.js` to use SQLite
3. Updating the schema to work with SQLite

**Not recommended for production**, but fine for testing.

---

## Quick Test: Can You Connect to PostgreSQL?

Try connecting without creating the database:

```bash
psql -U postgres -h localhost
```

If this works, the issue is just with the data directory initialization. If it fails with authentication issues, that's a separate problem.

---

## After Fixing PostgreSQL

Once PostgreSQL is running:

### 1. Create Database

```bash
psql -U postgres -h localhost -c "CREATE DATABASE ai_spec_breakdown;"
```

### 2. Run Schema

```bash
psql -U postgres -h localhost -d ai_spec_breakdown -f src/database/schema.sql
```

### 3. Verify Database

```bash
psql -U postgres -h localhost -d ai_spec_breakdown -c "\dt"
```

You should see all the tables:
- users
- projects
- specification_documents
- suggestion_batches
- generated_tasks
- audit_events
- jira_connections

### 4. Start Backend

```bash
cd /home/tn/projects/CS485-P2/backend
npm run dev
```

---

## Recommended Approach

**I recommend Option 1** (reinitialize data directory) because:

1. It's the standard solution for Arch Linux
2. It gives you a system-wide PostgreSQL service
3. PostgreSQL starts automatically on boot
4. You don't need to manually start/stop it
5. Multiple applications can use the same PostgreSQL instance

---

## Verify Fix Worked

After fixing PostgreSQL, run the start script:

```bash
cd /home/tn/projects/CS485-P2
./start.sh
```

The script should now show:
```
✓ Database 'ai_spec_breakdown' exists
✓ Schema loaded
✓ Backend started successfully (PID: ...)
```

---

## If All Else Fails

Create a Docker-based PostgreSQL container:

```bash
# Create a docker-compose.yml file
cat > docker-compose.yml << EOF
version: '3'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: ai_spec_breakdown
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
volumes:
  postgres_data:

# Start PostgreSQL in Docker
docker-compose up -d

# Stop PostgreSQL in Docker
docker-compose down
```

Then update backend `.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_spec_breakdown
DB_USER=postgres
DB_PASSWORD=postgres
```

This isolates PostgreSQL from the system and avoids system-wide conflicts.

---

## Next Steps

Once PostgreSQL is fixed:

1. ✅ Verify PostgreSQL is running
2. ✅ Create database and run schema
3. ✅ Update backend `.env` with database credentials
4. ✅ Start backend with `npm run dev`
5. ✅ Start frontend in new terminal
6. ✅ Test AI integration with a real API key

---

## Need Help?

If you're still stuck, tell me:
1. Do you have sudo access?
2. What's your Linux distribution? (Arch, Ubuntu, etc.)
3. Which PostgreSQL package is installed? (`pacman -Qs postgresql`)
4. What errors are you seeing?

I'll provide more specific guidance based on your answers!

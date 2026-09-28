# Training Portal Database Setup

This directory contains database schemas, migrations, and seed scripts.

## Directory Structure
- `schema/`: Full DDL SQL schema definition (`schema.sql`).
- `migrations/`: Schema migration scripts.
- `seeds/`: Initial data seeding scripts.

## Database Initialization
The backend server (`Backend/src/config/init_db.js`) automatically initializes and updates database tables on startup.

Alternatively, you can load the schema manually into MySQL:

```bash
mysql -u root -p training_portal_db < database/schema/schema.sql
```

## Seeding Sample Data
To populate sample coding problems and test data:

```bash
cd Backend
npm run import:c2c
```

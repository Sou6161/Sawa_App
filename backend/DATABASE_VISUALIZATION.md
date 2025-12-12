# Database Visualization Guide

There are several ways to visualize and manage your PostgreSQL database. Here are the best options:

## 🎨 Prisma Studio (Recommended - Already Set Up!)

**Prisma Studio** is a visual database browser built into Prisma. It's the easiest way to view and edit your database.

### How to Use:

1. **Start Prisma Studio:**
   ```bash
   cd backend
   npm run db:studio
   ```

2. **Open in Browser:**
   - Prisma Studio will automatically open at: `http://localhost:5555`
   - If it doesn't open automatically, manually navigate to that URL

3. **Features:**
   - ✅ View all tables and data
   - ✅ Add, edit, and delete records
   - ✅ Filter and search data
   - ✅ See relationships between tables
   - ✅ No installation needed - it's built into Prisma!

### Quick Access:
```bash
# From project root
cd backend && npm run db:studio

# Or add to root package.json for easier access
npm run db:studio
```

---

## 🗄️ Alternative Options

### 1. pgAdmin (Full-Featured PostgreSQL Tool)

**Installation:**
```bash
# macOS
brew install --cask pgadmin4

# Or download from: https://www.pgadmin.org/download/
```

**Connection Settings:**
- Host: `localhost`
- Port: `5432`
- Database: `sawa_db`
- Username: `sourabh` (or your PostgreSQL username)
- Password: (leave empty if no password set)

**Features:**
- Full PostgreSQL administration
- Query editor
- Database design tools
- Backup/restore functionality

---

### 2. DBeaver (Universal Database Tool)

**Installation:**
```bash
# macOS
brew install --cask dbeaver-community

# Or download from: https://dbeaver.io/download/
```

**Connection Settings:**
- Database: PostgreSQL
- Host: `localhost`
- Port: `5432`
- Database: `sawa_db`
- Username: `sourabh`
- Password: (leave empty if no password set)

**Features:**
- Works with many database types
- Great for complex queries
- Data export/import
- ER diagrams

---

### 3. TablePlus (Beautiful & Fast)

**Installation:**
```bash
# macOS
brew install --cask tableplus

# Or download from: https://tableplus.com/
```

**Connection Settings:**
- Database Type: PostgreSQL
- Name: `Sawa DB`
- Host: `localhost`
- Port: `5432`
- User: `sourabh`
- Database: `sawa_db`
- Password: (leave empty)

**Features:**
- Beautiful, modern interface
- Fast and lightweight
- Great for quick data viewing
- Paid app (free trial available)

---

### 4. VS Code Extensions

If you use VS Code, you can install database extensions:

**Extensions:**
- **PostgreSQL** by Chris Kolkman
- **SQLTools** by Matheus Teixeira
- **Database Client** by Weijan Chen

**Features:**
- View databases directly in VS Code
- Run queries
- View table structures
- No separate app needed

---

## 🚀 Quick Start with Prisma Studio

Since Prisma Studio is already set up, here's the quickest way to use it:

```bash
# Terminal 1: Keep your backend server running
cd backend
npm run dev

# Terminal 2: Start Prisma Studio
cd backend
npm run db:studio
```

Then open `http://localhost:5555` in your browser!

---

## 📊 What You Can Do in Prisma Studio

1. **View Tables:** Click on any table name to see all records
2. **Add Records:** Click the "+" button to add new rows
3. **Edit Records:** Click on any cell to edit values
4. **Delete Records:** Select rows and press Delete
5. **Filter Data:** Use the filter icon to search/filter
6. **View Relationships:** See how tables are connected

---

## 💡 Pro Tips

- **Keep Prisma Studio Open:** It's lightweight and won't slow down your development
- **Use Filters:** When you have lots of data, use filters to find what you need
- **Check Relationships:** Prisma Studio shows foreign key relationships visually
- **Export Data:** You can copy data directly from Prisma Studio

---

## 🔧 Troubleshooting

**Prisma Studio won't start:**
- Make sure your backend `.env` file has the correct `DATABASE_URL`
- Ensure PostgreSQL is running: `pg_isready`
- Check if port 5555 is already in use

**Can't see tables:**
- Make sure you've run migrations: `npm run db:push` or `npm run db:migrate`
- Check that your Prisma schema matches your database

**Connection errors:**
- Verify DATABASE_URL in `.env` file
- Test connection: `psql -d sawa_db -c "SELECT 1;"`

---

**Recommended:** Start with **Prisma Studio** - it's already set up and perfect for your needs! 🎉


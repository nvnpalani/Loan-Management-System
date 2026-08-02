const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = process.env.DB_PATH || path.join(__dirname, "loan.db");
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Database connection failed:", err.message);
    } else {
        console.log("Database connected successfully at:", dbPath);
    }
});
db.serialize(() => {
db.run(`
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id TEXT UNIQUE,
    name TEXT NOT NULL,
    area TEXT,
    phone TEXT NOT NULL,
    address TEXT,
    loan_amount REAL DEFAULT 0,
    collected_amount REAL DEFAULT 0,
    pending_amount REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`, (err) => {
    if (err) {
        console.log("Customer table creation failed:", err.message);
    } else {
        console.log("Customers table ready.");
    }
});


db.run(`
CREATE TABLE IF NOT EXISTS collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    collection_id TEXT UNIQUE,
    customer_id TEXT NOT NULL,
    collection_date TEXT NOT NULL,
    amount REAL NOT NULL,
    remarks TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(customer_id) REFERENCES customers(customer_id)
)
`, (err) => {
    if (err) {
        console.log("Collections table creation failed:", err.message);
    } else {
        console.log("Collections table ready.");
    }
});

// For existing customers table, we might need to add interest and employee_id if they don't exist
// This is a safe way to add columns if they are missing
db.run("ALTER TABLE customers ADD COLUMN interest REAL DEFAULT 0", (err) => {
    // Ignore error if column already exists
});
db.run("ALTER TABLE customers ADD COLUMN password TEXT DEFAULT 'cus123'", (err) => {
    // Ignore error if column already exists
});
db.run("ALTER TABLE customers ADD COLUMN pending_days INTEGER DEFAULT 0", (err) => {
    // Ignore error if column already exists
});
db.run("ALTER TABLE customers ADD COLUMN work TEXT", (err) => {});
db.run("ALTER TABLE customers ADD COLUMN photo TEXT", (err) => {});
db.run("ALTER TABLE customers ADD COLUMN document TEXT", (err) => {});
db.run("ALTER TABLE customers ADD COLUMN start_date TEXT", (err) => {});
db.run("ALTER TABLE customers ADD COLUMN duration TEXT", (err) => {});

// Alter collections table for status and payment_mode
db.run("ALTER TABLE collections ADD COLUMN status TEXT DEFAULT 'Paid'", (err) => {
    // Ignore error if column already exists
});
db.run("ALTER TABLE collections ADD COLUMN payment_mode TEXT", (err) => {
    // Ignore error if column already exists
});
db.run("ALTER TABLE collections ADD COLUMN employee_id TEXT", (err) => {
    // Ignore error if column already exists
});



db.run(`
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_name TEXT NOT NULL,
    action TEXT NOT NULL,
    table_name TEXT,
    record_id TEXT,
    old_value TEXT,
    new_value TEXT,
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`, (err) => {
    if (err) console.log("Audit Logs table creation failed:", err.message);
    else console.log("Audit Logs table ready.");
});

// Loans table completely removed

db.run(`
CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    expense_id TEXT UNIQUE,
    date TEXT NOT NULL,
    category TEXT,
    description TEXT,
    amount REAL NOT NULL,
    paid_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`, (err) => {
    if (err) console.log("Expenses table creation failed:", err.message);
    else console.log("Expenses table ready.");
});

db.run(`
CREATE TABLE IF NOT EXISTS revenues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    revenue_id TEXT UNIQUE,
    date TEXT NOT NULL,
    source TEXT,
    description TEXT,
    amount REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`, (err) => {
    if (err) console.log("Revenues table creation failed:", err.message);
    else console.log("Revenues table ready.");
});

db.run(`
CREATE TABLE IF NOT EXISTS investors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    investor_id TEXT UNIQUE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    investment_amount REAL NOT NULL,
    profit_percent REAL,
    profit_paid REAL DEFAULT 0,
    status TEXT DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`, (err) => {
    if (err) console.log("Investors table creation failed:", err.message);
    else console.log("Investors table ready.");
});

// Cleanup orphaned collections left by previous deletes
db.run("DELETE FROM collections WHERE customer_id NOT IN (SELECT customer_id FROM customers)", (err) => {
    if (err) console.log("Error cleaning up orphaned collections:", err.message);
});

});

module.exports = db;
/**
 * Database Initialization Script
 * 
 * This script creates the SQLite database and sets up the necessary tables
 * for user authentication and message persistence.
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database file path
const dbPath = path.join(__dirname, '../../data/broadcast.db');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Create database connection
const db = new sqlite3.Database(dbPath);

console.log('🗄️  Initializing database...');

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Create users table
db.run(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE,
        password_hash TEXT NOT NULL,
        display_name TEXT,
        avatar_url TEXT,
        is_online BOOLEAN DEFAULT 0,
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`, (err) => {
    if (err) {
        console.error('❌ Error creating users table:', err.message);
    } else {
        console.log('✅ Users table created successfully');
    }
});

// Create messages table
db.run(`
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        message_type TEXT DEFAULT 'broadcast',
        room_id TEXT DEFAULT 'main',
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_edited BOOLEAN DEFAULT 0,
        edited_at TIMESTAMP,
        is_deleted BOOLEAN DEFAULT 0,
        deleted_at TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users (id)
    )
`, (err) => {
    if (err) {
        console.error('❌ Error creating messages table:', err.message);
    } else {
        console.log('✅ Messages table created successfully');
    }
});

// Create user_sessions table for JWT token management
db.run(`
    CREATE TABLE IF NOT EXISTS user_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token_hash TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
`, (err) => {
    if (err) {
        console.error('❌ Error creating user_sessions table:', err.message);
    } else {
        console.log('✅ User sessions table created successfully');
    }
});

// Create indexes for better performance
db.run(`
    CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp)
`, (err) => {
    if (err) {
        console.error('❌ Error creating messages timestamp index:', err.message);
    } else {
        console.log('✅ Messages timestamp index created');
    }
});

db.run(`
    CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id)
`, (err) => {
    if (err) {
        console.error('❌ Error creating messages sender index:', err.message);
    } else {
        console.log('✅ Messages sender index created');
    }
});

db.run(`
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)
`, (err) => {
    if (err) {
        console.error('❌ Error creating users username index:', err.message);
    } else {
        console.log('✅ Users username index created');
    }
});

// Insert default admin user if no users exist
db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
    if (err) {
        console.error('❌ Error checking user count:', err.message);
    } else if (row.count === 0) {
        // Create default admin user
        const bcrypt = require('bcryptjs');
        const defaultPassword = 'admin123';
        const passwordHash = bcrypt.hashSync(defaultPassword, 10);
        
        db.run(`
            INSERT INTO users (username, password_hash, display_name, is_online)
            VALUES (?, ?, ?, 0)
        `, ['admin', passwordHash, 'Administrator'], (err) => {
            if (err) {
                console.error('❌ Error creating default admin user:', err.message);
            } else {
                console.log('✅ Default admin user created');
                console.log('   Username: admin');
                console.log('   Password: admin123');
                console.log('   ⚠️  Please change this password in production!');
            }
        });
    }
});

// Close database connection
db.close((err) => {
    if (err) {
        console.error('❌ Error closing database:', err.message);
    } else {
        console.log('✅ Database initialization completed successfully');
        console.log(`📁 Database file: ${dbPath}`);
    }
}); 
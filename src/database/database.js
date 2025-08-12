/**
 * Database Manager
 * 
 * This class handles all database operations including user management,
 * message persistence, and session management.
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class DatabaseManager {
    constructor() {
        this.dbPath = path.join(__dirname, '../../data/broadcast.db');
        this.db = null;
        this.isConnected = false;
    }

    /**
     * Connect to the database
     */
    connect() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('❌ Database connection error:', err.message);
                    reject(err);
                } else {
                    this.isConnected = true;
                    // Enable foreign keys
                    this.db.run('PRAGMA foreign_keys = ON');
                    console.log('✅ Database connected successfully');
                    resolve();
                }
            });
        });
    }

    /**
     * Close database connection
     */
    close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        console.error('❌ Error closing database:', err.message);
                        reject(err);
                    } else {
                        this.isConnected = false;
                        this.db = null;
                        console.log('✅ Database connection closed');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }

    /**
     * Execute a database query
     */
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                reject(new Error('Database not connected'));
                return;
            }

            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        lastID: this.lastID,
                        changes: this.changes
                    });
                }
            });
        });
    }

    /**
     * Get a single row from database
     */
    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                reject(new Error('Database not connected'));
                return;
            }

            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    /**
     * Get multiple rows from database
     */
    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                reject(new Error('Database not connected'));
                return;
            }

            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    /**
     * User Management Methods
     */

    /**
     * Create a new user
     */
    async createUser(userData) {
        const { username, passwordHash, email, displayName } = userData;
        
        try {
            const result = await this.run(`
                INSERT INTO users (username, password_hash, email, display_name, created_at, updated_at)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `, [username, passwordHash, email || null, displayName || username]);
            
            return result.lastID;
        } catch (error) {
            if (error.message.includes('UNIQUE constraint failed')) {
                throw new Error('Username already exists');
            }
            throw error;
        }
    }

    /**
     * Get user by username
     */
    async getUserByUsername(username) {
        return await this.get(`
            SELECT id, username, password_hash, email, display_name, avatar_url, 
                   is_online, last_seen, created_at, updated_at
            FROM users 
            WHERE username = ?
        `, [username]);
    }

    /**
     * Get user by ID
     */
    async getUserById(userId) {
        return await this.get(`
            SELECT id, username, password_hash, email, display_name, avatar_url, 
                   is_online, last_seen, created_at, updated_at
            FROM users 
            WHERE id = ?
        `, [userId]);
    }

    /**
     * Update user's online status
     */
    async updateUserOnlineStatus(userId, isOnline) {
        await this.run(`
            UPDATE users 
            SET is_online = ?, last_seen = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [isOnline ? 1 : 0, userId]);
    }

    /**
     * Update user's last seen timestamp
     */
    async updateUserLastSeen(userId) {
        await this.run(`
            UPDATE users 
            SET last_seen = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [userId]);
    }

    /**
     * Get all online users
     */
    async getOnlineUsers() {
        return await this.all(`
            SELECT id, username, display_name, avatar_url, last_seen
            FROM users 
            WHERE is_online = 1
            ORDER BY last_seen DESC
        `);
    }

    /**
     * Message Management Methods
     */

    /**
     * Save a message to database
     */
    async saveMessage(messageData) {
        const { senderId, content, messageType = 'broadcast', roomId = 'main' } = messageData;
        
        const result = await this.run(`
            INSERT INTO messages (sender_id, content, message_type, room_id, timestamp)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [senderId, content, messageType, roomId]);
        
        return result.lastID;
    }

    /**
     * Get recent messages for a room
     */
    async getRecentMessages(roomId = 'main', limit = 50, offset = 0) {
        return await this.all(`
            SELECT m.id, m.content, m.message_type, m.room_id, m.timestamp,
                   m.is_edited, m.edited_at, m.is_deleted,
                   u.username, u.display_name, u.avatar_url
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.room_id = ? AND m.is_deleted = 0
            ORDER BY m.timestamp DESC
            LIMIT ? OFFSET ?
        `, [roomId, limit, offset]);
    }

    /**
     * Get message by ID
     */
    async getMessageById(messageId) {
        return await this.get(`
            SELECT m.id, m.content, m.message_type, m.room_id, m.timestamp,
                   m.is_edited, m.edited_at, m.is_deleted,
                   u.username, u.display_name, u.avatar_url
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.id = ?
        `, [messageId]);
    }

    /**
     * Update a message (for editing)
     */
    async updateMessage(messageId, newContent) {
        await this.run(`
            UPDATE messages 
            SET content = ?, is_edited = 1, edited_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [newContent, messageId]);
    }

    /**
     * Soft delete a message
     */
    async deleteMessage(messageId) {
        await this.run(`
            UPDATE messages 
            SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [messageId]);
    }

    /**
     * Session Management Methods
     */

    /**
     * Create a new user session
     */
    async createSession(userId, tokenHash, expiresAt) {
        // Clean up expired sessions first
        await this.cleanupExpiredSessions();
        
        const result = await this.run(`
            INSERT INTO user_sessions (user_id, token_hash, expires_at, created_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `, [userId, tokenHash, expiresAt]);
        
        return result.lastID;
    }

    /**
     * Validate a session token
     */
    async validateSession(tokenHash) {
        const session = await this.get(`
            SELECT us.id, us.user_id, us.expires_at, u.username, u.display_name
            FROM user_sessions us
            JOIN users u ON us.user_id = u.id
            WHERE us.token_hash = ? AND us.expires_at > CURRENT_TIMESTAMP
        `, [tokenHash]);
        
        return session;
    }

    /**
     * Remove a session
     */
    async removeSession(tokenHash) {
        await this.run(`
            DELETE FROM user_sessions 
            WHERE token_hash = ?
        `, [tokenHash]);
    }

    /**
     * Clean up expired sessions
     */
    async cleanupExpiredSessions() {
        await this.run(`
            DELETE FROM user_sessions 
            WHERE expires_at <= CURRENT_TIMESTAMP
        `);
    }

    /**
     * Utility Methods
     */

    /**
     * Get database statistics
     */
    async getStats() {
        const userCount = await this.get('SELECT COUNT(*) as count FROM users');
        const messageCount = await this.get('SELECT COUNT(*) as count FROM messages WHERE is_deleted = 0');
        const onlineUsers = await this.get('SELECT COUNT(*) as count FROM users WHERE is_online = 1');
        
        return {
            totalUsers: userCount.count,
            totalMessages: messageCount.count,
            onlineUsers: onlineUsers.count
        };
    }

    /**
     * Initialize database tables (for testing)
     */
    async initializeTables() {
        // This method can be used to ensure tables exist
        // The main initialization is handled by init.js
        console.log('🗄️  Checking database tables...');
        
        try {
            await this.get('SELECT 1 FROM users LIMIT 1');
            await this.get('SELECT 1 FROM messages LIMIT 1');
            await this.get('SELECT 1 FROM user_sessions LIMIT 1');
            console.log('✅ All database tables are ready');
        } catch (error) {
            console.error('❌ Database tables not ready. Run: npm run init-db');
            throw error;
        }
    }
}

module.exports = DatabaseManager; 
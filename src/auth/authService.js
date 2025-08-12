/**
 * Authentication Service
 * 
 * This service handles user authentication including registration, login,
 * password hashing, JWT token generation and validation.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const DatabaseManager = require('../database/database.js');

class AuthService {
    constructor() {
        this.db = new DatabaseManager();
        this.jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
        this.jwtExpiry = '24h'; // Token expires in 24 hours
    }

    /**
     * Initialize the authentication service
     */
    async initialize() {
        try {
            await this.db.connect();
            await this.db.initializeTables();
            console.log('✅ Authentication service initialized');
        } catch (error) {
            console.error('❌ Failed to initialize authentication service:', error.message);
            throw error;
        }
    }

    /**
     * Register a new user
     */
    async registerUser(userData) {
        const { username, password, email, displayName } = userData;

        // Validate input
        if (!username || !password) {
            throw new Error('Username and password are required');
        }

        if (username.length < 3) {
            throw new Error('Username must be at least 3 characters long');
        }

        if (password.length < 6) {
            throw new Error('Password must be at least 6 characters long');
        }

        // Check if username already exists
        const existingUser = await this.db.getUserByUsername(username);
        if (existingUser) {
            throw new Error('Username already exists');
        }

        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Create user
        const userId = await this.db.createUser({
            username,
            passwordHash,
            email,
            displayName: displayName || username
        });

        // Generate JWT token
        const token = this.generateToken(userId, username);

        // Save session
        await this.db.createSession(userId, token, this.getExpiryDate());

        return {
            userId,
            username,
            displayName: displayName || username,
            token,
            message: 'User registered successfully'
        };
    }

    /**
     * Authenticate user login
     */
    async loginUser(credentials) {
        const { username, password } = credentials;

        // Validate input
        if (!username || !password) {
            throw new Error('Username and password are required');
        }

        // Get user from database
        const user = await this.db.getUserByUsername(username);
        if (!user) {
            throw new Error('Invalid username or password');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            throw new Error('Invalid username or password');
        }

        // Update user's online status and last seen
        await this.db.updateUserOnlineStatus(user.id, true);
        await this.db.updateUserLastSeen(user.id);

        // Generate JWT token
        const token = this.generateToken(user.id, user.username);

        // Save session
        await this.db.createSession(user.id, token, this.getExpiryDate());

        return {
            userId: user.id,
            username: user.username,
            displayName: user.display_name,
            email: user.email,
            avatarUrl: user.avatar_url,
            token,
            message: 'Login successful'
        };
    }

    /**
     * Validate JWT token and get user info
     */
    async validateToken(token) {
        try {
            // Verify JWT token
            const decoded = jwt.verify(token, this.jwtSecret);
            
            // Check if session exists in database
            const session = await this.db.validateSession(token);
            if (!session) {
                throw new Error('Session expired or invalid');
            }

            // Get user details
            const user = await this.db.getUserById(session.user_id);
            if (!user) {
                throw new Error('User not found');
            }

            return {
                userId: user.id,
                username: user.username,
                displayName: user.display_name,
                email: user.email,
                avatarUrl: user.avatar_url
            };
        } catch (error) {
            if (error.name === 'JsonWebTokenError') {
                throw new Error('Invalid token');
            } else if (error.name === 'TokenExpiredError') {
                throw new Error('Token expired');
            }
            throw error;
        }
    }

    /**
     * Logout user (invalidate session)
     */
    async logoutUser(token) {
        try {
            await this.db.removeSession(token);
            
            // Get user from token to update online status
            const userInfo = await this.validateToken(token);
            if (userInfo) {
                await this.db.updateUserOnlineStatus(userInfo.userId, false);
            }
            
            return { message: 'Logout successful' };
        } catch (error) {
            // Even if token validation fails, we still want to remove the session
            await this.db.removeSession(token);
            return { message: 'Logout successful' };
        }
    }

    /**
     * Change user password
     */
    async changePassword(userId, currentPassword, newPassword) {
        // Get user
        const user = await this.db.getUserById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isCurrentPasswordValid) {
            throw new Error('Current password is incorrect');
        }

        // Validate new password
        if (newPassword.length < 6) {
            throw new Error('New password must be at least 6 characters long');
        }

        // Hash new password
        const saltRounds = 10;
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

        // Update password in database
        await this.db.run(`
            UPDATE users 
            SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [newPasswordHash, userId]);

        return { message: 'Password changed successfully' };
    }

    /**
     * Update user profile
     */
    async updateProfile(userId, updates) {
        const allowedUpdates = ['display_name', 'email', 'avatar_url'];
        const updateFields = [];
        const updateValues = [];

        // Build update query dynamically
        for (const [key, value] of Object.entries(updates)) {
            if (allowedUpdates.includes(key) && value !== undefined) {
                updateFields.push(`${key} = ?`);
                updateValues.push(value);
            }
        }

        if (updateFields.length === 0) {
            throw new Error('No valid fields to update');
        }

        // Add updated_at timestamp
        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        updateValues.push(userId);

        const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
        await this.db.run(sql, updateValues);

        return { message: 'Profile updated successfully' };
    }

    /**
     * Get user profile
     */
    async getUserProfile(userId) {
        const user = await this.db.getUserById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Remove sensitive information
        const { password_hash, ...profile } = user;
        return profile;
    }

    /**
     * Generate JWT token
     */
    generateToken(userId, username) {
        const payload = {
            userId,
            username,
            iat: Math.floor(Date.now() / 1000)
        };

        return jwt.sign(payload, this.jwtSecret, { expiresIn: this.jwtExpiry });
    }

    /**
     * Get expiry date for database
     */
    getExpiryDate() {
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + 24); // 24 hours from now
        return expiryDate.toISOString();
    }

    /**
     * Refresh user session
     */
    async refreshSession(token) {
        try {
            const userInfo = await this.validateToken(token);
            
            // Generate new token
            const newToken = this.generateToken(userInfo.userId, userInfo.username);
            
            // Remove old session and create new one
            await this.db.removeSession(token);
            await this.db.createSession(userInfo.userId, newToken, this.getExpiryDate());
            
            return {
                ...userInfo,
                token: newToken,
                message: 'Session refreshed'
            };
        } catch (error) {
            throw new Error('Failed to refresh session');
        }
    }

    /**
     * Get online users
     */
    async getOnlineUsers() {
        return await this.db.getOnlineUsers();
    }

    /**
     * Clean up expired sessions
     */
    async cleanupExpiredSessions() {
        await this.db.cleanupExpiredSessions();
    }

    /**
     * Close database connection
     */
    async close() {
        await this.db.close();
    }
}

module.exports = AuthService; 
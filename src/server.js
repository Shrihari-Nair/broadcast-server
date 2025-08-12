/**
 * ============================================================================
 * ENHANCED BROADCAST SERVER IMPLEMENTATION
 * ============================================================================
 * 
 * This module contains the WebSocket server that creates a real-time messaging
 * system with user authentication and message persistence.
 * 
 * 🎯 WHAT THIS SERVER DOES:
 * 1. Listens for incoming client connections on a specified port
 * 2. Authenticates users using JWT tokens
 * 3. Stores all connected clients in memory with user information
 * 4. Broadcasts messages from one client to all other connected clients
 * 5. Persists messages to SQLite database
 * 6. Handles client connections and disconnections gracefully
 * 7. Provides system messages (welcome, join/leave notifications)
 * 8. Manages user online status and sessions
 * 
 * 🔑 NEW FEATURES:
 * - User authentication with JWT tokens
 * - Message persistence in SQLite database
 * - User profiles and online status
 * - Message history retrieval
 * - Enhanced client management
 */

// Import the WebSocket library
const WebSocket = require('ws');
const AuthService = require('./auth/authService.js');
const DatabaseManager = require('./database/database.js');

/**
 * ============================================================================
 * ENHANCED BROADCASTSERVER CLASS
 * ============================================================================
 * 
 * This class extends the original broadcast server with authentication
 * and message persistence capabilities.
 */
class BroadcastServer {
    
    /**
     * ============================================================================
     * CONSTRUCTOR - THE INITIALIZATION FUNCTION
     * ============================================================================
     * 
     * @param {number} port - The port number to listen on (default: 8080)
     */
    constructor(port = 8080) {
        // Store the port number for later use
        this.port = port;
        
        // Create a Map to store all connected clients with user information
        // Map<WebSocket, {userId, username, displayName, clientId}>
        this.clients = new Map();
        
        // Create a new WebSocket server instance
        this.wss = new WebSocket.Server({ port: this.port });
        
        // Initialize authentication service
        this.authService = new AuthService();
        this.db = new DatabaseManager();
        
        // Track server statistics
        this.stats = {
            totalConnections: 0,
            currentConnections: 0,
            totalMessages: 0
        };
        
        // Bind event handlers
        this.handleConnection = this.handleConnection.bind(this);
        this.handleMessage = this.handleMessage.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleError = this.handleError.bind(this);
        
        // Set up all the event listeners
        this.setupEventListeners();
        
        // Log that the server is starting
        console.log(`🚀 Enhanced broadcast server starting on port ${this.port}...`);
    }
    
    /**
     * ============================================================================
     * INITIALIZE - SETUP DATABASE AND AUTHENTICATION
     * ============================================================================
     */
    async initialize() {
        try {
            await this.authService.initialize();
            console.log('✅ Server initialization completed');
        } catch (error) {
            console.error('❌ Server initialization failed:', error.message);
            throw error;
        }
    }
    
    /**
     * ============================================================================
     * SETUP EVENT LISTENERS - THE "LISTENING" FUNCTION
     * ============================================================================
     */
    setupEventListeners() {
        // Listen for new client connections
        this.wss.on('connection', this.handleConnection);
        
        // Listen for server errors
        this.wss.on('error', this.handleError);
        
        console.log('📡 Server is listening for connections...');
    }
    
    /**
     * ============================================================================
     * HANDLE CONNECTION - WELCOMING NEW CLIENTS
     * ============================================================================
     * 
     * @param {WebSocket} ws - The WebSocket connection object for the new client
     * @param {Object} req - The HTTP request object (contains client info like IP address)
     */
    async handleConnection(ws, req) {
        // Get client information
        const clientAddress = req.socket.remoteAddress;
        const clientPort = req.socket.remotePort;
        const clientId = `${clientAddress}:${clientPort}`;
        
        console.log(`🔗 New connection attempt from: ${clientId}`);
        
        // Store connection info temporarily
        this.clients.set(ws, {
            clientId,
            isAuthenticated: false,
            userId: null,
            username: null,
            displayName: null,
            connectedAt: new Date()
        });
        
        // Send authentication request
        const authRequest = {
            type: 'auth_required',
            content: 'Please authenticate to join the chat',
            timestamp: new Date().toISOString()
        };
        
        ws.send(JSON.stringify(authRequest));
        
        // Set up client-specific event listeners
        this.setupClientEventListeners(ws, clientId);
        
        // Update statistics
        this.stats.totalConnections++;
        this.stats.currentConnections++;
    }
    
    /**
     * ============================================================================
     * SETUP CLIENT EVENT LISTENERS - PERSONAL ASSISTANTS FOR EACH CLIENT
     * ============================================================================
     * 
     * @param {WebSocket} ws - The WebSocket connection for this client
     * @param {string} clientId - Unique identifier for this client
     */
    setupClientEventListeners(ws, clientId) {
        // Listen for messages from this specific client
        ws.on('message', (data) => this.handleMessage(ws, data, clientId));
        
        // Listen for when this client disconnects
        ws.on('close', () => this.handleClose(ws, clientId));
        
        // Listen for errors from this client
        ws.on('error', (error) => this.handleError(error, clientId));
    }
    
    /**
     * ============================================================================
     * HANDLE MESSAGE - PROCESSING INCOMING MESSAGES
     * ============================================================================
     * 
     * @param {WebSocket} ws - The WebSocket connection that sent the message
     * @param {Buffer|string} data - The raw message data
     * @param {string} clientId - Identifier for the client that sent the message
     */
    async handleMessage(ws, data, clientId) {
        try {
            const messageText = data.toString().trim();
            
            if (!messageText) {
                return;
            }
            
            // Parse the message
            let message;
            try {
                message = JSON.parse(messageText);
            } catch (parseError) {
                // Handle plain text messages for backward compatibility
                message = {
                    type: 'text',
                    content: messageText
                };
            }
            
            const clientInfo = this.clients.get(ws);
            
            // Handle different message types
            switch (message.type) {
                case 'auth':
                    await this.handleAuthentication(ws, message, clientId);
                    break;
                    
                case 'register':
                    await this.handleRegistration(ws, message, clientId);
                    break;
                    
                case 'login':
                    await this.handleLogin(ws, message, clientId);
                    break;
                    
                case 'logout':
                    await this.handleLogout(ws, clientId);
                    break;
                    
                case 'get_history':
                    await this.handleGetHistory(ws, message, clientId);
                    break;
                    
                case 'get_online_users':
                    await this.handleGetOnlineUsers(ws, clientId);
                    break;
                    
                case 'broadcast':
                case 'text':
                    // Handle regular messages
                    if (clientInfo && clientInfo.isAuthenticated) {
                        await this.handleBroadcastMessage(ws, message, clientId);
                    } else {
                        this.sendError(ws, 'Authentication required to send messages');
                    }
                    break;
                    
                default:
                    this.sendError(ws, `Unknown message type: ${message.type}`);
            }
            
        } catch (error) {
            console.error(`❌ Error processing message from ${clientId}:`, error.message);
            this.sendError(ws, 'Failed to process your message');
        }
    }
    
    /**
     * ============================================================================
     * HANDLE AUTHENTICATION - PROCESSING AUTH MESSAGES
     * ============================================================================
     */
    async handleAuthentication(ws, message, clientId) {
        try {
            const { token } = message;
            
            if (!token) {
                this.sendError(ws, 'Authentication token required');
                return;
            }
            
            // Validate token
            const userInfo = await this.authService.validateToken(token);
            
            // Update client info
            const clientInfo = this.clients.get(ws);
            clientInfo.isAuthenticated = true;
            clientInfo.userId = userInfo.userId;
            clientInfo.username = userInfo.username;
            clientInfo.displayName = userInfo.displayName;
            
            // Update user's online status
            await this.authService.db.updateUserOnlineStatus(userInfo.userId, true);
            
            console.log(`✅ User ${userInfo.username} authenticated: ${clientId}`);
            
            // Send welcome message
            const welcomeMessage = {
                type: 'system',
                content: `Welcome ${userInfo.displayName}! You are now authenticated.`,
                timestamp: new Date().toISOString(),
                user: userInfo
            };
            
            ws.send(JSON.stringify(welcomeMessage));
            
            // Send recent message history
            await this.sendMessageHistory(ws);
            
            // Notify other clients
            this.broadcastToOthers(ws, {
                type: 'system',
                content: `${userInfo.displayName} has joined the chat`,
                timestamp: new Date().toISOString(),
                user: userInfo
            });
            
        } catch (error) {
            console.error(`❌ Authentication failed for ${clientId}:`, error.message);
            this.sendError(ws, 'Authentication failed: ' + error.message);
        }
    }
    
    /**
     * ============================================================================
     * HANDLE REGISTRATION - PROCESSING USER REGISTRATION
     * ============================================================================
     */
    async handleRegistration(ws, message, clientId) {
        try {
            const { username, password, email, displayName } = message;
            
            const result = await this.authService.registerUser({
                username,
                password,
                email,
                displayName
            });
            
            console.log(`✅ New user registered: ${username} from ${clientId}`);
            
            // Send success response
            const response = {
                type: 'auth_success',
                content: 'Registration successful',
                timestamp: new Date().toISOString(),
                user: {
                    userId: result.userId,
                    username: result.username,
                    displayName: result.displayName
                },
                token: result.token
            };
            
            ws.send(JSON.stringify(response));
            
            // Update client info
            const clientInfo = this.clients.get(ws);
            clientInfo.isAuthenticated = true;
            clientInfo.userId = result.userId;
            clientInfo.username = result.username;
            clientInfo.displayName = result.displayName;
            
            // Update user's online status
            await this.authService.db.updateUserOnlineStatus(result.userId, true);
            
            // Send message history
            await this.sendMessageHistory(ws);
            
            // Notify other clients
            this.broadcastToOthers(ws, {
                type: 'system',
                content: `${result.displayName} has joined the chat`,
                timestamp: new Date().toISOString(),
                user: response.user
            });
            
        } catch (error) {
            console.error(`❌ Registration failed for ${clientId}:`, error.message);
            this.sendError(ws, 'Registration failed: ' + error.message);
        }
    }
    
    /**
     * ============================================================================
     * HANDLE LOGIN - PROCESSING USER LOGIN
     * ============================================================================
     */
    async handleLogin(ws, message, clientId) {
        try {
            const { username, password } = message;
            
            const result = await this.authService.loginUser({
                username,
                password
            });
            
            console.log(`✅ User logged in: ${username} from ${clientId}`);
            
            // Send success response
            const response = {
                type: 'auth_success',
                content: 'Login successful',
                timestamp: new Date().toISOString(),
                user: {
                    userId: result.userId,
                    username: result.username,
                    displayName: result.displayName,
                    email: result.email,
                    avatarUrl: result.avatarUrl
                },
                token: result.token
            };
            
            ws.send(JSON.stringify(response));
            
            // Update client info
            const clientInfo = this.clients.get(ws);
            clientInfo.isAuthenticated = true;
            clientInfo.userId = result.userId;
            clientInfo.username = result.username;
            clientInfo.displayName = result.displayName;
            
            // Send message history
            await this.sendMessageHistory(ws);
            
            // Notify other clients
            this.broadcastToOthers(ws, {
                type: 'system',
                content: `${result.displayName} has joined the chat`,
                timestamp: new Date().toISOString(),
                user: response.user
            });
            
        } catch (error) {
            console.error(`❌ Login failed for ${clientId}:`, error.message);
            this.sendError(ws, 'Login failed: ' + error.message);
        }
    }
    
    /**
     * ============================================================================
     * HANDLE LOGOUT - PROCESSING USER LOGOUT
     * ============================================================================
     */
    async handleLogout(ws, clientId) {
        try {
            const clientInfo = this.clients.get(ws);
            
            if (clientInfo && clientInfo.isAuthenticated) {
                // Update user's online status
                await this.authService.db.updateUserOnlineStatus(clientInfo.userId, false);
                
                console.log(`👋 User logged out: ${clientInfo.username} from ${clientId}`);
                
                // Notify other clients
                this.broadcastToOthers(ws, {
                    type: 'system',
                    content: `${clientInfo.displayName} has left the chat`,
                    timestamp: new Date().toISOString(),
                    user: {
                        userId: clientInfo.userId,
                        username: clientInfo.username,
                        displayName: clientInfo.displayName
                    }
                });
            }
            
        } catch (error) {
            console.error(`❌ Logout error for ${clientId}:`, error.message);
        }
    }
    
    /**
     * ============================================================================
     * HANDLE GET HISTORY - SENDING MESSAGE HISTORY
     * ============================================================================
     */
    async handleGetHistory(ws, message, clientId) {
        try {
            const { roomId = 'main', limit = 50, offset = 0 } = message;
            
            const messages = await this.authService.db.getRecentMessages(roomId, limit, offset);
            
            const response = {
                type: 'message_history',
                content: 'Message history retrieved',
                timestamp: new Date().toISOString(),
                messages: messages.reverse(), // Show oldest first
                roomId,
                limit,
                offset
            };
            
            ws.send(JSON.stringify(response));
            
        } catch (error) {
            console.error(`❌ Error getting history for ${clientId}:`, error.message);
            this.sendError(ws, 'Failed to retrieve message history');
        }
    }
    
    /**
     * ============================================================================
     * HANDLE GET ONLINE USERS - SENDING ONLINE USER LIST
     * ============================================================================
     */
    async handleGetOnlineUsers(ws, clientId) {
        try {
            const onlineUsers = await this.authService.getOnlineUsers();
            
            const response = {
                type: 'online_users',
                content: 'Online users retrieved',
                timestamp: new Date().toISOString(),
                users: onlineUsers
            };
            
            ws.send(JSON.stringify(response));
            
        } catch (error) {
            console.error(`❌ Error getting online users for ${clientId}:`, error.message);
            this.sendError(ws, 'Failed to retrieve online users');
        }
    }
    
    /**
     * ============================================================================
     * HANDLE BROADCAST MESSAGE - PROCESSING REGULAR MESSAGES
     * ============================================================================
     */
    async handleBroadcastMessage(ws, message, clientId) {
        const clientInfo = this.clients.get(ws);
        const messageText = message.content || messageText;
        
        console.log(`📨 Message from ${clientInfo.username}: ${messageText}`);
        
        // Save message to database
        try {
            const messageId = await this.authService.db.saveMessage({
                senderId: clientInfo.userId,
                content: messageText,
                messageType: 'broadcast',
                roomId: 'main'
            });
            
            // Create message object
            const messageObject = {
                type: 'broadcast',
                content: messageText,
                timestamp: new Date().toISOString(),
                messageId: messageId,
                user: {
                    userId: clientInfo.userId,
                    username: clientInfo.username,
                    displayName: clientInfo.displayName
                }
            };
            
            // Broadcast to other clients
            this.broadcastToOthers(ws, messageObject);
            
            // Send confirmation to sender
            const confirmation = {
                type: 'confirmation',
                content: 'Message sent successfully!',
                timestamp: new Date().toISOString(),
                messageId: messageId
            };
            
            ws.send(JSON.stringify(confirmation));
            
            // Update statistics
            this.stats.totalMessages++;
            
        } catch (error) {
            console.error(`❌ Error saving message from ${clientInfo.username}:`, error.message);
            this.sendError(ws, 'Failed to save message');
        }
    }
    
    /**
     * ============================================================================
     * SEND MESSAGE HISTORY - SENDING RECENT MESSAGES TO NEW USERS
     * ============================================================================
     */
    async sendMessageHistory(ws) {
        try {
            const messages = await this.authService.db.getRecentMessages('main', 20, 0);
            
            const historyMessage = {
                type: 'message_history',
                content: 'Recent messages',
                timestamp: new Date().toISOString(),
                messages: messages.reverse(),
                roomId: 'main'
            };
            
            ws.send(JSON.stringify(historyMessage));
            
        } catch (error) {
            console.error('❌ Error sending message history:', error.message);
        }
    }
    
    /**
     * ============================================================================
     * SEND ERROR - SENDING ERROR MESSAGES TO CLIENTS
     * ============================================================================
     */
    sendError(ws, errorMessage) {
        const errorResponse = {
            type: 'error',
            content: errorMessage,
            timestamp: new Date().toISOString()
        };
        
        ws.send(JSON.stringify(errorResponse));
    }
    
    /**
     * ============================================================================
     * BROADCAST TO OTHERS - SENDING MESSAGES TO EVERYONE EXCEPT SENDER
     * ============================================================================
     * 
     * @param {WebSocket} sender - The WebSocket connection of the message sender
     * @param {Object} message - The message object to broadcast
     */
    broadcastToOthers(sender, message) {
        const messageString = JSON.stringify(message);
        let broadcastCount = 0;
        
        this.clients.forEach((clientInfo, client) => {
            if (client === sender) {
                return;
            }
            
            if (client.readyState === WebSocket.OPEN && clientInfo.isAuthenticated) {
                try {
                    client.send(messageString);
                    broadcastCount++;
                } catch (error) {
                    console.error('❌ Error sending message to client:', error);
                }
            }
        });
        
        console.log(`📢 Message broadcasted to ${broadcastCount} clients`);
    }
    
    /**
     * ============================================================================
     * BROADCAST TO ALL - SENDING MESSAGES TO EVERYONE INCLUDING SENDER
     * ============================================================================
     * 
     * @param {Object} message - The message object to broadcast
     */
    broadcastToAll(message) {
        const messageString = JSON.stringify(message);
        let broadcastCount = 0;
        
        this.clients.forEach((clientInfo, client) => {
            if (client.readyState === WebSocket.OPEN && clientInfo.isAuthenticated) {
                try {
                    client.send(messageString);
                    broadcastCount++;
                } catch (error) {
                    console.error('❌ Error sending message to client:', error);
                }
            }
        });
        
        console.log(`📢 Message broadcasted to all ${broadcastCount} clients`);
    }
    
    /**
     * ============================================================================
     * HANDLE CLOSE - WHEN CLIENTS DISCONNECT
     * ============================================================================
     * 
     * @param {WebSocket} ws - The WebSocket connection that was closed
     * @param {string} clientId - Identifier for the disconnected client
     */
    async handleClose(ws, clientId) {
        const clientInfo = this.clients.get(ws);
        
        if (clientInfo && clientInfo.isAuthenticated) {
            console.log(`👋 User disconnected: ${clientInfo.username} (${clientId})`);
            
            // Update user's online status
            try {
                await this.authService.db.updateUserOnlineStatus(clientInfo.userId, false);
            } catch (error) {
                console.error('❌ Error updating user online status:', error.message);
            }
            
            // Notify other clients
            this.broadcastToOthers(ws, {
                type: 'system',
                content: `${clientInfo.displayName} has left the chat`,
                timestamp: new Date().toISOString(),
                user: {
                    userId: clientInfo.userId,
                    username: clientInfo.username,
                    displayName: clientInfo.displayName
                }
            });
        } else {
            console.log(`👋 Unauthenticated client disconnected: ${clientId}`);
        }
        
        // Remove client from our list
        this.clients.delete(ws);
        
        // Update statistics
        this.stats.currentConnections--;
        
        console.log(`📊 Total clients connected: ${this.clients.size}`);
    }
    
    /**
     * ============================================================================
     * HANDLE ERROR - ERROR MANAGEMENT
     * ============================================================================
     * 
     * @param {Error} error - The error object containing error details
     * @param {string} clientId - Optional client identifier (defaults to 'server')
     */
    handleError(error, clientId = 'server') {
        console.error(`❌ Error on ${clientId}:`, error.message);
    }
    
    /**
     * ============================================================================
     * SHUTDOWN - GRACEFUL SERVER SHUTDOWN
     * ============================================================================
     */
    async shutdown() {
        console.log('🛑 Shutting down enhanced broadcast server...');
        
        // Update all online users to offline
        for (const [client, clientInfo] of this.clients) {
            if (clientInfo.isAuthenticated && clientInfo.userId) {
                try {
                    await this.authService.db.updateUserOnlineStatus(clientInfo.userId, false);
                } catch (error) {
                    console.error('❌ Error updating user status during shutdown:', error.message);
                }
            }
            
            if (client.readyState === WebSocket.OPEN) {
                client.close();
            }
        }
        
        // Clear the clients list
        this.clients.clear();
        
        // Close database connections
        try {
            await this.authService.close();
        } catch (error) {
            console.error('❌ Error closing auth service:', error.message);
        }
        
        // Close the WebSocket server
        this.wss.close(() => {
            console.log('✅ Enhanced server shutdown complete');
            process.exit(0);
        });
    }
    
    /**
     * ============================================================================
     * GET CLIENT COUNT - UTILITY FUNCTION
     * ============================================================================
     * 
     * @returns {number} Number of connected clients
     */
    getClientCount() {
        return this.clients.size;
    }
    
    /**
     * ============================================================================
     * GET AUTHENTICATED CLIENT COUNT - UTILITY FUNCTION
     * ============================================================================
     * 
     * @returns {number} Number of authenticated clients
     */
    getAuthenticatedClientCount() {
        let count = 0;
        for (const clientInfo of this.clients.values()) {
            if (clientInfo.isAuthenticated) {
                count++;
            }
        }
        return count;
    }
    
    /**
     * ============================================================================
     * GET SERVER STATISTICS - UTILITY FUNCTION
     * ============================================================================
     * 
     * @returns {Object} Server statistics
     */
    getStats() {
        return {
            ...this.stats,
            authenticatedClients: this.getAuthenticatedClientCount(),
            totalClients: this.clients.size
        };
    }
}

// Export the class
module.exports = BroadcastServer; 
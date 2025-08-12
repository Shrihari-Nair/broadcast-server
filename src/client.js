/**
 * ============================================================================
 * ENHANCED BROADCAST CLIENT IMPLEMENTATION
 * ============================================================================
 * 
 * This module contains the WebSocket client that connects to the enhanced broadcast server
 * and provides an interactive interface for real-time messaging with authentication.
 * 
 * 🎯 WHAT THIS CLIENT DOES:
 * 1. Connects to a WebSocket broadcast server with authentication
 * 2. Provides user registration and login functionality
 * 3. Handles JWT token management and session persistence
 * 4. Provides an interactive command-line interface for users
 * 5. Sends messages to the server for broadcasting to other clients
 * 6. Receives and displays messages from other clients in real-time
 * 7. Handles connection status, errors, and graceful disconnection
 * 8. Provides enhanced commands (help, status, quit, history, online-users)
 * 9. Displays message history and online user information
 * 
 * 🔑 NEW FEATURES:
 * - User authentication (register/login)
 * - JWT token management
 * - Message history retrieval
 * - Online user list
 * - Enhanced user experience
 */

// Import required Node.js modules
const WebSocket = require('ws');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

/**
 * ============================================================================
 * ENHANCED BROADCASTCLIENT CLASS
 * ============================================================================
 * 
 * This class extends the original broadcast client with authentication
 * and enhanced messaging capabilities.
 */
class BroadcastClient {
    
    /**
     * ============================================================================
     * CONSTRUCTOR - THE INITIALIZATION FUNCTION
     * ============================================================================
     * 
     * @param {string} serverUrl - The WebSocket URL to connect to (default: ws://localhost:8080)
     */
    constructor(serverUrl = 'ws://localhost:8080') {
        // Store the server URL for later use
        this.serverUrl = serverUrl;
        
        // WebSocket connection object (will be set when we connect)
        this.ws = null;
        
        // Track connection status
        this.isConnected = false;
        this.isAuthenticated = false;
        
        // User information
        this.user = null;
        this.token = null;
        
        // Client identifier (set by server when we connect)
        this.clientId = null;
        
        // Message history
        this.messageHistory = [];
        
        // Online users
        this.onlineUsers = [];
        
        // Create the readline interface
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        // Bind event handlers
        this.handleOpen = this.handleOpen.bind(this);
        this.handleMessage = this.handleMessage.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleError = this.handleError.bind(this);
        
        // Log that we're trying to connect
        console.log(`🔗 Attempting to connect to ${this.serverUrl}...`);
    }
    
    /**
     * ============================================================================
     * CONNECT - ESTABLISHING THE CONNECTION
     * ============================================================================
     */
    connect() {
        try {
            // Create a new WebSocket connection to the specified server
            this.ws = new WebSocket(this.serverUrl);
            
            // Set up event listeners
            this.setupEventListeners();
            
        } catch (error) {
            console.error('❌ Failed to create WebSocket connection:', error.message);
            process.exit(1);
        }
    }
    
    /**
     * ============================================================================
     * SETUP EVENT LISTENERS - THE "LISTENING" FUNCTION
     * ============================================================================
     */
    setupEventListeners() {
        // Connection established event
        this.ws.on('open', this.handleOpen);
        
        // Message received event
        this.ws.on('message', this.handleMessage);
        
        // Connection closed event
        this.ws.on('close', this.handleClose);
        
        // Error event
        this.ws.on('error', this.handleError);
    }
    
    /**
     * ============================================================================
     * HANDLE OPEN - CONNECTION SUCCESSFULLY ESTABLISHED
     * ============================================================================
     */
    handleOpen() {
        this.isConnected = true;
        
        console.log('✅ Connected to enhanced broadcast server!');
        console.log('🔐 Authentication required to join the chat');
        console.log('💡 Type "help" to see available commands');
        console.log('─'.repeat(50));
        
        // Start user interaction
        this.startInputListener();
    }
    
    /**
     * ============================================================================
     * HANDLE MESSAGE - PROCESSING INCOMING MESSAGES
     * ============================================================================
     * 
     * @param {Buffer|string} data - The raw message data from the server
     */
    handleMessage(data) {
        try {
            const messageString = data.toString();
            
            // Parse the message
            let message;
            try {
                message = JSON.parse(messageString);
            } catch (parseError) {
                // Handle non-JSON messages
                message = {
                    type: 'text',
                    content: messageString,
                    timestamp: new Date().toISOString()
                };
            }
            
            // Display the message
            this.displayMessage(message);
            
        } catch (error) {
            console.error('❌ Error processing received message:', error.message);
        }
    }
    
    /**
     * ============================================================================
     * DISPLAY MESSAGE - FORMATTING AND SHOWING MESSAGES
     * ============================================================================
     * 
     * @param {Object} message - The message object with type, content, timestamp, etc.
     */
    displayMessage(message) {
        const timestamp = new Date(message.timestamp).toLocaleTimeString();
        
        switch (message.type) {
            case 'auth_required':
                console.log(`\n🔐 [${timestamp}] ${message.content}`);
                console.log('💡 Use "register <username> <password>" or "login <username> <password>"');
                break;
                
            case 'auth_success':
                console.log(`\n✅ [${timestamp}] ${message.content}`);
                this.isAuthenticated = true;
                this.user = message.user;
                this.token = message.token;
                console.log(`👤 Welcome, ${message.user.displayName}!`);
                break;
                
            case 'broadcast':
                console.log(`\n📨 [${timestamp}] ${message.user.displayName}: ${message.content}`);
                // Store in message history
                this.messageHistory.push(message);
                break;
                
            case 'message_history':
                console.log(`\n📚 [${timestamp}] ${message.content}`);
                if (message.messages && message.messages.length > 0) {
                    console.log('📖 Recent messages:');
                    message.messages.forEach(msg => {
                        const msgTime = new Date(msg.timestamp).toLocaleTimeString();
                        console.log(`   [${msgTime}] ${msg.display_name || msg.username}: ${msg.content}`);
                    });
                }
                break;
                
            case 'online_users':
                console.log(`\n👥 [${timestamp}] ${message.content}`);
                this.onlineUsers = message.users;
                if (message.users && message.users.length > 0) {
                    console.log('🟢 Online users:');
                    message.users.forEach(user => {
                        const lastSeen = new Date(user.last_seen).toLocaleTimeString();
                        console.log(`   • ${user.display_name || user.username} (last seen: ${lastSeen})`);
                    });
                }
                break;
                
            case 'system':
                console.log(`\n🔔 [${timestamp}] ${message.content}`);
                break;
                
            case 'confirmation':
                console.log(`\n✅ [${timestamp}] ${message.content}`);
                break;
                
            case 'error':
                console.log(`\n❌ [${timestamp}] Error: ${message.content}`);
                break;
                
            default:
                console.log(`\n📨 [${timestamp}] ${message.content}`);
        }
        
        // Show input prompt again
        this.showInputPrompt();
    }
    
    /**
     * ============================================================================
     * HANDLE CLOSE - CONNECTION CLOSED
     * ============================================================================
     */
    handleClose() {
        this.isConnected = false;
        this.isAuthenticated = false;
        
        console.log('\n👋 Disconnected from enhanced broadcast server');
        
        // Clean up resources
        this.rl.close();
        
        // Exit the program
        process.exit(0);
    }
    
    /**
     * ============================================================================
     * HANDLE ERROR - WEBSOCKET ERRORS
     * ============================================================================
     * 
     * @param {Error} error - The error object containing error details
     */
    handleError(error) {
        console.error('❌ WebSocket error:', error.message);
        
        if (!this.isConnected) {
            console.error('❌ Failed to connect to server. Make sure the server is running.');
            process.exit(1);
        }
    }
    
    /**
     * ============================================================================
     * START INPUT LISTENER - BEGINNING USER INTERACTION
     * ============================================================================
     */
    startInputListener() {
        // Show the initial prompt
        this.showInputPrompt();
        
        // Listen for user input
        this.rl.on('line', (input) => {
            this.handleUserInput(input.trim());
        });
        
        // Handle Ctrl+C gracefully
        this.rl.on('SIGINT', () => {
            this.disconnect();
        });
    }
    
    /**
     * ============================================================================
     * SHOW INPUT PROMPT - DISPLAYING THE TYPING PROMPT
     * ============================================================================
     */
    showInputPrompt() {
        if (this.isAuthenticated && this.user) {
            process.stdout.write(`\n💬 ${this.user.displayName}: `);
        } else {
            process.stdout.write('\n💬 Guest: ');
        }
    }
    
    /**
     * ============================================================================
     * HANDLE USER INPUT - PROCESSING USER COMMANDS AND MESSAGES
     * ============================================================================
     * 
     * @param {string} input - The user's input (what they typed)
     */
    handleUserInput(input) {
        if (!input) {
            this.showInputPrompt();
            return;
        }
        
        // Check for commands
        if (input.startsWith('/')) {
            this.handleCommand(input.substring(1));
            return;
        }
        
        // Check for quit commands
        if (input.toLowerCase() === 'quit' || input.toLowerCase() === 'exit') {
            this.disconnect();
            return;
        }
        
        // Check for help command
        if (input.toLowerCase() === 'help') {
            this.showHelp();
            return;
        }
        
        // Check for status command
        if (input.toLowerCase() === 'status') {
            this.showStatus();
            return;
        }
        
        // Check for authentication commands
        if (input.startsWith('register ')) {
            this.handleRegister(input.substring(9));
            return;
        }
        
        if (input.startsWith('login ')) {
            this.handleLogin(input.substring(6));
            return;
        }
        
        if (input.toLowerCase() === 'logout') {
            this.handleLogout();
            return;
        }
        
        // Check for other commands
        if (input.toLowerCase() === 'history') {
            this.requestMessageHistory();
            return;
        }
        
        if (input.toLowerCase() === 'online-users' || input.toLowerCase() === 'users') {
            this.requestOnlineUsers();
            return;
        }
        
        // If authenticated, send message; otherwise, show auth required
        if (this.isAuthenticated) {
            this.sendMessage(input);
        } else {
            console.log('🔐 Authentication required to send messages');
            console.log('💡 Use "register <username> <password>" or "login <username> <password>"');
            this.showInputPrompt();
        }
    }
    
    /**
     * ============================================================================
     * HANDLE COMMANDS - PROCESSING SLASH COMMANDS
     * ============================================================================
     * 
     * @param {string} command - The command without the slash
     */
    handleCommand(command) {
        const [cmd, ...args] = command.split(' ');
        
        switch (cmd.toLowerCase()) {
            case 'register':
                if (args.length >= 2) {
                    this.handleRegister(args.join(' '));
                } else {
                    console.log('❌ Usage: /register <username> <password> [email] [display_name]');
                }
                break;
                
            case 'login':
                if (args.length >= 2) {
                    this.handleLogin(args.join(' '));
                } else {
                    console.log('❌ Usage: /login <username> <password>');
                }
                break;
                
            case 'logout':
                this.handleLogout();
                break;
                
            case 'history':
                this.requestMessageHistory();
                break;
                
            case 'users':
            case 'online-users':
                this.requestOnlineUsers();
                break;
                
            case 'help':
                this.showHelp();
                break;
                
            case 'status':
                this.showStatus();
                break;
                
            default:
                console.log(`❌ Unknown command: /${cmd}`);
                console.log('💡 Type "help" to see available commands');
        }
        
        this.showInputPrompt();
    }
    
    /**
     * ============================================================================
     * HANDLE REGISTER - PROCESSING USER REGISTRATION
     * ============================================================================
     * 
     * @param {string} input - The registration input
     */
    handleRegister(input) {
        const parts = input.split(' ');
        if (parts.length < 2) {
            console.log('❌ Usage: register <username> <password> [email] [display_name]');
            this.showInputPrompt();
            return;
        }
        
        const username = parts[0];
        const password = parts[1];
        const email = parts[2] || null;
        const displayName = parts[3] || username;
        
        const message = {
            type: 'register',
            username,
            password,
            email,
            displayName
        };
        
        this.ws.send(JSON.stringify(message));
    }
    
    /**
     * ============================================================================
     * HANDLE LOGIN - PROCESSING USER LOGIN
     * ============================================================================
     * 
     * @param {string} input - The login input
     */
    handleLogin(input) {
        const parts = input.split(' ');
        if (parts.length < 2) {
            console.log('❌ Usage: login <username> <password>');
            this.showInputPrompt();
            return;
        }
        
        const username = parts[0];
        const password = parts[1];
        
        const message = {
            type: 'login',
            username,
            password
        };
        
        this.ws.send(JSON.stringify(message));
    }
    
    /**
     * ============================================================================
     * HANDLE LOGOUT - PROCESSING USER LOGOUT
     * ============================================================================
     */
    handleLogout() {
        if (this.isAuthenticated) {
            const message = {
                type: 'logout'
            };
            
            this.ws.send(JSON.stringify(message));
            
            // Reset local state
            this.isAuthenticated = false;
            this.user = null;
            this.token = null;
            
            console.log('👋 Logged out successfully');
        } else {
            console.log('❌ Not currently logged in');
        }
        
        this.showInputPrompt();
    }
    
    /**
     * ============================================================================
     * REQUEST MESSAGE HISTORY - REQUESTING RECENT MESSAGES
     * ============================================================================
     */
    requestMessageHistory() {
        if (this.isAuthenticated) {
            const message = {
                type: 'get_history',
                roomId: 'main',
                limit: 50,
                offset: 0
            };
            
            this.ws.send(JSON.stringify(message));
        } else {
            console.log('🔐 Authentication required to view message history');
        }
        
        this.showInputPrompt();
    }
    
    /**
     * ============================================================================
     * REQUEST ONLINE USERS - REQUESTING ONLINE USER LIST
     * ============================================================================
     */
    requestOnlineUsers() {
        if (this.isAuthenticated) {
            const message = {
                type: 'get_online_users'
            };
            
            this.ws.send(JSON.stringify(message));
        } else {
            console.log('🔐 Authentication required to view online users');
        }
        
        this.showInputPrompt();
    }
    
    /**
     * ============================================================================
     * SEND MESSAGE - TRANSMITTING MESSAGES TO THE SERVER
     * ============================================================================
     * 
     * @param {string} message - The message to send
     */
    sendMessage(message) {
        if (!this.isConnected || !this.ws) {
            console.log('❌ Not connected to server');
            return;
        }
        
        if (!this.isAuthenticated) {
            console.log('🔐 Authentication required to send messages');
            return;
        }
        
        try {
            const messageObj = {
                type: 'broadcast',
                content: message
            };
            
            this.ws.send(JSON.stringify(messageObj));
            
        } catch (error) {
            console.error('❌ Failed to send message:', error.message);
        }
    }
    
    /**
     * ============================================================================
     * SHOW HELP - DISPLAYING AVAILABLE COMMANDS
     * ============================================================================
     */
    showHelp() {
        console.log('\n📖 Available commands:');
        console.log('  Authentication:');
        console.log('    register <username> <password> [email] [display_name] - Create new account');
        console.log('    login <username> <password> - Login to existing account');
        console.log('    logout - Logout from current account');
        console.log('');
        console.log('  Chat:');
        console.log('    history - View recent message history');
        console.log('    online-users / users - View online users');
        console.log('    status - Show connection and authentication status');
        console.log('    help - Show this help message');
        console.log('    quit / exit - Disconnect from server');
        console.log('');
        console.log('  Slash Commands:');
        console.log('    /register <username> <password> [email] [display_name]');
        console.log('    /login <username> <password>');
        console.log('    /logout');
        console.log('    /history');
        console.log('    /users');
        console.log('    /help');
        console.log('    /status');
        console.log('');
        console.log('  (any other text) - Send a message to all connected clients');
    }
    
    /**
     * ============================================================================
     * SHOW STATUS - DISPLAYING CONNECTION INFORMATION
     * ============================================================================
     */
    showStatus() {
        console.log('\n📊 Connection Status:');
        console.log(`  Server: ${this.serverUrl}`);
        console.log(`  Connected: ${this.isConnected ? 'Yes' : 'No'}`);
        console.log(`  Authenticated: ${this.isAuthenticated ? 'Yes' : 'No'}`);
        
        if (this.isAuthenticated && this.user) {
            console.log(`  Username: ${this.user.username}`);
            console.log(`  Display Name: ${this.user.displayName}`);
            if (this.user.email) {
                console.log(`  Email: ${this.user.email}`);
            }
        }
        
        if (this.clientId) {
            console.log(`  Client ID: ${this.clientId}`);
        }
        
        if (this.onlineUsers.length > 0) {
            console.log(`  Online Users: ${this.onlineUsers.length}`);
        }
        
        if (this.messageHistory.length > 0) {
            console.log(`  Messages in Session: ${this.messageHistory.length}`);
        }
    }
    
    /**
     * ============================================================================
     * DISCONNECT - GRACEFUL DISCONNECTION
     * ============================================================================
     */
    disconnect() {
        console.log('\n🛑 Disconnecting from server...');
        
        // Send logout message if authenticated
        if (this.isAuthenticated && this.ws && this.isConnected) {
            try {
                const message = {
                    type: 'logout'
                };
                this.ws.send(JSON.stringify(message));
            } catch (error) {
                // Ignore errors during disconnect
            }
        }
        
        // Close the WebSocket connection
        if (this.ws && this.isConnected) {
            this.ws.close();
        }
        
        // Clean up the readline interface
        this.rl.close();
        
        // Confirm disconnection
        console.log('✅ Disconnected');
        
        // Exit the program
        process.exit(0);
    }
}

// Export the class
module.exports = BroadcastClient; 
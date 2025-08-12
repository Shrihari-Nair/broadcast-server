#!/usr/bin/env node

/**
 * Enhanced Broadcast Server CLI Interface
 * 
 * This is the main entry point for the enhanced broadcast-server application.
 * It provides a command-line interface with enhanced commands including:
 * - broadcast-server start: Starts the enhanced WebSocket server with authentication
 * - broadcast-server connect: Connects a client to the server
 * - broadcast-server init-db: Initialize the database
 * - broadcast-server create-user: Create a new user account
 * 
 * Key Concepts:
 * - CLI (Command Line Interface): A text-based interface for interacting with programs
 * - Command parsing: Converting user commands into program actions
 * - Process management: Starting and stopping server processes
 * - User management: Creating and managing user accounts
 */

const { Command } = require('commander');
const BroadcastServer = require('./server.js');
const BroadcastClient = require('./client.js');
const AuthService = require('./auth/authService.js');

// Create a new Command instance
const program = new Command();

// Set up the CLI program
setupCLI();

/**
 * Sets up the command-line interface with all available commands and options
 */
function setupCLI() {
    // Set basic program information
    program
        .name('broadcast-server')
        .description('An enhanced real-time broadcast server with user authentication and message persistence')
        .version('2.0.0');
    
    // Add the 'start' command for starting the enhanced server
    program
        .command('start')
        .description('Start the enhanced broadcast server with authentication')
        .option('-p, --port <port>', 'Port number to listen on', '8080')
        .option('-h, --host <host>', 'Host address to bind to', 'localhost')
        .action(startServer);
    
    // Add the 'connect' command for connecting as a client
    program
        .command('connect')
        .description('Connect to the broadcast server as a client')
        .option('-s, --server <url>', 'Server URL to connect to', 'ws://localhost:8080')
        .action(connectClient);
    
    // Add the 'init-db' command for database initialization
    program
        .command('init-db')
        .description('Initialize the database and create default admin user')
        .action(initDatabase);
    
    // Add the 'create-user' command for user management
    program
        .command('create-user')
        .description('Create a new user account')
        .requiredOption('-u, --username <username>', 'Username for the new account')
        .requiredOption('-p, --password <password>', 'Password for the new account')
        .option('-e, --email <email>', 'Email address (optional)')
        .option('-d, --display-name <name>', 'Display name (optional)')
        .action(createUser);
    
    // Add a default command that shows help if no command is provided
    program
        .command('*')
        .action(() => {
            console.log('❌ Unknown command. Use --help to see available commands.');
            process.exit(1);
        });
    
    // Parse command line arguments
    program.parse();
}

/**
 * Action handler for the 'start' command
 * This function is called when the user runs: broadcast-server start
 * 
 * @param {Object} options - Command options (port, host)
 */
async function startServer(options) {
    console.log('🚀 Starting Enhanced Broadcast Server...');
    console.log('─'.repeat(50));
    
    // Parse the port number
    const port = parseInt(options.port);
    
    // Validate port number
    if (isNaN(port) || port < 1 || port > 65535) {
        console.error('❌ Invalid port number. Port must be between 1 and 65535.');
        process.exit(1);
    }
    
    try {
        // Create and start the enhanced broadcast server
        const server = new BroadcastServer(port);
        
        // Initialize the server (database and authentication)
        await server.initialize();
        
        // Set up graceful shutdown
        setupGracefulShutdown(server);
        
        console.log(`✅ Enhanced server is running on port ${port}`);
        console.log('🔐 Authentication and message persistence enabled');
        console.log('💡 Clients can connect using: broadcast-server connect');
        console.log('💡 Press Ctrl+C to stop the server');
        console.log('─'.repeat(50));
        
        // Display server statistics periodically
        setInterval(() => {
            const stats = server.getStats();
            console.log(`📊 Server Stats - Connections: ${stats.currentConnections}, Authenticated: ${stats.authenticatedClients}, Total Messages: ${stats.totalMessages}`);
        }, 30000); // Update every 30 seconds
        
    } catch (error) {
        console.error('❌ Failed to start enhanced server:', error.message);
        
        // Check if the error is due to port already in use
        if (error.code === 'EADDRINUSE') {
            console.error(`❌ Port ${port} is already in use. Try a different port with --port option.`);
        }
        
        // Check if the error is due to database issues
        if (error.message.includes('Database')) {
            console.error('❌ Database error. Make sure to run: npm run init-db');
        }
        
        process.exit(1);
    }
}

/**
 * Action handler for the 'connect' command
 * This function is called when the user runs: broadcast-server connect
 * 
 * @param {Object} options - Command options (server URL)
 */
function connectClient(options) {
    console.log('🔗 Connecting to Enhanced Broadcast Server...');
    console.log('─'.repeat(50));
    
    try {
        // Create and connect the broadcast client
        const client = new BroadcastClient(options.server);
        client.connect();
        
    } catch (error) {
        console.error('❌ Failed to create client:', error.message);
        process.exit(1);
    }
}

/**
 * Action handler for the 'init-db' command
 * This function is called when the user runs: broadcast-server init-db
 */
async function initDatabase() {
    console.log('🗄️  Initializing database...');
    console.log('─'.repeat(50));
    
    try {
        // Run the database initialization script
        const { execSync } = require('child_process');
        const path = require('path');
        
        const initScriptPath = path.join(__dirname, 'database/init.js');
        execSync(`node "${initScriptPath}"`, { stdio: 'inherit' });
        
        console.log('✅ Database initialization completed successfully');
        console.log('💡 You can now start the server with: broadcast-server start');
        
    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        console.error('💡 Make sure you have installed all dependencies: npm install');
        process.exit(1);
    }
}

/**
 * Action handler for the 'create-user' command
 * This function is called when the user runs: broadcast-server create-user
 * 
 * @param {Object} options - Command options (username, password, email, displayName)
 */
async function createUser(options) {
    console.log('👤 Creating new user account...');
    console.log('─'.repeat(50));
    
    try {
        // Initialize authentication service
        const authService = new AuthService();
        await authService.initialize();
        
        // Create the user
        const result = await authService.registerUser({
            username: options.username,
            password: options.password,
            email: options.email,
            displayName: options.displayName
        });
        
        console.log('✅ User account created successfully!');
        console.log(`   Username: ${result.username}`);
        console.log(`   Display Name: ${result.displayName}`);
        if (options.email) {
            console.log(`   Email: ${options.email}`);
        }
        console.log('💡 The user can now login to the server');
        
        // Close the auth service
        await authService.close();
        
    } catch (error) {
        console.error('❌ Failed to create user account:', error.message);
        
        if (error.message.includes('Username already exists')) {
            console.error('💡 Try a different username');
        }
        
        if (error.message.includes('Database')) {
            console.error('💡 Make sure the database is initialized: npm run init-db');
        }
        
        process.exit(1);
    }
}

/**
 * Sets up graceful shutdown for the server
 * This ensures the server shuts down properly when the user presses Ctrl+C
 * 
 * @param {BroadcastServer} server - The server instance to shut down
 */
function setupGracefulShutdown(server) {
    // Handle SIGINT signal (Ctrl+C)
    process.on('SIGINT', async () => {
        console.log('\n🛑 Received SIGINT (Ctrl+C), shutting down gracefully...');
        await server.shutdown();
    });
    
    // Handle SIGTERM signal (termination request)
    process.on('SIGTERM', async () => {
        console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
        await server.shutdown();
    });
    
    // Handle uncaught exceptions
    process.on('uncaughtException', async (error) => {
        console.error('❌ Uncaught Exception:', error);
        console.log('🛑 Shutting down server due to uncaught exception...');
        await server.shutdown();
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', async (reason, promise) => {
        console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
        console.log('🛑 Shutting down server due to unhandled rejection...');
        await server.shutdown();
    });
}

// Export the setup function for testing purposes
module.exports = { setupCLI, startServer, connectClient, initDatabase, createUser }; 
#!/usr/bin/env node

/**
 * Broadcast Server CLI Interface
 * 
 * This is the main entry point for the broadcast-server application.
 * It provides a command-line interface with two main commands:
 * - broadcast-server start: Starts the WebSocket server
 * - broadcast-server connect: Connects a client to the server
 * 
 * Key Concepts:
 * - CLI (Command Line Interface): A text-based interface for interacting with programs
 * - Command parsing: Converting user commands into program actions
 * - Process management: Starting and stopping server processes
 */

const { Command } = require('commander');
const BroadcastServer = require('./server.js');
const BroadcastClient = require('./client.js');

// Create a new Command instance
// Commander.js is a popular library for building CLI applications in Node.js
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
        .description('A real-time broadcast server for sending messages to all connected clients')
        .version('1.0.0');
    
    // Add the 'start' command for starting the server
    program
        .command('start')
        .description('Start the broadcast server')
        .option('-p, --port <port>', 'Port number to listen on', '8080')
        .option('-h, --host <host>', 'Host address to bind to', 'localhost')
        .action(startServer);
    
    // Add the 'connect' command for connecting as a client
    program
        .command('connect')
        .description('Connect to the broadcast server as a client')
        .option('-s, --server <url>', 'Server URL to connect to', 'ws://localhost:8080')
        .action(connectClient);
    
    // Add a default command that shows help if no command is provided
    program
        .command('*')
        .action(() => {
            console.log('❌ Unknown command. Use --help to see available commands.');
            process.exit(1);
        });
    
    // Parse command line arguments
    // This processes the arguments passed to the program and calls the appropriate action
    program.parse();
}

/**
 * Action handler for the 'start' command
 * This function is called when the user runs: broadcast-server start
 * 
 * @param {Object} options - Command options (port, host)
 */
function startServer(options) {
    console.log('🚀 Starting Broadcast Server...');
    console.log('─'.repeat(50));
    
    // Parse the port number
    const port = parseInt(options.port);
    
    // Validate port number
    if (isNaN(port) || port < 1 || port > 65535) {
        console.error('❌ Invalid port number. Port must be between 1 and 65535.');
        process.exit(1);
    }
    
    try {
        // Create and start the broadcast server
        const server = new BroadcastServer(port);
        
        // Set up graceful shutdown
        setupGracefulShutdown(server);
        
        console.log(`✅ Server is running on port ${port}`);
        console.log('💡 Clients can connect using: broadcast-server connect');
        console.log('💡 Press Ctrl+C to stop the server');
        console.log('─'.repeat(50));
        
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        
        // Check if the error is due to port already in use
        if (error.code === 'EADDRINUSE') {
            console.error(`❌ Port ${port} is already in use. Try a different port with --port option.`);
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
    console.log('🔗 Connecting to Broadcast Server...');
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
 * Sets up graceful shutdown for the server
 * This ensures the server shuts down properly when the user presses Ctrl+C
 * 
 * @param {BroadcastServer} server - The server instance to shut down
 */
function setupGracefulShutdown(server) {
    // Handle SIGINT signal (Ctrl+C)
    process.on('SIGINT', () => {
        console.log('\n🛑 Received SIGINT (Ctrl+C), shutting down gracefully...');
        server.shutdown();
    });
    
    // Handle SIGTERM signal (termination request)
    process.on('SIGTERM', () => {
        console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
        server.shutdown();
    });
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
        console.error('❌ Uncaught Exception:', error);
        console.log('🛑 Shutting down server due to uncaught exception...');
        server.shutdown();
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
        console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
        console.log('🛑 Shutting down server due to unhandled rejection...');
        server.shutdown();
    });
}

// Export the setup function for testing purposes
module.exports = { setupCLI, startServer, connectClient }; 
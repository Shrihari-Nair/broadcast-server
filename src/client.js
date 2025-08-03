/**
 * Broadcast Client Implementation
 * 
 * This module contains the WebSocket client that:
 * 1. Connects to the broadcast server
 * 2. Sends messages to the server
 * 3. Receives and displays broadcasted messages from other clients
 * 4. Handles connection status and errors
 * 
 * Key Concepts:
 * - WebSocket Client: A client-side WebSocket connection that can send/receive messages
 * - Event-driven programming: The client responds to events like 'open', 'message', 'close'
 * - Real-time communication: Messages are sent and received instantly
 */

const WebSocket = require('ws');
const readline = require('readline');

/**
 * BroadcastClient Class
 * 
 * This class handles the client-side connection to the broadcast server.
 * It provides an interactive interface for sending and receiving messages.
 */
class BroadcastClient {
    /**
     * Constructor - Initializes the client
     * @param {string} serverUrl - The WebSocket URL to connect to (default: ws://localhost:8080)
     */
    constructor(serverUrl = 'ws://localhost:8080') {
        this.serverUrl = serverUrl;
        this.ws = null;
        this.isConnected = false;
        this.clientId = null;
        
        // Create readline interface for user input
        // This allows us to read input from the command line interactively
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        // Bind event handlers to this instance
        this.handleOpen = this.handleOpen.bind(this);
        this.handleMessage = this.handleMessage.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleError = this.handleError.bind(this);
        
        console.log(`🔗 Attempting to connect to ${this.serverUrl}...`);
    }
    
    /**
     * Connects to the broadcast server
     * This method creates a new WebSocket connection and sets up event listeners
     */
    connect() {
        try {
            // Create a new WebSocket connection
            // The WebSocket constructor takes a URL and optional configuration
            this.ws = new WebSocket(this.serverUrl);
            
            // Set up event listeners for the WebSocket connection
            this.setupEventListeners();
            
        } catch (error) {
            console.error('❌ Failed to create WebSocket connection:', error.message);
            process.exit(1);
        }
    }
    
    /**
     * Sets up event listeners for the WebSocket connection
     * 
     * WebSocket connections have several important events:
     * - 'open': Fired when the connection is established
     * - 'message': Fired when a message is received
     * - 'close': Fired when the connection is closed
     * - 'error': Fired when an error occurs
     */
    setupEventListeners() {
        // Connection established
        this.ws.on('open', this.handleOpen);
        
        // Message received
        this.ws.on('message', this.handleMessage);
        
        // Connection closed
        this.ws.on('close', this.handleClose);
        
        // Error occurred
        this.ws.on('error', this.handleError);
    }
    
    /**
     * Handles the 'open' event - called when connection is established
     */
    handleOpen() {
        this.isConnected = true;
        console.log('✅ Connected to broadcast server!');
        console.log('💡 Type your messages and press Enter to send them.');
        console.log('💡 Type "quit" or "exit" to disconnect.');
        console.log('─'.repeat(50));
        
        // Start listening for user input
        this.startInputListener();
    }
    
    /**
     * Handles incoming messages from the server
     * @param {Buffer|string} data - The raw message data from the server
     */
    handleMessage(data) {
        try {
            // Convert the raw data to a string
            const messageString = data.toString();
            
            // Try to parse the message as JSON
            // Server sends structured messages with type, content, timestamp, etc.
            let message;
            try {
                message = JSON.parse(messageString);
            } catch (parseError) {
                // If it's not JSON, treat it as a plain text message
                message = {
                    type: 'text',
                    content: messageString,
                    timestamp: new Date().toISOString()
                };
            }
            
            // Display the message based on its type
            this.displayMessage(message);
            
        } catch (error) {
            console.error('❌ Error processing received message:', error.message);
        }
    }
    
    /**
     * Displays a message to the user based on its type
     * @param {Object} message - The message object with type, content, timestamp, etc.
     */
    displayMessage(message) {
        const timestamp = new Date(message.timestamp).toLocaleTimeString();
        
        switch (message.type) {
            case 'broadcast':
                // Message from another client
                console.log(`\n📨 [${timestamp}] ${message.clientId}: ${message.content}`);
                break;
                
            case 'system':
                // System message (welcome, user joined/left, etc.)
                console.log(`\n🔔 [${timestamp}] ${message.content}`);
                break;
                
            case 'confirmation':
                // Confirmation that our message was sent
                console.log(`\n✅ [${timestamp}] ${message.content}`);
                break;
                
            case 'error':
                // Error message from server
                console.log(`\n❌ [${timestamp}] Error: ${message.content}`);
                break;
                
            default:
                // Unknown message type, display as plain text
                console.log(`\n📨 [${timestamp}] ${message.content}`);
        }
        
        // Show the input prompt again
        this.showInputPrompt();
    }
    
    /**
     * Handles the 'close' event - called when connection is closed
     */
    handleClose() {
        this.isConnected = false;
        console.log('\n👋 Disconnected from broadcast server');
        
        // Close the readline interface
        this.rl.close();
        
        // Exit the process
        process.exit(0);
    }
    
    /**
     * Handles WebSocket errors
     * @param {Error} error - The error object
     */
    handleError(error) {
        console.error('❌ WebSocket error:', error.message);
        
        if (!this.isConnected) {
            console.error('❌ Failed to connect to server. Make sure the server is running.');
            process.exit(1);
        }
    }
    
    /**
     * Starts listening for user input
     * This method sets up an interactive interface where users can type messages
     */
    startInputListener() {
        this.showInputPrompt();
        
        // Listen for user input
        this.rl.on('line', (input) => {
            this.handleUserInput(input.trim());
        });
        
        // Handle Ctrl+C (SIGINT) gracefully
        this.rl.on('SIGINT', () => {
            this.disconnect();
        });
    }
    
    /**
     * Shows the input prompt to the user
     */
    showInputPrompt() {
        process.stdout.write('\n💬 You: ');
    }
    
    /**
     * Handles user input from the command line
     * @param {string} input - The user's input
     */
    handleUserInput(input) {
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
        
        // Don't send empty messages
        if (!input) {
            this.showInputPrompt();
            return;
        }
        
        // Send the message to the server
        this.sendMessage(input);
    }
    
    /**
     * Sends a message to the server
     * @param {string} message - The message to send
     */
    sendMessage(message) {
        if (!this.isConnected || !this.ws) {
            console.log('❌ Not connected to server');
            return;
        }
        
        try {
            // Send the message as a string
            // The server will parse it and broadcast to other clients
            this.ws.send(message);
            
        } catch (error) {
            console.error('❌ Failed to send message:', error.message);
        }
    }
    
    /**
     * Shows help information to the user
     */
    showHelp() {
        console.log('\n📖 Available commands:');
        console.log('  help     - Show this help message');
        console.log('  status   - Show connection status');
        console.log('  quit     - Disconnect from server');
        console.log('  exit     - Disconnect from server');
        console.log('  (any other text) - Send a message to all connected clients');
    }
    
    /**
     * Shows the current connection status
     */
    showStatus() {
        console.log('\n📊 Connection Status:');
        console.log(`  Server: ${this.serverUrl}`);
        console.log(`  Connected: ${this.isConnected ? 'Yes' : 'No'}`);
        console.log(`  Client ID: ${this.clientId || 'Unknown'}`);
    }
    
    /**
     * Gracefully disconnects from the server
     */
    disconnect() {
        console.log('\n🛑 Disconnecting from server...');
        
        if (this.ws && this.isConnected) {
            // Close the WebSocket connection
            this.ws.close();
        }
        
        // Close the readline interface
        this.rl.close();
        
        console.log('✅ Disconnected');
        process.exit(0);
    }
}

// Export the BroadcastClient class so it can be used in other files
module.exports = BroadcastClient; 
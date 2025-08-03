/**
 * Broadcast Server Implementation
 * 
 * This module contains the WebSocket server that:
 * 1. Listens for incoming client connections
 * 2. Stores all connected clients
 * 3. Broadcasts messages from one client to all other clients
 * 4. Handles client disconnections gracefully
 * 
 * Key Concepts:
 * - WebSocket: A protocol that provides full-duplex communication channels over a single TCP connection
 * - Event-driven programming: The server responds to events like 'connection', 'message', 'close'
 * - Broadcasting: Sending a message from one client to all other connected clients
 */

const WebSocket = require('ws');

/**
 * BroadcastServer Class
 * 
 * This class encapsulates all the server functionality including:
 * - Managing WebSocket connections
 * - Broadcasting messages
 * - Handling client lifecycle events
 */
class BroadcastServer {
    /**
     * Constructor - Initializes the server
     * @param {number} port - The port number to listen on (default: 8080)
     */
    constructor(port = 8080) {
        this.port = port;
        
        // Array to store all connected clients
        // Each client is a WebSocket connection
        this.clients = new Set();
        
        // Create a new WebSocket server
        // The 'ws' library provides WebSocket server functionality
        this.wss = new WebSocket.Server({ port: this.port });
        
        // Bind event handlers to this instance
        // This ensures 'this' refers to the BroadcastServer instance in the event handlers
        this.handleConnection = this.handleConnection.bind(this);
        this.handleMessage = this.handleMessage.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleError = this.handleError.bind(this);
        
        // Set up event listeners
        this.setupEventListeners();
        
        console.log(`🚀 Broadcast server starting on port ${this.port}...`);
    }
    
    /**
     * Sets up event listeners for the WebSocket server
     * 
     * Event-driven programming is a key concept in Node.js:
     * - Instead of constantly checking for new connections, we listen for events
     * - When an event occurs (like a new connection), our handler function is called
     */
    setupEventListeners() {
        // Listen for new client connections
        // This event fires whenever a new client connects to the server
        this.wss.on('connection', this.handleConnection);
        
        // Listen for server errors
        this.wss.on('error', this.handleError);
        
        console.log('📡 Server is listening for connections...');
    }
    
    /**
     * Handles new client connections
     * @param {WebSocket} ws - The WebSocket connection object for the new client
     * @param {Object} req - The HTTP request object (contains client info)
     */
    handleConnection(ws, req) {
        // Get client information for logging
        const clientAddress = req.socket.remoteAddress;
        const clientPort = req.socket.remotePort;
        const clientId = `${clientAddress}:${clientPort}`;
        
        console.log(`✅ New client connected: ${clientId}`);
        
        // Add the new client to our set of connected clients
        // Using a Set ensures we don't have duplicate clients
        this.clients.add(ws);
        
        // Send a welcome message to the new client
        const welcomeMessage = {
            type: 'system',
            content: 'Welcome to the broadcast server! Send a message to broadcast it to all connected clients.',
            timestamp: new Date().toISOString(),
            clientId: clientId
        };
        
        ws.send(JSON.stringify(welcomeMessage));
        
        // Broadcast to all other clients that a new user has joined
        this.broadcastToOthers(ws, {
            type: 'system',
            content: `A new client (${clientId}) has joined the server`,
            timestamp: new Date().toISOString(),
            clientId: clientId
        });
        
        // Set up event listeners for this specific client
        this.setupClientEventListeners(ws, clientId);
        
        // Log the current number of connected clients
        console.log(`📊 Total clients connected: ${this.clients.size}`);
    }
    
    /**
     * Sets up event listeners for a specific client
     * @param {WebSocket} ws - The WebSocket connection for this client
     * @param {string} clientId - Unique identifier for this client
     */
    setupClientEventListeners(ws, clientId) {
        // Listen for messages from this client
        ws.on('message', (data) => this.handleMessage(ws, data, clientId));
        
        // Listen for when this client disconnects
        ws.on('close', () => this.handleClose(ws, clientId));
        
        // Listen for errors from this client
        ws.on('error', (error) => this.handleError(error, clientId));
    }
    
    /**
     * Handles incoming messages from clients
     * @param {WebSocket} ws - The WebSocket connection that sent the message
     * @param {Buffer|string} data - The raw message data
     * @param {string} clientId - Identifier for the client that sent the message
     */
    handleMessage(ws, data, clientId) {
        try {
            // Convert the raw data to a string
            // WebSocket messages can come as Buffer or string
            const messageText = data.toString().trim();
            
            // Don't process empty messages
            if (!messageText) {
                return;
            }
            
            console.log(`📨 Message from ${clientId}: ${messageText}`);
            
            // Create a message object with metadata
            const messageObject = {
                type: 'broadcast',
                content: messageText,
                timestamp: new Date().toISOString(),
                clientId: clientId
            };
            
            // Broadcast the message to all other connected clients
            this.broadcastToOthers(ws, messageObject);
            
            // Send a confirmation back to the sender
            const confirmation = {
                type: 'confirmation',
                content: 'Message sent successfully!',
                timestamp: new Date().toISOString()
            };
            
            ws.send(JSON.stringify(confirmation));
            
        } catch (error) {
            console.error(`❌ Error processing message from ${clientId}:`, error);
            
            // Send error message back to the client
            const errorMessage = {
                type: 'error',
                content: 'Failed to process your message',
                timestamp: new Date().toISOString()
            };
            
            ws.send(JSON.stringify(errorMessage));
        }
    }
    
    /**
     * Broadcasts a message to all clients except the sender
     * @param {WebSocket} sender - The WebSocket connection of the message sender
     * @param {Object} message - The message object to broadcast
     */
    broadcastToOthers(sender, message) {
        // Convert the message object to a JSON string
        const messageString = JSON.stringify(message);
        
        // Counter for successful broadcasts
        let broadcastCount = 0;
        
        // Iterate through all connected clients
        this.clients.forEach((client) => {
            // Skip the sender (we don't want to send the message back to them)
            if (client === sender) {
                return;
            }
            
            // Check if the client connection is still open
            if (client.readyState === WebSocket.OPEN) {
                try {
                    // Send the message to this client
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
     * Handles client disconnections
     * @param {WebSocket} ws - The WebSocket connection that was closed
     * @param {string} clientId - Identifier for the disconnected client
     */
    handleClose(ws, clientId) {
        console.log(`👋 Client disconnected: ${clientId}`);
        
        // Remove the client from our set of connected clients
        this.clients.delete(ws);
        
        // Broadcast to remaining clients that someone has left
        const leaveMessage = {
            type: 'system',
            content: `Client ${clientId} has left the server`,
            timestamp: new Date().toISOString(),
            clientId: clientId
        };
        
        this.broadcastToAll(leaveMessage);
        
        // Log the current number of connected clients
        console.log(`📊 Total clients connected: ${this.clients.size}`);
    }
    
    /**
     * Broadcasts a message to ALL connected clients (including the sender)
     * @param {Object} message - The message object to broadcast
     */
    broadcastToAll(message) {
        const messageString = JSON.stringify(message);
        let broadcastCount = 0;
        
        this.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
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
     * Handles server and client errors
     * @param {Error} error - The error object
     * @param {string} clientId - Optional client identifier
     */
    handleError(error, clientId = 'server') {
        console.error(`❌ Error on ${clientId}:`, error.message);
    }
    
    /**
     * Gracefully shuts down the server
     * This method is called when the server needs to be stopped
     */
    shutdown() {
        console.log('🛑 Shutting down broadcast server...');
        
        // Close all client connections
        this.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.close();
            }
        });
        
        // Clear the clients set
        this.clients.clear();
        
        // Close the WebSocket server
        this.wss.close(() => {
            console.log('✅ Server shutdown complete');
            process.exit(0);
        });
    }
    
    /**
     * Gets the current number of connected clients
     * @returns {number} Number of connected clients
     */
    getClientCount() {
        return this.clients.size;
    }
}

// Export the BroadcastServer class so it can be used in other files
module.exports = BroadcastServer; 
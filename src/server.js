/**
 * ============================================================================
 * BROADCAST SERVER IMPLEMENTATION
 * ============================================================================
 * 
 * This module contains the WebSocket server that creates a real-time messaging
 * system where multiple clients can connect and send messages to each other.
 * 
 * 🎯 WHAT THIS SERVER DOES:
 * 1. Listens for incoming client connections on a specified port
 * 2. Stores all connected clients in memory
 * 3. Broadcasts messages from one client to all other connected clients
 * 4. Handles client connections and disconnections gracefully
 * 5. Provides system messages (welcome, join/leave notifications)
 * 
 * 🔑 KEY CONCEPTS EXPLAINED:
 * 
 * WebSocket:
 * - Think of WebSocket as a "phone call" that stays connected
 * - Unlike regular web requests (where you ask for something and get a response once),
 *   WebSockets keep the connection open so both sides can send messages anytime
 * - This enables real-time communication (like chat apps, live games, etc.)
 * 
 * Event-driven Programming:
 * - Instead of constantly checking "is there a new message?", we tell the computer:
 *   "When someone connects, run this function" or "When a message arrives, run that function"
 * - This is much more efficient and responsive
 * 
 * Broadcasting:
 * - When one person sends a message, everyone else gets it instantly
 * - Like a group chat where your message goes to everyone except yourself
 * 
 * Set Data Structure:
 * - A Set is like an array but with unique values only
 * - Perfect for storing clients because we don't want duplicates
 * - Has methods like .add(), .delete(), .has(), .size
 * 
 * JSON (JavaScript Object Notation):
 * - A way to structure data that can be easily sent over the network
 * - Looks like: { "name": "John", "age": 30, "city": "New York" }
 * - JSON.stringify() converts objects to strings for sending
 * - JSON.parse() converts strings back to objects when receiving
 */

// Import the WebSocket library
// The 'ws' library provides WebSocket functionality for Node.js
// We use 'require' to import external libraries in Node.js
const WebSocket = require('ws');

/**
 * ============================================================================
 * BROADCASTSERVER CLASS
 * ============================================================================
 * 
 * This class is like a blueprint for creating a broadcast server.
 * Think of it as a factory that creates servers with all the necessary
 * functionality built-in.
 * 
 * A class in JavaScript is a way to group related data and functions together.
 * It's like creating a custom type with its own properties and methods.
 */
class BroadcastServer {
    
    /**
     * ============================================================================
     * CONSTRUCTOR - THE INITIALIZATION FUNCTION
     * ============================================================================
     * 
     * The constructor is a special function that runs when we create a new
     * BroadcastServer instance. It sets up everything the server needs to work.
     * 
     * @param {number} port - The port number to listen on (default: 8080)
     * 
     * What is a port?
     * - A port is like a door number on a building
     * - Your computer has many doors (ports) for different services
     * - Port 80 is for web traffic, port 22 for SSH, port 8080 for our server
     * - Only one service can use a port at a time
     */
    constructor(port = 8080) {
        // Store the port number for later use
        this.port = port;
        
        // Create a Set to store all connected clients
        // A Set is like an array but only stores unique values
        // Each client will be a WebSocket connection object
        this.clients = new Set();
        
        // Create a new WebSocket server instance
        // This is like opening a door (port) and waiting for people to come in
        // The 'ws' library handles all the complex WebSocket protocol details
        this.wss = new WebSocket.Server({ port: this.port });
        
        // ============================================================================
        // BINDING EVENT HANDLERS - A CRITICAL CONCEPT
        // ============================================================================
        // 
        // In JavaScript, when a function is called as an event handler,
        // the 'this' keyword might not refer to our BroadcastServer instance.
        // By using .bind(this), we ensure that 'this' always refers to our server.
        // 
        // Think of it like this: "When this function runs, make sure it knows
        // it belongs to this BroadcastServer instance"
        this.handleConnection = this.handleConnection.bind(this);
        this.handleMessage = this.handleMessage.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleError = this.handleError.bind(this);
        
        // Set up all the event listeners
        this.setupEventListeners();
        
        // Log that the server is starting
        console.log(`🚀 Broadcast server starting on port ${this.port}...`);
    }
    
    /**
     * ============================================================================
     * SETUP EVENT LISTENERS - THE "LISTENING" FUNCTION
     * ============================================================================
     * 
     * This function sets up the server to "listen" for specific events.
     * Think of it like setting up security cameras that watch for specific things.
     * 
     * Event-driven programming is a fundamental concept in Node.js:
     * - Instead of constantly checking "is there a new connection?", we say:
     *   "When someone connects, run this function"
     * - This is much more efficient and responsive
     * - It's like having a doorbell instead of constantly checking if someone's at the door
     */
    setupEventListeners() {
        // Listen for new client connections
        // This is like setting up a doorbell that rings when someone arrives
        // When a new client connects, the handleConnection function will be called
        this.wss.on('connection', this.handleConnection);
        
        // Listen for server errors
        // This catches any errors that happen at the server level
        this.wss.on('error', this.handleError);
        
        console.log('📡 Server is listening for connections...');
    }
    
    /**
     * ============================================================================
     * HANDLE CONNECTION - WELCOMING NEW CLIENTS
     * ============================================================================
     * 
     * This function is called whenever a new client connects to the server.
     * Think of it as the "greeter" at a party who welcomes new guests.
     * 
     * @param {WebSocket} ws - The WebSocket connection object for the new client
     * @param {Object} req - The HTTP request object (contains client info like IP address)
     */
    handleConnection(ws, req) {
        // ============================================================================
        // GETTING CLIENT INFORMATION
        // ============================================================================
        // 
        // We extract information about the client from the request object
        // This helps us identify and log which client is connecting
        const clientAddress = req.socket.remoteAddress;  // IP address (like 192.168.1.100)
        const clientPort = req.socket.remotePort;        // Port number (like 54321)
        const clientId = `${clientAddress}:${clientPort}`; // Unique identifier
        
        console.log(`✅ New client connected: ${clientId}`);
        
        // ============================================================================
        // ADDING CLIENT TO OUR LIST
        // ============================================================================
        // 
        // We add the new client to our Set of connected clients
        // The Set ensures we don't have duplicate entries
        this.clients.add(ws);
        
        // ============================================================================
        // SENDING WELCOME MESSAGE
        // ============================================================================
        // 
        // We create a welcome message object with all the necessary information
        // This message will be sent to the new client
        const welcomeMessage = {
            type: 'system',           // Type of message (system, broadcast, confirmation, error)
            content: 'Welcome to the broadcast server! Send a message to broadcast it to all connected clients.',
            timestamp: new Date().toISOString(),  // When the message was created
            clientId: clientId        // Who this message is for
        };
        
        // Convert the message object to a JSON string and send it
        // JSON.stringify() converts JavaScript objects to strings for transmission
        ws.send(JSON.stringify(welcomeMessage));
        
        // ============================================================================
        // NOTIFYING OTHER CLIENTS
        // ============================================================================
        // 
        // We tell all other connected clients that someone new has joined
        // This creates a sense of community and awareness
        this.broadcastToOthers(ws, {
            type: 'system',
            content: `A new client (${clientId}) has joined the server`,
            timestamp: new Date().toISOString(),
            clientId: clientId
        });
        
        // ============================================================================
        // SETTING UP CLIENT-SPECIFIC EVENT LISTENERS
        // ============================================================================
        // 
        // Each client needs its own event listeners for messages, disconnections, etc.
        // This is like giving each guest their own personal assistant
        this.setupClientEventListeners(ws, clientId);
        
        // Log the current number of connected clients
        console.log(`📊 Total clients connected: ${this.clients.size}`);
    }
    
    /**
     * ============================================================================
     * SETUP CLIENT EVENT LISTENERS - PERSONAL ASSISTANTS FOR EACH CLIENT
     * ============================================================================
     * 
     * This function sets up event listeners for a specific client.
     * Think of it as assigning a personal assistant to each guest at the party.
     * 
     * @param {WebSocket} ws - The WebSocket connection for this client
     * @param {string} clientId - Unique identifier for this client
     */
    setupClientEventListeners(ws, clientId) {
        // Listen for messages from this specific client
        // When this client sends a message, handleMessage will be called
        ws.on('message', (data) => this.handleMessage(ws, data, clientId));
        
        // Listen for when this client disconnects
        // When this client leaves, handleClose will be called
        ws.on('close', () => this.handleClose(ws, clientId));
        
        // Listen for errors from this client
        // If something goes wrong with this client, handleError will be called
        ws.on('error', (error) => this.handleError(error, clientId));
    }
    
    /**
     * ============================================================================
     * HANDLE MESSAGE - PROCESSING INCOMING MESSAGES
     * ============================================================================
     * 
     * This function is called whenever a client sends a message to the server.
     * Think of it as the "message processing center" that handles all incoming mail.
     * 
     * @param {WebSocket} ws - The WebSocket connection that sent the message
     * @param {Buffer|string} data - The raw message data (can be Buffer or string)
     * @param {string} clientId - Identifier for the client that sent the message
     */
    handleMessage(ws, data, clientId) {
        // ============================================================================
        // ERROR HANDLING WITH TRY-CATCH
        // ============================================================================
        // 
        // Try-catch is like having a safety net. If something goes wrong in the
        // "try" block, the "catch" block will handle the error gracefully.
        try {
            // ============================================================================
            // CONVERTING RAW DATA TO STRING
            // ============================================================================
            // 
            // WebSocket messages can come as Buffer (binary data) or string
            // We convert everything to string for easier processing
            const messageText = data.toString().trim();
            
            // ============================================================================
            // VALIDATION - CHECKING FOR EMPTY MESSAGES
            // ============================================================================
            // 
            // We don't want to process empty messages (just spaces or nothing)
            // The 'return' statement exits the function early
            if (!messageText) {
                return;
            }
            
            console.log(`📨 Message from ${clientId}: ${messageText}`);
            
            // ============================================================================
            // CREATING MESSAGE OBJECT
            // ============================================================================
            // 
            // We create a structured message object with metadata
            // This makes it easier for clients to understand and display the message
            const messageObject = {
                type: 'broadcast',                    // Type of message
                content: messageText,                 // The actual message text
                timestamp: new Date().toISOString(),  // When the message was sent
                clientId: clientId                    // Who sent the message
            };
            
            // ============================================================================
            // BROADCASTING TO OTHER CLIENTS
            // ============================================================================
            // 
            // We send the message to all other connected clients
            // The sender doesn't receive their own message back
            this.broadcastToOthers(ws, messageObject);
            
            // ============================================================================
            // SENDING CONFIRMATION TO SENDER
            // ============================================================================
            // 
            // We send a confirmation message back to the person who sent the message
            // This lets them know their message was received and processed
            const confirmation = {
                type: 'confirmation',
                content: 'Message sent successfully!',
                timestamp: new Date().toISOString()
            };
            
            ws.send(JSON.stringify(confirmation));
            
        } catch (error) {
            // ============================================================================
            // ERROR HANDLING
            // ============================================================================
            // 
            // If something goes wrong while processing the message, we log the error
            // and send an error message back to the client
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
     * ============================================================================
     * BROADCAST TO OTHERS - SENDING MESSAGES TO EVERYONE EXCEPT SENDER
     * ============================================================================
     * 
     * This function sends a message to all connected clients except the one who sent it.
     * Think of it as a PA system that broadcasts to everyone except the speaker.
     * 
     * @param {WebSocket} sender - The WebSocket connection of the message sender
     * @param {Object} message - The message object to broadcast
     */
    broadcastToOthers(sender, message) {
        // ============================================================================
        // CONVERTING MESSAGE TO JSON STRING
        // ============================================================================
        // 
        // WebSocket can only send strings or binary data
        // We convert our JavaScript object to a JSON string for transmission
        const messageString = JSON.stringify(message);
        
        // Counter to track how many clients successfully received the message
        let broadcastCount = 0;
        
        // ============================================================================
        // ITERATING THROUGH ALL CONNECTED CLIENTS
        // ============================================================================
        // 
        // We use forEach to go through each client in our Set
        // forEach is like a loop that runs once for each item in a collection
        this.clients.forEach((client) => {
            // ============================================================================
            // SKIPPING THE SENDER
            // ============================================================================
            // 
            // We don't want to send the message back to the person who sent it
            // The 'return' statement skips to the next client
            if (client === sender) {
                return;
            }
            
            // ============================================================================
            // CHECKING CONNECTION STATUS
            // ============================================================================
            // 
            // WebSocket connections have different states:
            // - CONNECTING (0): Still trying to connect
            // - OPEN (1): Connected and ready to send/receive
            // - CLOSING (2): In the process of closing
            // - CLOSED (3): Connection is closed
            // 
            // We only send messages to clients with OPEN connections
            if (client.readyState === WebSocket.OPEN) {
                try {
                    // Send the message to this client
                    client.send(messageString);
                    broadcastCount++;
                } catch (error) {
                    // If sending fails, log the error but continue with other clients
                    console.error('❌ Error sending message to client:', error);
                }
            }
        });
        
        console.log(`📢 Message broadcasted to ${broadcastCount} clients`);
    }
    
    /**
     * ============================================================================
     * HANDLE CLOSE - WHEN CLIENTS DISCONNECT
     * ============================================================================
     * 
     * This function is called when a client disconnects from the server.
     * Think of it as the "goodbye handler" that cleans up when someone leaves the party.
     * 
     * @param {WebSocket} ws - The WebSocket connection that was closed
     * @param {string} clientId - Identifier for the disconnected client
     */
    handleClose(ws, clientId) {
        console.log(`👋 Client disconnected: ${clientId}`);
        
        // ============================================================================
        // REMOVING CLIENT FROM OUR LIST
        // ============================================================================
        // 
        // We remove the disconnected client from our Set of connected clients
        // This keeps our list clean and accurate
        this.clients.delete(ws);
        
        // ============================================================================
        // NOTIFYING REMAINING CLIENTS
        // ============================================================================
        // 
        // We tell all remaining clients that someone has left
        // This helps maintain awareness of who's still in the chat
        const leaveMessage = {
            type: 'system',
            content: `Client ${clientId} has left the server`,
            timestamp: new Date().toISOString(),
            clientId: clientId
        };
        
        // We use broadcastToAll here because we want everyone to know
        this.broadcastToAll(leaveMessage);
        
        // Log the current number of connected clients
        console.log(`📊 Total clients connected: ${this.clients.size}`);
    }
    
    /**
     * ============================================================================
     * BROADCAST TO ALL - SENDING MESSAGES TO EVERYONE INCLUDING SENDER
     * ============================================================================
     * 
     * This function sends a message to ALL connected clients, including the sender.
     * Think of it as a PA system that broadcasts to everyone in the room.
     * 
     * @param {Object} message - The message object to broadcast
     */
    broadcastToAll(message) {
        // Convert the message object to a JSON string
        const messageString = JSON.stringify(message);
        
        // Counter for successful broadcasts
        let broadcastCount = 0;
        
        // Go through all connected clients
        this.clients.forEach((client) => {
            // Only send to clients with open connections
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
     * ============================================================================
     * HANDLE ERROR - ERROR MANAGEMENT
     * ============================================================================
     * 
     * This function handles errors that occur on the server or with clients.
     * Think of it as the "emergency response team" that deals with problems.
     * 
     * @param {Error} error - The error object containing error details
     * @param {string} clientId - Optional client identifier (defaults to 'server')
     */
    handleError(error, clientId = 'server') {
        // Log the error with details about where it occurred
        console.error(`❌ Error on ${clientId}:`, error.message);
    }
    
    /**
     * ============================================================================
     * SHUTDOWN - GRACEFUL SERVER SHUTDOWN
     * ============================================================================
     * 
     * This function gracefully shuts down the server when it needs to be stopped.
     * Think of it as the "closing time" procedure that ensures everyone leaves safely.
     * 
     * Why graceful shutdown is important:
     * - Prevents data loss
     * - Ensures all clients are properly disconnected
     * - Frees up system resources
     * - Provides a clean exit
     */
    shutdown() {
        console.log('🛑 Shutting down broadcast server...');
        
        // ============================================================================
        // CLOSING ALL CLIENT CONNECTIONS
        // ============================================================================
        // 
        // We go through all connected clients and close their connections
        // This ensures no clients are left hanging
        this.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.close();
            }
        });
        
        // ============================================================================
        // CLEARING THE CLIENTS LIST
        // ============================================================================
        // 
        // We clear our Set of clients to free up memory
        this.clients.clear();
        
        // ============================================================================
        // CLOSING THE WEBSOCKET SERVER
        // ============================================================================
        // 
        // We close the WebSocket server itself
        // The callback function runs when the server is fully closed
        this.wss.close(() => {
            console.log('✅ Server shutdown complete');
            // Exit the Node.js process with code 0 (success)
            process.exit(0);
        });
    }
    
    /**
     * ============================================================================
     * GET CLIENT COUNT - UTILITY FUNCTION
     * ============================================================================
     * 
     * This function returns the current number of connected clients.
     * Think of it as a "head count" function.
     * 
     * @returns {number} Number of connected clients
     */
    getClientCount() {
        return this.clients.size;
    }
}

// ============================================================================
// EXPORTING THE CLASS
// ============================================================================
// 
// We export the BroadcastServer class so other files can use it
// This is like making the class available for import in other parts of the application
// 
// In other files, you can use: const BroadcastServer = require('./server.js');
module.exports = BroadcastServer; 
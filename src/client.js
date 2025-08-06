/**
 * ============================================================================
 * BROADCAST CLIENT IMPLEMENTATION
 * ============================================================================
 * 
 * This module contains the WebSocket client that connects to the broadcast server
 * and provides an interactive interface for real-time messaging.
 * 
 * 🎯 WHAT THIS CLIENT DOES:
 * 1. Connects to a WebSocket broadcast server
 * 2. Provides an interactive command-line interface for users
 * 3. Sends messages to the server for broadcasting to other clients
 * 4. Receives and displays messages from other clients in real-time
 * 5. Handles connection status, errors, and graceful disconnection
 * 6. Provides built-in commands (help, status, quit)
 * 
 * 🔑 KEY CONCEPTS EXPLAINED:
 * 
 * WebSocket Client:
 * - Think of this as the "phone" that connects to the server
 * - It establishes a persistent connection to the broadcast server
 * - Can send messages anytime and receive messages instantly
 * - Unlike regular web requests, the connection stays open
 * 
 * Interactive Command-Line Interface:
 * - Users can type messages and press Enter to send them
 * - The interface continuously listens for user input
 * - Provides real-time feedback and message display
 * - Supports special commands like 'help', 'status', 'quit'
 * 
 * Event-Driven Programming:
 * - The client responds to events like connection open, message received, etc.
 * - Instead of constantly checking for new messages, it waits for events
 * - This makes the application responsive and efficient
 * 
 * Readline Interface:
 * - A Node.js module that provides interactive input/output
 * - Allows reading user input from the command line
 * - Handles special keys like Ctrl+C gracefully
 * - Provides a prompt for user interaction
 * 
 * Message Types:
 * - 'broadcast': Messages from other clients
 * - 'system': Server notifications (welcome, join/leave)
 * - 'confirmation': Success confirmations for sent messages
 * - 'error': Error messages from the server
 */

// Import required Node.js modules
// The 'ws' library provides WebSocket client functionality
// The 'readline' module provides interactive command-line interface
const WebSocket = require('ws');
const readline = require('readline');

/**
 * ============================================================================
 * BROADCASTCLIENT CLASS
 * ============================================================================
 * 
 * This class is like a "smart phone" that connects to the broadcast server.
 * It handles all the client-side functionality including connection management,
 * message sending/receiving, and user interaction.
 * 
 * Think of it as a complete messaging app that runs in the command line.
 */
class BroadcastClient {
    
    /**
     * ============================================================================
     * CONSTRUCTOR - THE INITIALIZATION FUNCTION
     * ============================================================================
     * 
     * The constructor sets up everything the client needs to work.
     * It's like turning on a phone and preparing it for use.
     * 
     * @param {string} serverUrl - The WebSocket URL to connect to (default: ws://localhost:8080)
     * 
     * What is a WebSocket URL?
     * - ws://localhost:8080 means "connect to WebSocket server on localhost, port 8080"
     * - ws:// is the WebSocket protocol (like http:// for web pages)
     * - localhost means "this computer" (127.0.0.1)
     * - 8080 is the port number where the server is listening
     */
    constructor(serverUrl = 'ws://localhost:8080') {
        // Store the server URL for later use
        this.serverUrl = serverUrl;
        
        // WebSocket connection object (will be set when we connect)
        this.ws = null;
        
        // Track connection status
        this.isConnected = false;
        
        // Client identifier (set by server when we connect)
        this.clientId = null;
        
        // ============================================================================
        // CREATING THE READLINE INTERFACE
        // ============================================================================
        // 
        // Readline is like creating a "chat window" in the command line
        // It allows users to type messages and see responses
        this.rl = readline.createInterface({
            input: process.stdin,   // Read from keyboard input
            output: process.stdout  // Write to screen output
        });
        
        // ============================================================================
        // BINDING EVENT HANDLERS - CRITICAL FOR 'THIS' CONTEXT
        // ============================================================================
        // 
        // When these functions are called as event handlers, we want 'this' to refer
        // to our BroadcastClient instance, not the event emitter
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
     * 
     * This method creates the WebSocket connection to the server.
     * Think of it as "dialing the phone number" to connect to the server.
     */
    connect() {
        // ============================================================================
        // ERROR HANDLING WITH TRY-CATCH
        // ============================================================================
        // 
        // We wrap the connection attempt in try-catch to handle any errors
        // that might occur during the connection process
        try {
            // ============================================================================
            // CREATING THE WEBSOCKET CONNECTION
            // ============================================================================
            // 
            // This creates a new WebSocket connection to the specified server
            // It's like creating a new phone call
            this.ws = new WebSocket(this.serverUrl);
            
            // ============================================================================
            // SETTING UP EVENT LISTENERS
            // ============================================================================
            // 
            // We set up listeners for various events that might occur
            // This is like setting up call waiting, voicemail, etc.
            this.setupEventListeners();
            
        } catch (error) {
            // ============================================================================
            // HANDLING CONNECTION ERRORS
            // ============================================================================
            // 
            // If something goes wrong during connection setup, we log the error
            // and exit the program with an error code
            console.error('❌ Failed to create WebSocket connection:', error.message);
            process.exit(1);  // Exit with error code 1
        }
    }
    
    /**
     * ============================================================================
     * SETUP EVENT LISTENERS - THE "LISTENING" FUNCTION
     * ============================================================================
     * 
     * This function sets up all the event listeners for the WebSocket connection.
     * Think of it as setting up all the features on your phone (call waiting,
     * voicemail, text messaging, etc.).
     * 
     * WebSocket connections have several important events:
     * - 'open': Fired when the connection is successfully established
     * - 'message': Fired when a message is received from the server
     * - 'close': Fired when the connection is closed (by server or client)
     * - 'error': Fired when an error occurs during the connection
     */
    setupEventListeners() {
        // ============================================================================
        // CONNECTION ESTABLISHED EVENT
        // ============================================================================
        // 
        // This event fires when we successfully connect to the server
        // It's like hearing "Hello?" when someone answers your phone call
        this.ws.on('open', this.handleOpen);
        
        // ============================================================================
        // MESSAGE RECEIVED EVENT
        // ============================================================================
        // 
        // This event fires whenever we receive a message from the server
        // It's like receiving a text message or hearing someone speak
        this.ws.on('message', this.handleMessage);
        
        // ============================================================================
        // CONNECTION CLOSED EVENT
        // ============================================================================
        // 
        // This event fires when the connection is closed
        // It's like when someone hangs up the phone
        this.ws.on('close', this.handleClose);
        
        // ============================================================================
        // ERROR EVENT
        // ============================================================================
        // 
        // This event fires when something goes wrong with the connection
        // It's like when the call gets disconnected due to poor signal
        this.ws.on('error', this.handleError);
    }
    
    /**
     * ============================================================================
     * HANDLE OPEN - CONNECTION SUCCESSFULLY ESTABLISHED
     * ============================================================================
     * 
     * This function is called when we successfully connect to the server.
     * Think of it as the "Hello, I'm here!" moment when you successfully
     * connect to someone on the phone.
     */
    handleOpen() {
        // ============================================================================
        // UPDATING CONNECTION STATUS
        // ============================================================================
        // 
        // We mark ourselves as connected so other parts of the code know
        // that we have an active connection
        this.isConnected = true;
        
        // ============================================================================
        // DISPLAYING CONNECTION SUCCESS
        // ============================================================================
        // 
        // We show the user that we're connected and provide instructions
        console.log('✅ Connected to broadcast server!');
        console.log('💡 Type your messages and press Enter to send them.');
        console.log('💡 Type "quit" or "exit" to disconnect.');
        console.log('─'.repeat(50));  // Create a visual separator line
        
        // ============================================================================
        // STARTING USER INTERACTION
        // ============================================================================
        // 
        // Now that we're connected, we start listening for user input
        // This is like starting to listen for what the user wants to say
        this.startInputListener();
    }
    
    /**
     * ============================================================================
     * HANDLE MESSAGE - PROCESSING INCOMING MESSAGES
     * ============================================================================
     * 
     * This function is called whenever we receive a message from the server.
     * Think of it as the "message processing center" that handles all incoming mail.
     * 
     * @param {Buffer|string} data - The raw message data from the server
     */
    handleMessage(data) {
        // ============================================================================
        // ERROR HANDLING WITH TRY-CATCH
        // ============================================================================
        // 
        // We wrap message processing in try-catch to handle any errors
        // that might occur while processing the message
        try {
            // ============================================================================
            // CONVERTING RAW DATA TO STRING
            // ============================================================================
            // 
            // WebSocket messages can come as Buffer (binary data) or string
            // We convert everything to string for easier processing
            const messageString = data.toString();
            
            // ============================================================================
            // PARSING JSON MESSAGES
            // ============================================================================
            // 
            // The server sends structured messages as JSON
            // We try to parse them, but handle cases where they might not be JSON
            let message;
            try {
                // Try to parse the message as JSON
                // JSON.parse() converts a JSON string back to a JavaScript object
                message = JSON.parse(messageString);
            } catch (parseError) {
                // ============================================================================
                // FALLBACK FOR NON-JSON MESSAGES
                // ============================================================================
                // 
                // If the message isn't valid JSON, we treat it as plain text
                // This provides backward compatibility and error resilience
                message = {
                    type: 'text',
                    content: messageString,
                    timestamp: new Date().toISOString()
                };
            }
            
            // ============================================================================
            // DISPLAYING THE MESSAGE
            // ============================================================================
            // 
            // We pass the parsed message to our display function
            // This will show it to the user in a formatted way
            this.displayMessage(message);
            
        } catch (error) {
            // ============================================================================
            // HANDLING MESSAGE PROCESSING ERRORS
            // ============================================================================
            // 
            // If something goes wrong while processing the message, we log the error
            // but don't crash the application
            console.error('❌ Error processing received message:', error.message);
        }
    }
    
    /**
     * ============================================================================
     * DISPLAY MESSAGE - FORMATTING AND SHOWING MESSAGES
     * ============================================================================
     * 
     * This function displays messages to the user based on their type.
     * Think of it as the "message formatter" that makes messages look nice
     * and easy to read.
     * 
     * @param {Object} message - The message object with type, content, timestamp, etc.
     */
    displayMessage(message) {
        // ============================================================================
        // FORMATTING TIMESTAMP
        // ============================================================================
        // 
        // We convert the ISO timestamp to a readable local time format
        // This makes it easier for users to understand when messages were sent
        const timestamp = new Date(message.timestamp).toLocaleTimeString();
        
        // ============================================================================
        // HANDLING DIFFERENT MESSAGE TYPES
        // ============================================================================
        // 
        // We use a switch statement to handle different types of messages
        // Each type gets displayed differently for better user experience
        switch (message.type) {
            case 'broadcast':
                // ============================================================================
                // BROADCAST MESSAGES - FROM OTHER CLIENTS
                // ============================================================================
                // 
                // These are messages from other users in the chat
                // We show who sent it and what they said
                console.log(`\n📨 [${timestamp}] ${message.clientId}: ${message.content}`);
                break;
                
            case 'system':
                // ============================================================================
                // SYSTEM MESSAGES - SERVER NOTIFICATIONS
                // ============================================================================
                // 
                // These are notifications from the server (welcome, join/leave, etc.)
                // We show them with a bell icon to distinguish them from user messages
                console.log(`\n🔔 [${timestamp}] ${message.content}`);
                break;
                
            case 'confirmation':
                // ============================================================================
                // CONFIRMATION MESSAGES - SUCCESS NOTIFICATIONS
                // ============================================================================
                // 
                // These confirm that our message was successfully sent
                // We show them with a checkmark to indicate success
                console.log(`\n✅ [${timestamp}] ${message.content}`);
                break;
                
            case 'error':
                // ============================================================================
                // ERROR MESSAGES - SERVER ERRORS
                // ============================================================================
                // 
                // These are error messages from the server
                // We show them with an X icon to indicate problems
                console.log(`\n❌ [${timestamp}] Error: ${message.content}`);
                break;
                
            default:
                // ============================================================================
                // UNKNOWN MESSAGE TYPES - FALLBACK
                // ============================================================================
                // 
                // If we receive a message type we don't recognize, we display it as plain text
                // This ensures we don't lose any messages, even if they're in an unknown format
                console.log(`\n📨 [${timestamp}] ${message.content}`);
        }
        
        // ============================================================================
        // SHOWING INPUT PROMPT AGAIN
        // ============================================================================
        // 
        // After displaying a message, we show the input prompt again
        // This ensures the user knows they can continue typing
        this.showInputPrompt();
    }
    
    /**
     * ============================================================================
     * HANDLE CLOSE - CONNECTION CLOSED
     * ============================================================================
     * 
     * This function is called when the connection to the server is closed.
     * Think of it as the "goodbye" handler when someone hangs up the phone.
     */
    handleClose() {
        // ============================================================================
        // UPDATING CONNECTION STATUS
        // ============================================================================
        // 
        // We mark ourselves as disconnected
        this.isConnected = false;
        
        // ============================================================================
        // INFORMING THE USER
        // ============================================================================
        // 
        // We let the user know that the connection has been closed
        console.log('\n👋 Disconnected from broadcast server');
        
        // ============================================================================
        // CLEANING UP RESOURCES
        // ============================================================================
        // 
        // We close the readline interface to free up system resources
        this.rl.close();
        
        // ============================================================================
        // EXITING THE PROGRAM
        // ============================================================================
        // 
        // We exit the program with code 0 (success) since this is a normal disconnection
        process.exit(0);
    }
    
    /**
     * ============================================================================
     * HANDLE ERROR - WEBSOCKET ERRORS
     * ============================================================================
     * 
     * This function handles errors that occur with the WebSocket connection.
     * Think of it as the "troubleshooting" function when something goes wrong.
     * 
     * @param {Error} error - The error object containing error details
     */
    handleError(error) {
        // ============================================================================
        // LOGGING THE ERROR
        // ============================================================================
        // 
        // We log the error so we can understand what went wrong
        console.error('❌ WebSocket error:', error.message);
        
        // ============================================================================
        // HANDLING CONNECTION FAILURES
        // ============================================================================
        // 
        // If we're not connected and get an error, it means the connection failed
        // We provide helpful information and exit the program
        if (!this.isConnected) {
            console.error('❌ Failed to connect to server. Make sure the server is running.');
            process.exit(1);  // Exit with error code 1
        }
    }
    
    /**
     * ============================================================================
     * START INPUT LISTENER - BEGINNING USER INTERACTION
     * ============================================================================
     * 
     * This method sets up the interactive interface where users can type messages.
     * Think of it as "opening the chat window" where users can start typing.
     */
    startInputListener() {
        // ============================================================================
        // SHOWING THE INITIAL PROMPT
        // ============================================================================
        // 
        // We show the input prompt to let the user know they can start typing
        this.showInputPrompt();
        
        // ============================================================================
        // LISTENING FOR USER INPUT
        // ============================================================================
        // 
        // We set up a listener for when the user types something and presses Enter
        // This is like having someone ready to take your message
        this.rl.on('line', (input) => {
            this.handleUserInput(input.trim());
        });
        
        // ============================================================================
        // HANDLING CTRL+C GRACEFULLY
        // ============================================================================
        // 
        // We listen for the SIGINT signal (Ctrl+C) and handle it gracefully
        // This ensures the user can exit the program cleanly
        this.rl.on('SIGINT', () => {
            this.disconnect();
        });
    }
    
    /**
     * ============================================================================
     * SHOW INPUT PROMPT - DISPLAYING THE TYPING PROMPT
     * ============================================================================
     * 
     * This function shows the input prompt to the user.
     * Think of it as the "cursor" that shows where the user can type.
     */
    showInputPrompt() {
        // ============================================================================
        // WRITING THE PROMPT
        // ============================================================================
        // 
        // We use process.stdout.write instead of console.log to avoid adding a newline
        // This keeps the prompt on the same line as where the user will type
        process.stdout.write('\n💬 You: ');
    }
    
    /**
     * ============================================================================
     * HANDLE USER INPUT - PROCESSING USER COMMANDS AND MESSAGES
     * ============================================================================
     * 
     * This function processes what the user types and decides what to do with it.
     * Think of it as the "command center" that interprets user input.
     * 
     * @param {string} input - The user's input (what they typed)
     */
    handleUserInput(input) {
        // ============================================================================
        // CHECKING FOR QUIT COMMANDS
        // ============================================================================
        // 
        // We check if the user wants to quit the application
        // We accept both "quit" and "exit" as valid quit commands
        if (input.toLowerCase() === 'quit' || input.toLowerCase() === 'exit') {
            this.disconnect();
            return;  // Exit the function early
        }
        
        // ============================================================================
        // CHECKING FOR HELP COMMAND
        // ============================================================================
        // 
        // We check if the user wants to see help information
        if (input.toLowerCase() === 'help') {
            this.showHelp();
            return;  // Exit the function early
        }
        
        // ============================================================================
        // CHECKING FOR STATUS COMMAND
        // ============================================================================
        // 
        // We check if the user wants to see connection status
        if (input.toLowerCase() === 'status') {
            this.showStatus();
            return;  // Exit the function early
        }
        
        // ============================================================================
        // VALIDATING MESSAGE CONTENT
        // ============================================================================
        // 
        // We don't want to send empty messages (just spaces or nothing)
        // If the input is empty, we just show the prompt again
        if (!input) {
            this.showInputPrompt();
            return;  // Exit the function early
        }
        
        // ============================================================================
        // SENDING THE MESSAGE
        // ============================================================================
        // 
        // If we get here, the input is a valid message to send
        // We pass it to the sendMessage function
        this.sendMessage(input);
    }
    
    /**
     * ============================================================================
     * SEND MESSAGE - TRANSMITTING MESSAGES TO THE SERVER
     * ============================================================================
     * 
     * This function sends a message to the server for broadcasting to other clients.
     * Think of it as "dialing the number" to send your message to everyone.
     * 
     * @param {string} message - The message to send
     */
    sendMessage(message) {
        // ============================================================================
        // CHECKING CONNECTION STATUS
        // ============================================================================
        // 
        // We only send messages if we're connected and have a valid WebSocket
        // This prevents errors from trying to send to a closed connection
        if (!this.isConnected || !this.ws) {
            console.log('❌ Not connected to server');
            return;  // Exit the function early
        }
        
        // ============================================================================
        // SENDING THE MESSAGE
        // ============================================================================
        // 
        // We wrap the send operation in try-catch to handle any errors
        try {
            // Send the message as a string to the server
            // The server will parse it and broadcast it to all other clients
            this.ws.send(message);
            
        } catch (error) {
            // ============================================================================
            // HANDLING SEND ERRORS
            // ============================================================================
            // 
            // If sending fails, we log the error but don't crash the application
            console.error('❌ Failed to send message:', error.message);
        }
    }
    
    /**
     * ============================================================================
     * SHOW HELP - DISPLAYING AVAILABLE COMMANDS
     * ============================================================================
     * 
     * This function shows the user what commands are available.
     * Think of it as the "user manual" that explains how to use the application.
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
     * ============================================================================
     * SHOW STATUS - DISPLAYING CONNECTION INFORMATION
     * ============================================================================
     * 
     * This function shows the current connection status and information.
     * Think of it as the "status screen" that shows your connection details.
     */
    showStatus() {
        console.log('\n📊 Connection Status:');
        console.log(`  Server: ${this.serverUrl}`);
        console.log(`  Connected: ${this.isConnected ? 'Yes' : 'No'}`);
        console.log(`  Client ID: ${this.clientId || 'Unknown'}`);
    }
    
    /**
     * ============================================================================
     * DISCONNECT - GRACEFUL DISCONNECTION
     * ============================================================================
     * 
     * This function gracefully disconnects from the server and cleans up resources.
     * Think of it as the "goodbye" function that properly ends the conversation.
     */
    disconnect() {
        // ============================================================================
        // INFORMING THE USER
        // ============================================================================
        // 
        // We let the user know we're disconnecting
        console.log('\n🛑 Disconnecting from server...');
        
        // ============================================================================
        // CLOSING THE WEBSOCKET CONNECTION
        // ============================================================================
        // 
        // If we have an active connection, we close it properly
        // This ensures the server knows we're leaving
        if (this.ws && this.isConnected) {
            // Close the WebSocket connection
            this.ws.close();
        }
        
        // ============================================================================
        // CLEANING UP THE READLINE INTERFACE
        // ============================================================================
        // 
        // We close the readline interface to free up system resources
        this.rl.close();
        
        // ============================================================================
        // CONFIRMING DISCONNECTION
        // ============================================================================
        // 
        // We confirm that we've successfully disconnected
        console.log('✅ Disconnected');
        
        // ============================================================================
        // EXITING THE PROGRAM
        // ============================================================================
        // 
        // We exit the program with code 0 (success) since this is a normal disconnection
        process.exit(0);
    }
}

// ============================================================================
// EXPORTING THE CLASS
// ============================================================================
// 
// We export the BroadcastClient class so other files can use it
// This is like making the class available for import in other parts of the application
// 
// In other files, you can use: const BroadcastClient = require('./client.js');
module.exports = BroadcastClient; 
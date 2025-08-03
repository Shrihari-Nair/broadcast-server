/**
 * Example: How to use the Broadcast Server programmatically
 * 
 * This file shows how you can use the BroadcastServer and BroadcastClient
 * classes directly in your own code, without using the CLI.
 * 
 * This is useful for:
 * - Testing the server
 * - Integrating the broadcast functionality into other applications
 * - Learning how the classes work
 */

const BroadcastServer = require('./src/server.js');
const BroadcastClient = require('./src/client.js');

/**
 * Example 1: Start a server and connect a client
 */
function example1() {
    console.log('=== Example 1: Basic Server and Client ===');
    
    // Start the server
    const server = new BroadcastServer(8081);
    
    // Wait a moment for server to start
    setTimeout(() => {
        // Connect a client
        const client = new BroadcastClient('ws://localhost:8081');
        client.connect();
        
        // Send a test message after 2 seconds
        setTimeout(() => {
            if (client.isConnected) {
                client.sendMessage('Hello from example!');
            }
        }, 2000);
        
        // Disconnect after 5 seconds
        setTimeout(() => {
            client.disconnect();
            server.shutdown();
        }, 5000);
    }, 1000);
}

/**
 * Example 2: Multiple clients
 */
function example2() {
    console.log('=== Example 2: Multiple Clients ===');
    
    // Start the server
    const server = new BroadcastServer(8082);
    
    // Wait for server to start
    setTimeout(() => {
        // Connect multiple clients
        const client1 = new BroadcastClient('ws://localhost:8082');
        const client2 = new BroadcastClient('ws://localhost:8082');
        const client3 = new BroadcastClient('ws://localhost:8082');
        
        client1.connect();
        client2.connect();
        client3.connect();
        
        // Send messages from different clients
        setTimeout(() => {
            if (client1.isConnected) {
                client1.sendMessage('Hello from Client 1!');
            }
        }, 2000);
        
        setTimeout(() => {
            if (client2.isConnected) {
                client2.sendMessage('Hello from Client 2!');
            }
        }, 3000);
        
        setTimeout(() => {
            if (client3.isConnected) {
                client3.sendMessage('Hello from Client 3!');
            }
        }, 4000);
        
        // Clean up after 8 seconds
        setTimeout(() => {
            client1.disconnect();
            client2.disconnect();
            client3.disconnect();
            server.shutdown();
        }, 8000);
    }, 1000);
}

/**
 * Example 3: Custom message handling
 */
function example3() {
    console.log('=== Example 3: Custom Message Handling ===');
    
    const server = new BroadcastServer(8083);
    
    setTimeout(() => {
        const client = new BroadcastClient('ws://localhost:8083');
        
        // Override the default message display
        const originalDisplayMessage = client.displayMessage;
        client.displayMessage = function(message) {
            console.log(`🔔 Custom handler: ${message.type} - ${message.content}`);
        };
        
        client.connect();
        
        setTimeout(() => {
            if (client.isConnected) {
                client.sendMessage('This message will be handled by custom logic!');
            }
        }, 2000);
        
        setTimeout(() => {
            client.disconnect();
            server.shutdown();
        }, 5000);
    }, 1000);
}

// Run examples
if (require.main === module) {
    console.log('🚀 Running Broadcast Server Examples...\n');
    
    // Run examples sequentially
    setTimeout(() => example1(), 0);
    setTimeout(() => example2(), 10000);
    setTimeout(() => example3(), 20000);
    
    console.log('📝 Examples will run automatically. Check the output above.');
    console.log('⏰ Each example runs for about 5-8 seconds.');
}

module.exports = { example1, example2, example3 }; 
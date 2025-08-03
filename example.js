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
 * Example 1: Basic Server and Client (Single Client Test)
 */
function example1() {
    console.log('\n=== Example 1: Basic Server and Client ===');
    console.log('This demonstrates a single client connecting to the server.');
    
    // Start the server
    const server = new BroadcastServer(8081);
    
    // Wait a moment for server to start
    setTimeout(() => {
        // Connect a client
        const client = new BroadcastClient('ws://localhost:8081');
        
        // Override message display for cleaner output
        client.displayMessage = function(message) {
            if (message.type === 'system') {
                console.log(`🔔 [${new Date(message.timestamp).toLocaleTimeString()}] ${message.content}`);
            } else if (message.type === 'confirmation') {
                console.log(`✅ [${new Date(message.timestamp).toLocaleTimeString()}] ${message.content}`);
            }
        };
        
        client.connect();
        
        // Send a test message after 2 seconds
        setTimeout(() => {
            if (client.isConnected) {
                console.log('📤 Sending test message...');
                client.sendMessage('Hello from single client test!');
            }
        }, 2000);
        
        // Disconnect after 5 seconds
        setTimeout(() => {
            console.log('🧹 Cleaning up single client test...');
            client.disconnect();
            // Don't call server.shutdown() to avoid process.exit()
            server.wss.close();
        }, 5000);
    }, 1000);
}

/**
 * Example 2: Multi-Client Broadcasting (Main Demo)
 */
function example2() {
    console.log('\n=== Example 2: Multi-Client Broadcasting Demo ===');
    console.log('This demonstrates how messages are broadcasted between multiple clients.');
    
    // Start the server
    const server = new BroadcastServer(8082);
    
    // Wait for server to start
    setTimeout(() => {
        // Create multiple clients with custom message handling
        const client1 = new BroadcastClient('ws://localhost:8082');
        const client2 = new BroadcastClient('ws://localhost:8082');
        const client3 = new BroadcastClient('ws://localhost:8082');
        
        // Override message display for each client to show clear output
        client1.displayMessage = function(message) {
            if (message.type === 'broadcast') {
                console.log(`📨 [Client1] Received: "${message.content}" from ${message.clientId}`);
            } else if (message.type === 'system') {
                console.log(`🔔 [Client1] ${message.content}`);
            } else if (message.type === 'confirmation') {
                console.log(`✅ [Client1] ${message.content}`);
            }
        };
        
        client2.displayMessage = function(message) {
            if (message.type === 'broadcast') {
                console.log(`📨 [Client2] Received: "${message.content}" from ${message.clientId}`);
            } else if (message.type === 'system') {
                console.log(`🔔 [Client2] ${message.content}`);
            } else if (message.type === 'confirmation') {
                console.log(`✅ [Client2] ${message.content}`);
            }
        };
        
        client3.displayMessage = function(message) {
            if (message.type === 'broadcast') {
                console.log(`📨 [Client3] Received: "${message.content}" from ${message.clientId}`);
            } else if (message.type === 'system') {
                console.log(`🔔 [Client3] ${message.content}`);
            } else if (message.type === 'confirmation') {
                console.log(`✅ [Client3] ${message.content}`);
            }
        };
        
        // Connect all clients
        console.log('🔗 Connecting Client 1...');
        client1.connect();
        
        setTimeout(() => {
            console.log('🔗 Connecting Client 2...');
            client2.connect();
        }, 500);
        
        setTimeout(() => {
            console.log('🔗 Connecting Client 3...');
            client3.connect();
        }, 1000);
        
        // Simulate a chat conversation
        setTimeout(() => {
            if (client1.isConnected) {
                console.log('\n💬 Client 1: "Hello everyone! How are you doing?"');
                client1.sendMessage('Hello everyone! How are you doing?');
            }
        }, 3000);
        
        setTimeout(() => {
            if (client2.isConnected) {
                console.log('\n💬 Client 2: "Hi there! I\'m doing great, thanks!"');
                client2.sendMessage('Hi there! I\'m doing great, thanks!');
            }
        }, 4000);
        
        setTimeout(() => {
            if (client3.isConnected) {
                console.log('\n💬 Client 3: "Hello! This broadcast server is working perfectly!"');
                client3.sendMessage('Hello! This broadcast server is working perfectly!');
            }
        }, 5000);
        
        setTimeout(() => {
            if (client1.isConnected) {
                console.log('\n💬 Client 1: "Awesome! The real-time messaging is so fast!"');
                client1.sendMessage('Awesome! The real-time messaging is so fast!');
            }
        }, 6000);
        
        // Clean up after 10 seconds
        setTimeout(() => {
            console.log('\n🧹 Cleaning up multi-client test...');
            client1.disconnect();
            client2.disconnect();
            client3.disconnect();
            // Don't call server.shutdown() to avoid process.exit()
            server.wss.close();
        }, 10000);
    }, 1000);
}

/**
 * Example 3: Client Join/Leave Simulation
 */
function example3() {
    console.log('\n=== Example 3: Client Join/Leave Simulation ===');
    console.log('This demonstrates how the server handles clients joining and leaving.');
    
    const server = new BroadcastServer(8083);
    
    setTimeout(() => {
        // Create clients
        const client1 = new BroadcastClient('ws://localhost:8083');
        const client2 = new BroadcastClient('ws://localhost:8083');
        const client3 = new BroadcastClient('ws://localhost:8083');
        
        // Custom message display
        client1.displayMessage = function(message) {
            if (message.type === 'system') {
                console.log(`🔔 [Client1] ${message.content}`);
            } else if (message.type === 'broadcast') {
                console.log(`📨 [Client1] "${message.content}" from ${message.clientId}`);
            }
        };
        
        client2.displayMessage = function(message) {
            if (message.type === 'system') {
                console.log(`🔔 [Client2] ${message.content}`);
            } else if (message.type === 'broadcast') {
                console.log(`📨 [Client2] "${message.content}" from ${message.clientId}`);
            }
        };
        
        client3.displayMessage = function(message) {
            if (message.type === 'system') {
                console.log(`🔔 [Client3] ${message.content}`);
            } else if (message.type === 'broadcast') {
                console.log(`📨 [Client3] "${message.content}" from ${message.clientId}`);
            }
        };
        
        // Connect clients one by one
        console.log('🔗 Client 1 joining...');
        client1.connect();
        
        setTimeout(() => {
            console.log('🔗 Client 2 joining...');
            client2.connect();
        }, 2000);
        
        setTimeout(() => {
            console.log('🔗 Client 3 joining...');
            client3.connect();
        }, 4000);
        
        // Send messages
        setTimeout(() => {
            if (client1.isConnected) {
                console.log('\n💬 Client 1: "I\'m the first one here!"');
                client1.sendMessage('I\'m the first one here!');
            }
        }, 5000);
        
        setTimeout(() => {
            if (client2.isConnected) {
                console.log('\n💬 Client 2: "Hello! I just joined!"');
                client2.sendMessage('Hello! I just joined!');
            }
        }, 6000);
        
        // Client 1 leaves
        setTimeout(() => {
            console.log('\n👋 Client 1 leaving...');
            client1.disconnect();
        }, 7000);
        
        // Client 3 sends message after Client 1 left
        setTimeout(() => {
            if (client3.isConnected) {
                console.log('\n💬 Client 3: "Client 1 left, but we can still chat!"');
                client3.sendMessage('Client 1 left, but we can still chat!');
            }
        }, 8000);
        
        // Clean up
        setTimeout(() => {
            console.log('\n🧹 Cleaning up join/leave test...');
            client2.disconnect();
            client3.disconnect();
            // Don't call server.shutdown() to avoid process.exit()
            server.wss.close();
        }, 10000);
    }, 1000);
}

/**
 * Example 4: Custom Message Handling
 */
function example4() {
    console.log('\n=== Example 4: Custom Message Handling ===');
    console.log('This demonstrates how to customize message handling for different use cases.');
    
    const server = new BroadcastServer(8084);
    
    setTimeout(() => {
        const client1 = new BroadcastClient('ws://localhost:8084');
        const client2 = new BroadcastClient('ws://localhost:8084');
        
        // Custom message handlers for different message types
        client1.displayMessage = function(message) {
            const timestamp = new Date(message.timestamp).toLocaleTimeString();
            
            switch (message.type) {
                case 'broadcast':
                    console.log(`📨 [${timestamp}] ${message.clientId}: "${message.content}"`);
                    break;
                case 'system':
                    console.log(`🔔 [${timestamp}] System: ${message.content}`);
                    break;
                case 'confirmation':
                    console.log(`✅ [${timestamp}] Confirmation: ${message.content}`);
                    break;
                default:
                    console.log(`❓ [${timestamp}] Unknown message type: ${message.type}`);
            }
        };
        
        client2.displayMessage = function(message) {
            const timestamp = new Date(message.timestamp).toLocaleTimeString();
            
            switch (message.type) {
                case 'broadcast':
                    console.log(`📨 [${timestamp}] ${message.clientId}: "${message.content}"`);
                    break;
                case 'system':
                    console.log(`🔔 [${timestamp}] System: ${message.content}`);
                    break;
                case 'confirmation':
                    console.log(`✅ [${timestamp}] Confirmation: ${message.content}`);
                    break;
                default:
                    console.log(`❓ [${timestamp}] Unknown message type: ${message.type}`);
            }
        };
        
        client1.connect();
        client2.connect();
        
        setTimeout(() => {
            if (client1.isConnected) {
                console.log('\n💬 Client 1: "Testing custom message handling!"');
                client1.sendMessage('Testing custom message handling!');
            }
        }, 2000);
        
        setTimeout(() => {
            if (client2.isConnected) {
                console.log('\n💬 Client 2: "This shows different message types!"');
                client2.sendMessage('This shows different message types!');
            }
        }, 3000);
        
        setTimeout(() => {
            console.log('\n🧹 Cleaning up custom handling test...');
            client1.disconnect();
            client2.disconnect();
            // Don't call server.shutdown() to avoid process.exit()
            server.wss.close();
        }, 5000);
    }, 1000);
}

// Run examples
if (require.main === module) {
    console.log('🚀 Running Broadcast Server Examples...');
    console.log('This will demonstrate single client, multi-client broadcasting, join/leave scenarios, and custom message handling.');
    console.log('Each example runs for about 5-10 seconds.\n');
    
    // Run examples sequentially with proper timing
    setTimeout(() => example1(), 0);
    setTimeout(() => example2(), 12000);  // Wait for example1 to complete
    setTimeout(() => example3(), 25000);  // Wait for example2 to complete
    setTimeout(() => example4(), 38000);  // Wait for example3 to complete
    
    console.log('📝 Examples will run automatically. Watch the output above.');
    console.log('⏰ Total runtime: ~45 seconds');
}

module.exports = { example1, example2, example3, example4 }; 
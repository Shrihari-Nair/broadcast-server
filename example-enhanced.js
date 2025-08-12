/**
 * Enhanced Example: How to use the Enhanced Broadcast Server with Authentication
 * 
 * This file demonstrates the new authentication and message persistence features
 * of the enhanced broadcast server.
 * 
 * Features demonstrated:
 * - User registration and login
 * - JWT token authentication
 * - Message persistence and history
 * - Online user management
 * - Enhanced client-server communication
 */

const BroadcastServer = require('./src/server.js');
const BroadcastClient = require('./src/client.js');

/**
 * Example 1: Basic Authentication Flow
 */
function example1() {
    console.log('\n=== Example 1: Basic Authentication Flow ===');
    console.log('This demonstrates user registration, login, and basic messaging.');
    
    // Start the enhanced server
    const server = new BroadcastServer(8081);
    
    // Wait for server to start and initialize
    setTimeout(async () => {
        try {
            await server.initialize();
            console.log('✅ Enhanced server initialized with authentication');
            
            // Create a client
            const client = new BroadcastClient('ws://localhost:8081');
            
            // Override message display for cleaner output
            client.displayMessage = function(message) {
                if (message.type === 'auth_required') {
                    console.log(`🔐 ${message.content}`);
                } else if (message.type === 'auth_success') {
                    console.log(`✅ ${message.content}`);
                    console.log(`👤 Welcome, ${message.user.displayName}!`);
                } else if (message.type === 'broadcast') {
                    console.log(`📨 ${message.user.displayName}: ${message.content}`);
                } else if (message.type === 'system') {
                    console.log(`🔔 ${message.content}`);
                }
            };
            
            client.connect();
            
            // Wait for connection and then register a user
            setTimeout(async () => {
                if (client.isConnected) {
                    console.log('\n📝 Registering new user...');
                    client.handleRegister('testuser password123 test@example.com Test User');
                }
            }, 2000);
            
            // Send a test message after authentication
            setTimeout(() => {
                if (client.isAuthenticated) {
                    console.log('\n📤 Sending test message...');
                    client.sendMessage('Hello from authenticated user!');
                }
            }, 5000);
            
            // Cleanup after 8 seconds
            setTimeout(() => {
                console.log('🧹 Cleaning up authentication test...');
                client.disconnect();
                server.wss.close();
            }, 8000);
            
        } catch (error) {
            console.error('❌ Server initialization failed:', error.message);
            process.exit(1);
        }
    }, 1000);
}

/**
 * Example 2: Multi-User Authentication and Chat
 */
function example2() {
    console.log('\n=== Example 2: Multi-User Authentication and Chat ===');
    console.log('This demonstrates multiple users registering, logging in, and chatting.');
    
    // Start the enhanced server
    const server = new BroadcastServer(8082);
    
    // Wait for server to start and initialize
    setTimeout(async () => {
        try {
            await server.initialize();
            console.log('✅ Enhanced server initialized with authentication');
            
            // Create multiple clients
            const client1 = new BroadcastClient('ws://localhost:8082');
            const client2 = new BroadcastClient('ws://localhost:8082');
            const client3 = new BroadcastClient('ws://localhost:8082');
            
            // Override message display for each client
            client1.displayMessage = function(message) {
                if (message.type === 'auth_success') {
                    console.log(`✅ [Client1] ${message.content}`);
                } else if (message.type === 'broadcast') {
                    console.log(`📨 [Client1] Received: "${message.content}" from ${message.user.displayName}`);
                } else if (message.type === 'system') {
                    console.log(`🔔 [Client1] ${message.content}`);
                }
            };
            
            client2.displayMessage = function(message) {
                if (message.type === 'auth_success') {
                    console.log(`✅ [Client2] ${message.content}`);
                } else if (message.type === 'broadcast') {
                    console.log(`📨 [Client2] Received: "${message.content}" from ${message.user.displayName}`);
                } else if (message.type === 'system') {
                    console.log(`🔔 [Client2] ${message.content}`);
                }
            };
            
            client3.displayMessage = function(message) {
                if (message.type === 'auth_success') {
                    console.log(`✅ [Client3] ${message.content}`);
                } else if (message.type === 'broadcast') {
                    console.log(`📨 [Client3] Received: "${message.content}" from ${message.user.displayName}`);
                } else if (message.type === 'system') {
                    console.log(`🔔 [Client3] ${message.content}`);
                }
            };
            
            // Connect all clients
            client1.connect();
            client2.connect();
            client3.connect();
            
            // Wait for connections and then register users
            setTimeout(() => {
                if (client1.isConnected) {
                    console.log('\n📝 Client1 registering user "alice"...');
                    client1.handleRegister('alice password123 alice@example.com Alice Johnson');
                }
            }, 2000);
            
            setTimeout(() => {
                if (client2.isConnected) {
                    console.log('\n📝 Client2 registering user "bob"...');
                    client2.handleRegister('bob password123 bob@example.com Bob Smith');
                }
            }, 3000);
            
            setTimeout(() => {
                if (client3.isConnected) {
                    console.log('\n📝 Client3 registering user "charlie"...');
                    client3.handleRegister('charlie password123 charlie@example.com Charlie Brown');
                }
            }, 4000);
            
            // Start chat conversation
            setTimeout(() => {
                if (client1.isAuthenticated) {
                    console.log('\n💬 Alice starting conversation...');
                    client1.sendMessage('Hello everyone! How are you doing today?');
                }
            }, 6000);
            
            setTimeout(() => {
                if (client2.isAuthenticated) {
                    console.log('\n💬 Bob responding...');
                    client2.sendMessage('Hi Alice! I\'m doing great, thanks for asking!');
                }
            }, 7000);
            
            setTimeout(() => {
                if (client3.isAuthenticated) {
                    console.log('\n💬 Charlie joining in...');
                    client3.sendMessage('Hey guys! This enhanced chat system is really cool!');
                }
            }, 8000);
            
            // Cleanup after 12 seconds
            setTimeout(() => {
                console.log('🧹 Cleaning up multi-user test...');
                client1.disconnect();
                client2.disconnect();
                client3.disconnect();
                server.wss.close();
            }, 12000);
            
        } catch (error) {
            console.error('❌ Server initialization failed:', error.message);
            process.exit(1);
        }
    }, 1000);
}

/**
 * Example 3: Message History and Online Users
 */
function example3() {
    console.log('\n=== Example 3: Message History and Online Users ===');
    console.log('This demonstrates message persistence and online user management.');
    
    // Start the enhanced server
    const server = new BroadcastServer(8083);
    
    // Wait for server to start and initialize
    setTimeout(async () => {
        try {
            await server.initialize();
            console.log('✅ Enhanced server initialized with authentication');
            
            // Create clients
            const client1 = new BroadcastClient('ws://localhost:8083');
            const client2 = new BroadcastClient('ws://localhost:8083');
            
            // Override message display
            client1.displayMessage = function(message) {
                if (message.type === 'auth_success') {
                    console.log(`✅ [Client1] ${message.content}`);
                } else if (message.type === 'message_history') {
                    console.log(`📚 [Client1] ${message.content}`);
                    if (message.messages && message.messages.length > 0) {
                        console.log('📖 Message history:');
                        message.messages.forEach(msg => {
                            const msgTime = new Date(msg.timestamp).toLocaleTimeString();
                            console.log(`   [${msgTime}] ${msg.display_name}: ${msg.content}`);
                        });
                    }
                } else if (message.type === 'online_users') {
                    console.log(`👥 [Client1] ${message.content}`);
                    if (message.users && message.users.length > 0) {
                        console.log('🟢 Online users:');
                        message.users.forEach(user => {
                            console.log(`   • ${user.display_name || user.username}`);
                        });
                    }
                }
            };
            
            client2.displayMessage = function(message) {
                if (message.type === 'auth_success') {
                    console.log(`✅ [Client2] ${message.content}`);
                } else if (message.type === 'broadcast') {
                    console.log(`📨 [Client2] Received: "${message.content}" from ${message.user.displayName}`);
                }
            };
            
            // Connect clients
            client1.connect();
            client2.connect();
            
            // Register users
            setTimeout(() => {
                if (client1.isConnected) {
                    console.log('\n📝 Client1 registering user "history_user"...');
                    client1.handleRegister('history_user password123 history@example.com History User');
                }
            }, 2000);
            
            setTimeout(() => {
                if (client2.isConnected) {
                    console.log('\n📝 Client2 registering user "online_user"...');
                    client2.handleRegister('online_user password123 online@example.com Online User');
                }
            }, 3000);
            
            // Send some messages to build history
            setTimeout(() => {
                if (client1.isAuthenticated) {
                    console.log('\n💬 Sending messages to build history...');
                    client1.sendMessage('First message in the chat');
                }
            }, 5000);
            
            setTimeout(() => {
                if (client1.isAuthenticated) {
                    client1.sendMessage('Second message in the chat');
                }
            }, 6000);
            
            setTimeout(() => {
                if (client1.isAuthenticated) {
                    client1.sendMessage('Third message in the chat');
                }
            }, 7000);
            
            // Request message history
            setTimeout(() => {
                if (client1.isAuthenticated) {
                    console.log('\n📚 Requesting message history...');
                    client1.requestMessageHistory();
                }
            }, 8000);
            
            // Request online users
            setTimeout(() => {
                if (client1.isAuthenticated) {
                    console.log('\n👥 Requesting online users...');
                    client1.requestOnlineUsers();
                }
            }, 9000);
            
            // Cleanup after 12 seconds
            setTimeout(() => {
                console.log('🧹 Cleaning up history test...');
                client1.disconnect();
                client2.disconnect();
                server.wss.close();
            }, 12000);
            
        } catch (error) {
            console.error('❌ Server initialization failed:', error.message);
            process.exit(1);
        }
    }, 1000);
}

/**
 * Example 4: Login with Existing User
 */
function example4() {
    console.log('\n=== Example 4: Login with Existing User ===');
    console.log('This demonstrates logging in with an existing account.');
    
    // Start the enhanced server
    const server = new BroadcastServer(8084);
    
    // Wait for server to start and initialize
    setTimeout(async () => {
        try {
            await server.initialize();
            console.log('✅ Enhanced server initialized with authentication');
            
            // Create client
            const client = new BroadcastClient('ws://localhost:8084');
            
            // Override message display
            client.displayMessage = function(message) {
                if (message.type === 'auth_success') {
                    console.log(`✅ ${message.content}`);
                    console.log(`👤 Welcome back, ${message.user.displayName}!`);
                } else if (message.type === 'broadcast') {
                    console.log(`📨 ${message.user.displayName}: ${message.content}`);
                } else if (message.type === 'system') {
                    console.log(`🔔 ${message.content}`);
                }
            };
            
            client.connect();
            
            // Wait for connection and then login
            setTimeout(() => {
                if (client.isConnected) {
                    console.log('\n🔑 Logging in with existing user...');
                    client.handleLogin('admin admin123');
                }
            }, 2000);
            
            // Send a message after login
            setTimeout(() => {
                if (client.isAuthenticated) {
                    console.log('\n📤 Sending message as admin...');
                    client.sendMessage('Hello from admin user!');
                }
            }, 5000);
            
            // Cleanup after 8 seconds
            setTimeout(() => {
                console.log('🧹 Cleaning up login test...');
                client.disconnect();
                server.wss.close();
            }, 8000);
            
        } catch (error) {
            console.error('❌ Server initialization failed:', error.message);
            process.exit(1);
        }
    }, 1000);
}

/**
 * Example 5: Full Feature Demo
 */
function example5() {
    console.log('\n=== Example 5: Full Feature Demo ===');
    console.log('This demonstrates all the enhanced features together.');
    
    // Start the enhanced server
    const server = new BroadcastServer(8085);
    
    // Wait for server to start and initialize
    setTimeout(async () => {
        try {
            await server.initialize();
            console.log('✅ Enhanced server initialized with authentication');
            
            // Create multiple clients
            const client1 = new BroadcastClient('ws://localhost:8085');
            const client2 = new BroadcastClient('ws://localhost:8085');
            
            // Override message display for comprehensive output
            client1.displayMessage = function(message) {
                const timestamp = new Date(message.timestamp).toLocaleTimeString();
                
                switch (message.type) {
                    case 'auth_success':
                        console.log(`✅ [${timestamp}] [Client1] ${message.content}`);
                        break;
                    case 'broadcast':
                        console.log(`📨 [${timestamp}] [Client1] Received: "${message.content}" from ${message.user.displayName}`);
                        break;
                    case 'message_history':
                        console.log(`📚 [${timestamp}] [Client1] ${message.content}`);
                        break;
                    case 'online_users':
                        console.log(`👥 [${timestamp}] [Client1] ${message.content}`);
                        break;
                    case 'system':
                        console.log(`🔔 [${timestamp}] [Client1] ${message.content}`);
                        break;
                }
            };
            
            client2.displayMessage = function(message) {
                const timestamp = new Date(message.timestamp).toLocaleTimeString();
                
                switch (message.type) {
                    case 'auth_success':
                        console.log(`✅ [${timestamp}] [Client2] ${message.content}`);
                        break;
                    case 'broadcast':
                        console.log(`📨 [${timestamp}] [Client2] Received: "${message.content}" from ${message.user.displayName}`);
                        break;
                    case 'system':
                        console.log(`🔔 [${timestamp}] [Client2] ${message.content}`);
                        break;
                }
            };
            
            // Connect clients
            client1.connect();
            client2.connect();
            
            // Register users
            setTimeout(() => {
                if (client1.isConnected) {
                    console.log('\n📝 Client1 registering user "demo_user"...');
                    client1.handleRegister('demo_user password123 demo@example.com Demo User');
                }
            }, 2000);
            
            setTimeout(() => {
                if (client2.isConnected) {
                    console.log('\n📝 Client2 registering user "demo_user2"...');
                    client2.handleRegister('demo_user2 password123 demo2@example.com Demo User 2');
                }
            }, 3000);
            
            // Send messages
            setTimeout(() => {
                if (client1.isAuthenticated) {
                    console.log('\n💬 Sending messages...');
                    client1.sendMessage('Welcome to the enhanced broadcast server!');
                }
            }, 5000);
            
            setTimeout(() => {
                if (client2.isAuthenticated) {
                    client2.sendMessage('This is really cool with authentication!');
                }
            }, 6000);
            
            // Request features
            setTimeout(() => {
                if (client1.isAuthenticated) {
                    console.log('\n📚 Requesting message history...');
                    client1.requestMessageHistory();
                }
            }, 7000);
            
            setTimeout(() => {
                if (client1.isAuthenticated) {
                    console.log('\n👥 Requesting online users...');
                    client1.requestOnlineUsers();
                }
            }, 8000);
            
            // Show status
            setTimeout(() => {
                if (client1.isAuthenticated) {
                    console.log('\n📊 Client1 status:');
                    client1.showStatus();
                }
            }, 9000);
            
            // Cleanup after 12 seconds
            setTimeout(() => {
                console.log('🧹 Cleaning up full feature demo...');
                client1.disconnect();
                client2.disconnect();
                server.wss.close();
            }, 12000);
            
        } catch (error) {
            console.error('❌ Server initialization failed:', error.message);
            process.exit(1);
        }
    }, 1000);
}

/**
 * Main function to run all examples
 */
async function runAllExamples() {
    console.log('🚀 Enhanced Broadcast Server Examples');
    console.log('=====================================');
    console.log('This demonstrates the new authentication and message persistence features.');
    console.log('');
    
    try {
        // Run examples sequentially
        await example1();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await example2();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await example3();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await example4();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await example5();
        
        console.log('\n🎉 All enhanced examples completed successfully!');
        console.log('💡 The enhanced broadcast server now supports:');
        console.log('   • User authentication with JWT tokens');
        console.log('   • Message persistence in SQLite database');
        console.log('   • Message history retrieval');
        console.log('   • Online user management');
        console.log('   • Enhanced security and user experience');
        
    } catch (error) {
        console.error('❌ Error running examples:', error.message);
    }
}

// Export individual examples for selective testing
module.exports = {
    example1,
    example2,
    example3,
    example4,
    example5,
    runAllExamples
};

// Run all examples if this file is executed directly
if (require.main === module) {
    runAllExamples();
} 
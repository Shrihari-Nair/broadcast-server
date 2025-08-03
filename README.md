# Broadcast Server

A real-time broadcast server that allows multiple clients to connect and send messages to all other connected clients. Built with Node.js and WebSockets.

## 🎯 What is this?

This is a **broadcast server** - think of it like a chat room where:
- Multiple people can join at the same time
- When one person sends a message, everyone else sees it instantly
- It's like a group chat, but simpler and more direct

## 🚀 Features

- ✅ **Real-time messaging** - Messages appear instantly
- ✅ **Multiple clients** - Many people can connect at once
- ✅ **Simple CLI interface** - Easy to use from the command line
- ✅ **Automated testing** - Comprehensive examples demonstrating all features
- ✅ **Graceful handling** - Handles connections and disconnections properly
- ✅ **Error handling** - Robust error handling and recovery
- ✅ **Cross-platform** - Works on Windows, Mac, and Linux

## 📋 Prerequisites

Before you start, make sure you have:

- **Node.js** installed (version 14 or higher)
- **npm** (comes with Node.js)

### How to check if you have Node.js:
```bash
node --version
npm --version
```

If you don't have Node.js, download it from [nodejs.org](https://nodejs.org/)

## 🛠️ Installation

1. **Clone or download this project**
   ```bash
   git clone <repository-url>
   cd broadcast-server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Make the CLI executable** (Linux/Mac only)
   ```bash
   chmod +x bin/broadcast-server
   ```

## 🎮 How to Use

### Starting the Server

To start the broadcast server:

```bash
# Start on default port (8080)
npm start

# OR use the CLI directly
node src/cli.js start

# OR with a custom port
node src/cli.js start --port 3000
```

**What happens:**
- The server starts listening for connections
- You'll see a message like "🚀 Broadcast server starting on port 8080..."
- The server is now ready to accept client connections

### Connecting as a Client

In a **new terminal window**, connect as a client:

```bash
# Connect to default server (localhost:8080)
npm run connect

# OR use the CLI directly
node src/cli.js connect

# OR connect to a different server
node src/cli.js connect --server ws://192.168.1.100:8080
```

**What happens:**
- The client connects to the server
- You'll see "✅ Connected to broadcast server!"
- You can now type messages and press Enter to send them

### Sending Messages

Once connected as a client:

1. **Type your message** and press Enter
2. **Your message** will be sent to all other connected clients
3. **You'll see** messages from other clients in real-time

**Example session:**
```
💬 You: Hello everyone!
✅ [2:30:15 PM] Message sent successfully!

📨 [2:30:16 PM] 192.168.1.5:54321: Hi there!
📨 [2:30:17 PM] 192.168.1.6:12345: How's it going?

💬 You: Great! This is working perfectly!
```

### Client Commands

When connected as a client, you can use these commands:

- `help` - Show available commands
- `status` - Show connection status
- `quit` or `exit` - Disconnect from server

### Quick Testing

Want to see the broadcast server in action quickly? Run:

```bash
# See multi-client broadcasting demo
node -e "require('./example.js').example2()"

# Or run all examples
node example.js
```

This will automatically demonstrate real-time messaging between multiple clients!

## 🔧 Configuration Options

### Server Options

| Option | Description | Default |
|--------|-------------|---------|
| `--port` | Port number to listen on | `8080` |
| `--host` | Host address to bind to | `localhost` |

### Client Options

| Option | Description | Default |
|--------|-------------|---------|
| `--server` | Server URL to connect to | `ws://localhost:8080` |

## 📚 How It Works

### Architecture Overview

```
┌─────────────────┐    WebSocket    ┌─────────────────┐
│   Client 1      │ ◄─────────────► │                 │
└─────────────────┘                 │                 │
                                   │   Broadcast     │
┌─────────────────┐    WebSocket    │    Server       │
│   Client 2      │ ◄─────────────► │                 │
└─────────────────┘                 │                 │
                                   │                 │
┌─────────────────┐    WebSocket    │                 │
│   Client 3      │ ◄─────────────► │                 │
└─────────────────┘                 └─────────────────┘
```

### Key Components

1. **WebSocket Server** (`src/server.js`)
   - Listens for incoming connections
   - Manages all connected clients
   - Broadcasts messages to all clients

2. **WebSocket Client** (`src/client.js`)
   - Connects to the server
   - Sends messages
   - Receives and displays messages

3. **CLI Interface** (`src/cli.js`)
   - Handles command-line arguments
   - Starts server or client based on command

### Message Flow

1. **Client connects** → Server adds client to list
2. **Client sends message** → Server receives message
3. **Server broadcasts** → Message sent to all other clients
4. **Other clients receive** → Message displayed on their screens

## 🧪 Testing the Server

### Method 1: Manual Testing with Multiple Terminals

1. **Start the server** in one terminal:
   ```bash
   npm start
   ```

2. **Connect multiple clients** in different terminals:
   ```bash
   # Terminal 2
   npm run connect
   
   # Terminal 3
   npm run connect
   
   # Terminal 4
   npm run connect
   ```

3. **Send messages** from any client and watch them appear in all other clients

### Method 2: Automated Testing with Examples

The project includes comprehensive automated tests that demonstrate all features:

#### **Run All Examples (Recommended)**
```bash
node example.js
```
This runs 4 different scenarios automatically:
- **Example 1**: Single client connection and messaging
- **Example 2**: Multi-client broadcasting with real-time chat simulation
- **Example 3**: Client join/leave scenarios
- **Example 4**: Custom message handling

#### **Run Individual Examples**
```bash
# Multi-client broadcasting demo (main feature)
node -e "require('./example.js').example2()"

# Client join/leave simulation
node -e "require('./example.js').example3()"

# Custom message handling
node -e "require('./example.js').example4()"
```

#### **Example Output**
```
=== Example 2: Multi-Client Broadcasting Demo ===
🔗 Connecting Client 1...
🔗 Connecting Client 2...
🔗 Connecting Client 3...

💬 Client 1: "Hello everyone! How are you doing?"
📨 [Client2] Received: "Hello everyone! How are you doing?" from ::ffff:127.0.0.1:60010
📨 [Client3] Received: "Hello everyone! How are you doing?" from ::ffff:127.0.0.1:60010

💬 Client 2: "Hi there! I'm doing great, thanks!"
📨 [Client1] Received: "Hi there! I'm doing great, thanks!" from ::ffff:127.0.0.1:60026
📨 [Client3] Received: "Hi there! I'm doing great, thanks!" from ::ffff:127.0.0.1:60026
```

### Expected Behavior

- ✅ All clients should connect successfully
- ✅ Messages from one client should appear in all other clients
- ✅ System messages should show when clients join/leave
- ✅ Clients should disconnect gracefully when you type "quit"
- ✅ Real-time broadcasting with instant message delivery
- ✅ Proper client management (join/leave notifications)

## 🐛 Troubleshooting

### Common Issues

**"Port already in use" error:**
```bash
# Try a different port
npm start -- --port 3000
```

**"Failed to connect" error:**
- Make sure the server is running
- Check if the port number matches
- Verify the server URL is correct

**"Permission denied" error (Linux/Mac):**
```bash
chmod +x bin/broadcast-server
```

### Debug Mode

To see more detailed logs, you can modify the server code to add more console.log statements.

## 🔍 Understanding the Code

### Key Concepts

1. **WebSockets**
   - Full-duplex communication protocol
   - Maintains persistent connection
   - Real-time data transfer

2. **Event-driven Programming**
   - Server responds to events (connection, message, disconnect)
   - No polling or constant checking needed

3. **Broadcasting**
   - One-to-many message distribution
   - Efficient for group communication

### File Structure

```
broadcast-server/
├── package.json          # Project configuration and dependencies
├── README.md            # This file
├── example.js           # Comprehensive testing examples
├── .gitignore           # Git ignore rules
├── bin/
│   └── broadcast-server # CLI executable
└── src/
    ├── server.js        # WebSocket server implementation
    ├── client.js        # WebSocket client implementation
    └── cli.js          # Command-line interface
```

### Key Files Explained

1. **`example.js`** - Comprehensive testing suite
   - Demonstrates single client, multi-client, and join/leave scenarios
   - Shows real-time broadcasting in action
   - Includes custom message handling examples
   - Perfect for learning how the system works

2. **`src/server.js`** - WebSocket server implementation
   - Handles client connections and disconnections
   - Manages message broadcasting
   - Maintains client list and connection state

3. **`src/client.js`** - WebSocket client implementation
   - Connects to the broadcast server
   - Sends and receives messages
   - Provides interactive command-line interface

4. **`src/cli.js`** - Command-line interface
   - Parses user commands (`start`, `connect`)
   - Handles command-line options (port, server URL)
   - Routes to appropriate server or client functionality

## 🚀 Next Steps

Once you understand this basic broadcast server, you could extend it with:

- **User authentication** - Login/logout system
- **Message history** - Store and retrieve old messages
- **Private messaging** - Direct messages between users
- **File sharing** - Send images, documents, etc.
- **Web interface** - Browser-based client
- **Database integration** - Persistent message storage

## 📖 Learning Resources

- [WebSocket Protocol](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
- [Node.js Documentation](https://nodejs.org/docs/)
- [Event-driven Programming](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick/)

## 🤝 Contributing

Feel free to improve this project! Some ideas:
- Add more features
- Improve error handling
- Add tests
- Enhance documentation

## 📄 License

This project is open source and available under the MIT License.

---

**Happy coding! 🎉**

If you have questions or run into issues, feel free to ask for help! 
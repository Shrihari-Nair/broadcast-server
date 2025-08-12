# Enhanced Broadcast Server

A real-time broadcast server with **user authentication** and **message persistence** that allows multiple authenticated clients to connect and send messages to each other. Built with Node.js, WebSockets, SQLite, and JWT authentication.

## 🎯 What is this?

This is an **enhanced broadcast server** - think of it like a secure chat room where:
- Users must register/login to participate
- Messages are stored permanently in a database
- Multiple authenticated users can join at the same time
- When one user sends a message, everyone else sees it instantly
- Message history is preserved and can be retrieved
- User sessions are managed securely with JWT tokens

## 🚀 Features

### **Core Features:**
- ✅ **Real-time messaging** - Messages appear instantly
- ✅ **Multiple clients** - Many authenticated users can connect at once
- ✅ **Simple CLI interface** - Easy to use from the command line
- ✅ **Graceful handling** - Handles connections and disconnections properly
- ✅ **Error handling** - Robust error handling and recovery
- ✅ **Cross-platform** - Works on Windows, Mac, and Linux

### **🔐 NEW: Authentication & Security:**
- ✅ **User registration** - Create new accounts with username/password
- ✅ **User login** - Secure authentication with JWT tokens
- ✅ **Password hashing** - Secure password storage with bcrypt
- ✅ **Session management** - JWT token-based user sessions
- ✅ **User profiles** - Display names, emails, and avatar support
- ✅ **Online status** - Track who's currently online

### **💾 NEW: Message Persistence:**
- ✅ **SQLite database** - Persistent message storage
- ✅ **Message history** - Retrieve recent messages
- ✅ **User tracking** - Link messages to authenticated users
- ✅ **Message metadata** - Timestamps, user info, and message types
- ✅ **Database management** - Easy database initialization and setup

### **🔄 Enhanced Client Features:**
- ✅ **Interactive authentication** - Register/login directly from client
- ✅ **Message history** - View recent chat history
- ✅ **Online users** - See who's currently online
- ✅ **Enhanced commands** - Slash commands and built-in functions
- ✅ **User status** - Display connection and authentication status

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

3. **Initialize the database**
   ```bash
   npm run init-db
   ```
   This creates the SQLite database and a default admin user:
   - Username: `admin`
   - Password: `admin123`
   ⚠️ **Change this password in production!**

4. **Make the CLI executable** (Linux/Mac only)
   ```bash
   chmod +x bin/broadcast-server
   ```

## 🎮 How to Use

### Starting the Enhanced Server

To start the enhanced broadcast server with authentication:

```bash
# Start on default port (8080)
npm start

# OR use the CLI directly
node src/cli.js start

# OR with a custom port
node src/cli.js start --port 3000
```

**What happens:**
- The enhanced server starts with database connection
- Authentication service is initialized
- Server is ready to accept authenticated client connections
- You'll see "🔐 Authentication and message persistence enabled"

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
- You'll see "🔐 Authentication required to join the chat"
- You must register or login to participate

### User Authentication

#### **Register a New User:**
```
register <username> <password> [email] [display_name]
```
**Examples:**
```
register john password123 john@example.com John Doe
register alice secret456 alice@example.com
register bob mypass789
```

#### **Login with Existing User:**
```
login <username> <password>
```
**Examples:**
```
login admin admin123
login john password123
```

#### **Logout:**
```
logout
```

### Sending Messages

Once authenticated:

1. **Type your message** and press Enter
2. **Your message** will be sent to all other authenticated clients
3. **You'll see** messages from other users in real-time
4. **Messages are saved** to the database for persistence

**Example session:**
```
🔐 Please authenticate to join the chat
💡 Use "register <username> <password>" or "login <username> <password>"

💬 Guest: register alice password123 alice@example.com Alice Johnson
✅ Registration successful
👤 Welcome, Alice Johnson!

💬 Alice Johnson: Hello everyone!
✅ Message sent successfully!

📨 [2:30:16 PM] Bob Smith: Hi Alice! How are you?
📨 [2:30:17 PM] Charlie Brown: Hey guys! This is great!
```

### Enhanced Client Commands

When connected as an authenticated client, you can use these commands:

#### **Authentication Commands:**
- `register <username> <password> [email] [display_name]` - Create new account
- `login <username> <password>` - Login to existing account
- `logout` - Logout from current account

#### **Chat Commands:**
- `history` - View recent message history
- `online-users` or `users` - View online users
- `status` - Show connection and authentication status
- `help` - Show available commands
- `quit` or `exit` - Disconnect from server

#### **Slash Commands:**
- `/register <username> <password> [email] [display_name]`
- `/login <username> <password>`
- `/logout`
- `/history`
- `/users`
- `/help`
- `/status`

### User Management

#### **Create Users from CLI:**
```bash
# Create a new user account
node src/cli.js create-user -u username -p password -e email@example.com -d "Display Name"

# Examples:
node src/cli.js create-user -u john -p secret123 -e john@example.com -d "John Doe"
node src/cli.js create-user -u alice -p mypass456 -d "Alice"
```

#### **Database Management:**
```bash
# Initialize/reset the database
npm run init-db

# OR use the CLI
node src/cli.js init-db
```

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

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_SECRET` | Secret key for JWT tokens | `your-super-secret-jwt-key-change-in-production` |

## 📚 How It Works

### Architecture Overview

```
┌─────────────────┐    WebSocket    ┌─────────────────┐
│   Client 1      │ ◄─────────────► │                 │
│ (Authenticated) │                 │                 │
└─────────────────┘                 │                 │
                                   │   Enhanced      │
┌─────────────────┐    WebSocket    │   Broadcast     │
│   Client 2      │ ◄─────────────► │    Server       │
│ (Authenticated) │                 │   + Auth       │
└─────────────────┘                 │   + Database    │
                                   │                 │
┌─────────────────┐    WebSocket    │                 │
│   Client 3      │ ◄─────────────► │                 │
│ (Authenticated) │                 └─────────────────┘
└─────────────────┘
```

### Key Components

1. **Enhanced WebSocket Server** (`src/server.js`)
   - Listens for incoming connections
   - Manages user authentication and sessions
   - Stores all connected authenticated clients
   - Broadcasts messages to all authenticated clients
   - Persists messages to SQLite database

2. **Authentication Service** (`src/auth/authService.js`)
   - Handles user registration and login
   - Manages JWT token generation and validation
   - Securely hashes passwords with bcrypt
   - Manages user sessions and profiles

3. **Database Manager** (`src/database/database.js`)
   - Manages SQLite database connections
   - Handles user data and message storage
   - Provides message history and user queries
   - Manages database schema and indexes

4. **Enhanced WebSocket Client** (`src/client.js`)
   - Connects to the enhanced server
   - Provides interactive authentication interface
   - Sends and receives authenticated messages
   - Displays message history and online users

5. **Enhanced CLI Interface** (`src/cli.js`)
   - Handles command-line arguments
   - Starts enhanced server with authentication
   - Provides user management commands
   - Initializes database and creates users

### Authentication Flow

1. **Client connects** → Server sends authentication request
2. **Client registers/logs in** → Server validates credentials
3. **Server generates JWT token** → Client receives authentication success
4. **Client can now send messages** → Messages are broadcasted to all authenticated clients
5. **Messages are persisted** → Stored in SQLite database with user information

### Message Persistence

1. **Message sent** → Server receives message from authenticated client
2. **Message saved** → Stored in database with sender ID and metadata
3. **Message broadcasted** → Sent to all other authenticated clients
4. **History available** → Clients can request recent message history

## 🧪 Testing the Enhanced Server

### Method 1: Run Enhanced Examples

The project includes comprehensive examples demonstrating all new features:

```bash
# Run all enhanced examples
node example-enhanced.js

# Run individual examples
node -e "require('./example-enhanced.js').example1()"  # Basic auth flow
node -e "require('./example-enhanced.js').example2()"  # Multi-user chat
node -e "require('./example-enhanced.js').example3()"  # Message history
node -e "require('./example-enhanced.js').example4()"  # Login with existing user
node -e "require('./example-enhanced.js').example5()"  # Full feature demo
```

### Method 2: Manual Testing

1. **Start the enhanced server** in one terminal:
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

3. **Register users and start chatting** - watch authentication and persistence in action!

### Expected Behavior

- ✅ All clients should connect and receive authentication requests
- ✅ Users should be able to register new accounts
- ✅ Users should be able to login with existing accounts
- ✅ Only authenticated users should be able to send messages
- ✅ Messages should be broadcasted to all authenticated clients
- ✅ Messages should be persisted in the database
- ✅ Message history should be retrievable
- ✅ Online user status should be tracked

## 🐛 Troubleshooting

### Common Issues

**"Database tables not ready" error:**
```bash
# Initialize the database first
npm run init-db
```

**"Authentication failed" error:**
- Make sure you're using the correct username/password
- Check if the user exists (try registering first)
- Verify the server is running with authentication enabled

**"Port already in use" error:**
```bash
# Try a different port
npm start -- --port 3000
```

**"Failed to connect" error:**
- Make sure the enhanced server is running
- Check if the port number matches
- Verify the server URL is correct

### Debug Mode

To see more detailed logs, you can modify the server code to add more console.log statements.

## 🔍 Understanding the Enhanced Code

### Key Concepts

1. **JWT Authentication**
   - JSON Web Tokens for secure user sessions
   - Stateless authentication with database validation
   - Automatic token expiration and refresh

2. **SQLite Database**
   - Lightweight, file-based database
   - Persistent storage for users and messages
   - ACID compliance for data integrity

3. **Password Security**
   - bcrypt hashing for secure password storage
   - Salt rounds for additional security
   - Never store plain-text passwords

4. **Enhanced WebSocket Protocol**
   - Message types for different operations
   - Structured JSON communication
   - Authentication state management

### File Structure

```
broadcast-server/
├── package.json              # Project configuration and dependencies
├── README.md                # This file
├── example-enhanced.js      # Enhanced testing examples
├── .gitignore               # Git ignore rules
├── bin/
│   └── broadcast-server     # CLI executable
├── data/                    # Database files (created automatically)
│   └── broadcast.db         # SQLite database
└── src/
    ├── server.js            # Enhanced WebSocket server
    ├── client.js            # Enhanced WebSocket client
    ├── cli.js              # Enhanced command-line interface
    ├── auth/
    │   └── authService.js   # Authentication service
    └── database/
        ├── database.js      # Database manager
        └── init.js          # Database initialization
```

### Database Schema

**Users Table:**
- `id` - Unique user identifier
- `username` - Unique username
- `password_hash` - Hashed password
- `email` - User email (optional)
- `display_name` - User display name
- `is_online` - Online status
- `last_seen` - Last activity timestamp
- `created_at` - Account creation time
- `updated_at` - Last update time

**Messages Table:**
- `id` - Unique message identifier
- `sender_id` - User who sent the message
- `content` - Message text content
- `message_type` - Type of message
- `room_id` - Chat room identifier
- `timestamp` - When message was sent
- `is_edited` - Whether message was edited
- `is_deleted` - Whether message was deleted

**User Sessions Table:**
- `id` - Unique session identifier
- `user_id` - Associated user
- `token_hash` - Hashed JWT token
- `expires_at` - Token expiration time
- `created_at` - Session creation time

## 🚀 Next Steps

Once you understand this enhanced broadcast server, you could extend it with:

- **Room/Channel System** - Multiple chat rooms with different permissions
- **File Sharing** - Send images, documents, and other files
- **Message Reactions** - Emoji responses and reactions
- **Message Editing/Deletion** - Modify or remove sent messages
- **User Roles** - Admin, moderator, and user permissions
- **Web Interface** - Browser-based client with modern UI
- **Mobile App** - React Native or Flutter mobile client
- **API Endpoints** - REST API for external integrations
- **Real-time Notifications** - Push notifications and email alerts
- **Message Search** - Full-text search through message history

## 📖 Learning Resources

- [WebSocket Protocol](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
- [JWT Authentication](https://jwt.io/introduction)
- [SQLite Database](https://www.sqlite.org/docs.html)
- [Node.js Documentation](https://nodejs.org/docs/)
- [bcrypt Password Hashing](https://en.wikipedia.org/wiki/Bcrypt)

## 🤝 Contributing

Feel free to improve this project! Some ideas:
- Add more authentication features (OAuth, 2FA)
- Implement message encryption
- Add user avatar and profile management
- Create a web-based admin dashboard
- Add automated testing suite
- Enhance error handling and logging

## 📄 License

This project is open source and available under the MIT License.

---

**Happy coding with enhanced security! 🔐✨**

If you have questions or run into issues, feel free to ask for help! 
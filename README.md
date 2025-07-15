# Transcendence - Real-time Gaming Platform

A modern cyberpunk-styled web application featuring real-time multiplayer games, tournament systems, and social features built with TypeScript, Node.js, and WebSocket technology.

## 🎯 Overview

Transcendence is a comprehensive gaming platform that combines classic games (Pong and Connect4) with modern web technologies, featuring real-time multiplayer capabilities, tournament systems, live chat, user management, and a stunning cyberpunk-themed interface.

## 📖 Introduction

ft_transcendence is the final core project at 42 School, a full-stack web application designed to deliver a modern, real-time multiplayer online Pong game experience. This project goes beyond basic gameplay, incorporating extensive user management, social features, and a robust backend infrastructure. It serves as a comprehensive demonstration of full-stack development skills, real-time communication, database management, and cybersecurity best practices.

### Project Objectives

The core objective of ft_transcendence is to challenge students with unfamiliar technologies and complex tasks, fostering adaptability and problem-solving skills rather than simply demonstrating existing knowledge. This project emphasizes:

- **Adaptation**: Rapidly learning and implementing new programming languages, frameworks, and tools.
- **Problem-Solving**: Tackling intricate challenges in real-time game development, secure authentication, and scalable architecture.
- **Design & Planning**: Encouraging thoughtful design and project management before coding, especially given the project's long-term nature and potential for complex interdependencies.
- **Mandatory Requirements & Modules**: Adhering to a baseline set of features and then selecting a minimum of 7 major modules from a predefined list, each with specific technology constraints.

### 📸 Project Screenshots

<!-- TODO: Add actual screenshots -->
![Dashboard Overview](./docs/images/dashboard-overview.png)
*Main dashboard featuring the cyberpunk-themed interface and game selection*

![Tournament System](./docs/images/tournament-system.png)
*Real-time tournament bracket management with live updates*

![Pong Game 3D](./docs/images/pong-game-3d.png)
*3D Pong game rendered with Babylon.js showing real-time multiplayer action*

![Connect4 Game](./docs/images/connect4-game.png)
*Connect4 game with gravity animations and tournament integration*

![User Profile & 2FA](./docs/images/profile-2fa.png)
*User profile management with Two-Factor Authentication setup*

![Live Chat System](./docs/images/live-chat.png)
*Real-time chat system with friend management and user presence*

## 🏗️ Architecture

### **Frontend Architecture**
- **Framework**: Vanilla TypeScript with Vite build system
- **UI Framework**: Custom component-based architecture with TailwindCSS
- **Routing**: Custom SPA router with history API
- **3D Graphics**: Babylon.js for Pong game rendering
- **Styling**: TailwindCSS with custom cyberpunk theme
- **Authentication**: JWT cookies + Google OAuth 2.0

### **Backend Architecture**
- **Runtime**: Node.js with Fastify framework
- **Database**: SQLite with async/await pattern
- **Real-time**: WebSocket connections for live gaming and chat
- **Authentication**: JWT tokens + bcrypt password hashing
- **Security**: TOTP 2FA with QR code generation

### **Infrastructure**
- **Containerization**: Docker Compose with multi-service setup
- **Web Server**: Nginx with SSL termination and reverse proxy
- **Development**: Hot reload with volume mounting
- **Production**: Optimized builds with static asset serving

## 🚀 Features

### **🎮 Game Systems**
- **Pong**: Real-time multiplayer with 3D Babylon.js rendering
- **Connect4**: Turn-based multiplayer with gravity animations
- **AI Opponents**: Multiple difficulty levels for single-player
- **Tournament System**: Bracket-style elimination tournaments
- **Real-time Synchronization**: WebSocket-based game state management

### **👥 User Management**
- **Registration/Login**: Traditional form-based authentication
- **Google OAuth 2.0**: One-click social authentication
- **Two-Factor Authentication**: TOTP with QR code setup
- **Profile Management**: Avatar upload, username/password changes
- **Session Management**: Multi-device login tracking and forced logout

### **🏆 Tournament Features**
- **Room Creation**: Custom tournament rooms with invite system
- **Real-time Matchmaking**: Automatic bracket generation
- **Live Updates**: WebSocket notifications for tournament progress
- **Admin Controls**: Room management and player moderation
- **Spectator Mode**: View ongoing matches

### **💬 Social Features**
- **Live Chat**: Real-time messaging with WebSocket
- **Friend System**: Add/remove friends with online status
- **User Blocking**: Privacy controls and harassment prevention
- **Activity Feed**: Recent login tracking and user presence

### **🎨 User Interface**
- **Cyberpunk Theme**: Neon colors, glitch effects, and cyber aesthetics
- **Responsive Design**: Mobile-first approach with desktop optimization
- **Animations**: CSS transitions and custom keyframe animations
- **Loading States**: Smooth transitions and progress indicators

## 🛠️ Technology Stack

### **Frontend Technologies**
```typescript
// Core Technologies
- TypeScript 5.8.3
- Vite 6.3.5 (Build tool)
- TailwindCSS 3.4.17 (Styling)
- Babylon.js 8.11.0 (3D graphics)

// Development Tools
- PostCSS (CSS processing)
- Autoprefixer (Browser compatibility)
- @types/node (TypeScript definitions)
```

### **Backend Technologies**
```javascript
// Core Framework
- Node.js with Fastify 5.3.3
- SQLite3 5.1.7 (Database)
- @fastify/jwt 9.1.0 (Authentication)
- @fastify/websocket 11.1.0 (Real-time)

// Security & Authentication
- bcrypt 6.0.0 (Password hashing)
- speakeasy 2.0.0 (TOTP 2FA)
- google-auth-library 9.15.1 (OAuth)
- qrcode 1.5.4 (QR code generation)

// Additional Features
- @fastify/multipart 9.0.3 (File uploads)
- @fastify/cors 11.0.1 (CORS handling)
- @fastify/cookie 11.0.2 (Cookie management)
```

### **Infrastructure**
```yaml
# Docker Services
- nginx:latest (Web server & SSL)
- node:latest (Backend API)
- node:latest (Frontend build)

# Development Tools
- Docker Compose (Orchestration)
- Volume mounting (Hot reload)
- Environment variables (.env)
```

## 📁 Project Structure

```
transcendence/
├── docker/                          # Docker configuration
│   ├── nginx/                      # Nginx web server setup
│   │   ├── Dockerfile
│   │   ├── nginx.conf              # SSL + reverse proxy config
│   │   └── html/index.html         # Static assets
│   ├── fastify/                    # Backend API container
│   │   ├── Dockerfile
│   │   └── Dockerfile.dev
│   └── vite/                       # Frontend build container
│       ├── Dockerfile
│       └── Dockerfile.dev
├── volumes/
│   ├── src_back/                   # Backend application
│   │   ├── server.js               # Fastify server entry point
│   │   ├── database_sql.db         # SQLite database
│   │   ├── package.json
│   │   ├── routes/                 # API route modules
│   │   │   ├── user_management.js  # Auth, profiles, 2FA
│   │   │   ├── game.js            # Game logic & tournaments
│   │   │   ├── matchmaking.js     # Tournament management
│   │   │   └── livechat.js        # Real-time chat
│   │   ├── uploads/               # User avatar storage
│   │   └── utils/                 # Shared utilities
│   │       ├── db.js
│   │       ├── global.js
│   │       └── matchmaking.js
│   └── src_front/                  # Frontend application
│       ├── index.html              # Entry point
│       ├── vite.config.ts          # Vite configuration
│       ├── tailwind.config.js      # TailwindCSS theme
│       ├── package.json
│       ├── router/                 # SPA routing
│       │   └── Router.ts
│       └── src/
│           ├── main.ts             # Application bootstrap
│           ├── assets/             # Static assets
│           ├── styles/style.css    # Global styles
│           ├── types/              # TypeScript definitions
│           ├── utils/              # Shared utilities
│           ├── core/               # Core components
│           │   ├── components/     # Reusable components
│           │   │   ├── pong/       # Pong game engine
│           │   │   ├── connect4/   # Connect4 game engine
│           │   │   └── Chat/       # Chat components
│           │   └── templates/      # Page templates
│           └── pages/              # Application pages
│               ├── dashboard/
│               ├── login/
│               ├── register/
│               ├── profile/
│               ├── settings/
│               ├── friends/
│               ├── room/           # Tournament rooms
│               ├── play/           # Game playing
│               ├── pongs/          # Pong variants
│               ├── connect4/       # Connect4 variants
│               └── tournament/     # Tournament management
├── docker-compose.yml              # Production orchestration
├── docker-compose.dev.yml          # Development orchestration
├── Makefile                        # Build automation
├── .env                           # Environment variables
└── package.json                   # Root dependencies
```

## 🔧 Installation & Setup

### **Prerequisites**
```bash
# Required software
- Docker & Docker Compose
- Node.js 18+ (for local development)
- Make (optional, for convenient commands)
```

### **Environment Configuration**
Create a `.env` file in the project root:
```bash
# Google OAuth 2.0 Configuration
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# JWT Security
JWT_SECRET=your_super_secure_jwt_secret_key_here

# Optional: Database Configuration
DATABASE_PATH=./database_sql.db
```

### **Quick Start**
```bash
# Clone the repository
git clone <repository_url>
cd transcendence

# Start development environment
make up-dev
# OR
docker compose -f docker-compose.dev.yml up --build -d

# Access the application
open https://localhost:4430
```

### **Production Deployment**
```bash
# Build and start production services
make up
# OR
docker compose -f docker-compose.yml up --build -d

# Services will be available at:
# - Frontend: https://localhost:4430 (Nginx + SSL)
# - Backend API: https://localhost:4430/api (Proxied through Nginx)
```

### **Development Commands**
```bash
# Start development environment
make up-dev

# Stop all services
make down

# Clean up Docker resources
make fullclean

# Manual container management
docker compose logs fastify        # View backend logs
docker compose logs vite          # View frontend logs
docker compose exec fastify sh    # Access backend container
```

## 🗄️ Database Schema

### **Core Tables**
```sql
-- User Management
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255),
    sub_google VARCHAR(255) UNIQUE,      -- Google OAuth ID
    secret_totp VARCHAR(255),            -- 2FA secret
    avatar_url VARCHAR(500),
    level INTEGER DEFAULT 0,
    created_at DATETIME,
    last_online DATETIME,
    last_username_change DATETIME
);

-- Authentication Sessions
CREATE TABLE login_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    session_id VARCHAR(255),
    token_hash VARCHAR(255),
    browser VARCHAR(100),
    os VARCHAR(100),
    ip VARCHAR(45),
    user_agent TEXT,
    login_time DATETIME,
    logout_time DATETIME,
    is_active INTEGER DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Social Features
CREATE TABLE friends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    friend_id INTEGER,
    status VARCHAR(20) DEFAULT 'pending',
    created_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (friend_id) REFERENCES users(id)
);

CREATE TABLE blocked_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    blocked_user_id INTEGER,
    created_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (blocked_user_id) REFERENCES users(id)
);

-- Tournament System
CREATE TABLE rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100),
    admin_id INTEGER,
    round INTEGER DEFAULT 0,
    started INTEGER DEFAULT 0,
    finished INTEGER DEFAULT 0,
    finished_with_error INTEGER DEFAULT 0,
    winner_id INTEGER,
    game_type VARCHAR(20) DEFAULT 'pong',
    created_at DATETIME,
    FOREIGN KEY (admin_id) REFERENCES users(id),
    FOREIGN KEY (winner_id) REFERENCES users(id)
);

CREATE TABLE rooms_players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER,
    user_id INTEGER,
    FOREIGN KEY (room_id) REFERENCES rooms(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Game History
CREATE TABLE matchs_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_room INTEGER,
    first_player INTEGER,
    second_player INTEGER,
    winner_id INTEGER,
    first_player_score INTEGER,
    second_player_score INTEGER,
    round INTEGER,
    finished INTEGER DEFAULT 0,
    FOREIGN KEY (id_room) REFERENCES rooms(id),
    FOREIGN KEY (first_player) REFERENCES users(id),
    FOREIGN KEY (second_player) REFERENCES users(id),
    FOREIGN KEY (winner_id) REFERENCES users(id)
);

CREATE TABLE connect4_online_matchs_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_room INTEGER,
    first_player INTEGER,
    second_player INTEGER,
    winner_id INTEGER,
    round INTEGER,
    finished INTEGER DEFAULT 0,
    FOREIGN KEY (id_room) REFERENCES rooms(id),
    FOREIGN KEY (first_player) REFERENCES users(id),
    FOREIGN KEY (second_player) REFERENCES users(id),
    FOREIGN KEY (winner_id) REFERENCES users(id)
);

-- Chat System
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    username VARCHAR(50),
    message TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## 🌐 API Documentation

### **Authentication Endpoints**
```javascript
// User Registration
POST /api/register
Body: { username: string, password: string }
Response: { success: boolean, error?: string }

// User Login
POST /api/login
Body: { username: string, password: string, code_totp?: string }
Response: { success: boolean, error?: string }

// Google OAuth
POST /api/auth/google
Body: { id_token: string }
Response: { success: boolean, needs_username?: boolean }

// Complete Google Registration
POST /api/auth/google/complete
Body: { id_token: string, username: string, password: string }
Response: { success: boolean, error?: string }

// Logout
POST /api/logout
Response: { success: boolean }
```

### **Profile Management**
```javascript
// Get User Profile
GET /api/test_my_profile
Response: { 
    success: boolean, 
    id: number, 
    username: string, 
    avatar_url?: string,
    level: number 
}

// Update Profile
POST /api/update_profile
Body: { username?: string, currentPassword?: string, newPassword?: string }
Response: { success: boolean, error?: string }

// Upload Avatar
POST /api/upload_avatar
Body: FormData with 'avatar' file
Response: { success: boolean, avatar_url?: string, error?: string }
```

### **Two-Factor Authentication**
```javascript
// Setup 2FA
GET /api/2fa/setup
Response: { success: boolean, qr_image: string, secret_key: string }

// Check 2FA Status
GET /api/2fa/activated
Response: { success: boolean, activated: boolean }

// Disable 2FA
GET /api/2fa/disable
Response: { success: boolean }
```

### **Tournament System**
```javascript
// Create Tournament Room
POST /api/pong/create_room
Body: { name: string }
Response: { success: boolean, room_id: number, room_name: string, user_id: number }

// Join Room
GET /api/join_room/:room_id
Response: { success: boolean, room_id: number, room_name: string, user_id: number }

// Start Tournament
GET /api/start/:room_id
Response: { success: boolean }

// Get Room Players
GET /api/rooms_players/:room_id
Response: { success: boolean, tabl_players: Array<{user_id: number, username: string}> }

// Invite Player
GET /api/invite_player_tournament/:user_id
Response: { success: boolean, error?: string }
```

### **Game Management**
```javascript
// Check if Can Play
GET /api/can_play/:room_id
Response: { success: boolean, can_play: boolean, match_id?: number }

// Get Current Matches
GET /api/matchs_current/:room_id
Response: { success: boolean, matchs: Array<{id_match: number, first_player: string, second_player: string}> }

// Get Tournament Winner
GET /api/winner/:room_id
Response: { success: boolean, winner_username: string }
```

### **Social Features**
```javascript
// Get Friends List
GET /api/friends
Response: { success: boolean, friends: Array<{id: number, username: string, status: string, last_online: string}> }

// Send Friend Request
POST /api/send_friend_request
Body: { username: string }
Response: { success: boolean, error?: string }

// Accept Friend Request
POST /api/accept_friend_request/:friend_id
Response: { success: boolean }

// Block User
POST /api/block_user/:user_id
Response: { success: boolean }
```

## 🎮 WebSocket Connections

### **Tournament Room WebSocket**
```javascript
// Connection
WSS /api/ws/join_room/:room_id

// Message Types
{
    "success": true,
    "cause": "user_joined" | "kick" | "list_matchs" | "end_of_tournament" | "tournament_stopped",
    "id_player"?: number,
    "winner"?: string
}
```

### **Game Play WebSocket**
```javascript
// Pong Game Connection
WSS /api/ws/play/:match_id

// Connect4 Game Connection  
WSS /api/ws/play/connect4/:match_id

// Message Types
{
    "type": "connection" | "game_start" | "move" | "game_end",
    "gameType": "pong" | "connect4",
    "player1"?: string,
    "player2"?: string,
    "isPlayer1"?: boolean,
    "winner"?: string
}
```

### **Live Chat WebSocket**
```javascript
// Connection
WSS /api/ws/chat

// Message Types
{
    "type": "message" | "user_join" | "user_leave",
    "username": string,
    "message": string,
    "timestamp": string
}
```

## 🎨 Frontend Architecture

### **Component System**
```typescript
// Base Page Class
abstract class Page {
    protected container: HTMLElement;
    protected router?: Router;
    
    constructor(id: string, router?: Router);
    abstract render(): Promise<HTMLElement>;
    setupHeaderListeners(): Promise<void>;
    createSidebar(): Promise<string>;
}

// Game Components
class PongComponent {
    private engine: Engine;
    private scene: Scene;
    private canvas: HTMLCanvasElement;
    
    constructor(player1: string, player2: string, options?: GameOptions);
    render(): HTMLElement;
    setMultiplayerCallbacks(callbacks: MultiplayerCallbacks): void;
}

class Connect4Component {
    private board: number[][];
    private currentPlayer: number;
    private gameEnded: boolean;
    
    constructor(player1: string, player2: string, options?: GameOptions);
    addSingleDisc(row: number, col: number, player: number): void;
    setMultiplayerCallbacks(callbacks: MultiplayerCallbacks): void;
}
```

### **Routing System**
```typescript
class Router {
    private routes: Record<string, () => HTMLElement | Promise<HTMLElement>>;
    
    constructor(outletId: string);
    register(path: string, component: () => HTMLElement | Promise<HTMLElement>): void;
    navigate(path: string): void;
    loadRoute(): Promise<void>;
}

// Usage
const router = new Router('app');
router.register('/dashboard', () => new DashboardPage('dashboard', router).render());
router.register('/login', () => new LoginPage('login', router).render());
```

### **State Management**
```typescript
// Session Storage for Game State
sessionStorage.setItem('room', JSON.stringify({
    room_id: number,
    admin: boolean,
    room_name: string,
    user_id: number
}));

sessionStorage.setItem('match_id', string);
sessionStorage.setItem('tournament_started', 'true' | 'false');
sessionStorage.setItem('tournament_finished', 'true' | 'false');

// Local Storage for Authentication
localStorage.setItem('authToken', 'authenticated');

// Global User Object
(window as any).user = {
    id: number,
    username: string,
    avatar_url?: string
};
```

## 🔒 Security Features

### **Authentication Security**
- **JWT Tokens**: HTTP-only cookies with secure flags
- **Password Hashing**: bcrypt with salt rounds
- **Session Management**: Unique session IDs with token hashing
- **2FA Support**: TOTP with QR code setup
- **OAuth Integration**: Google Sign-In with server-side verification

### **Input Validation**
```typescript
// Frontend Validation
const validateUsername = (username: string): boolean => {
    return username.length >= 3 && 
           username.length <= 20 && 
           /^[a-zA-Z0-9_-]+$/.test(username);
};

const validatePassword = (password: string): boolean => {
    return password.length >= 6;
};

// Backend Validation (Fastify)
const userSchema = {
    type: 'object',
    required: ['username', 'password'],
    properties: {
        username: { type: 'string', minLength: 3, maxLength: 20 },
        password: { type: 'string', minLength: 6 }
    }
};
```

### **Security Headers**
```nginx
# nginx.conf security configuration
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://accounts.google.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' wss:; frame-src https://accounts.google.com;" always;
```

## 🚀 Performance Optimizations

### **Frontend Optimizations**
- **Code Splitting**: Dynamic imports for game components
- **Asset Optimization**: Vite build optimization
- **CSS Optimization**: TailwindCSS purging
- **Bundle Analysis**: Chunk size monitoring

### **Backend Optimizations**
- **Database Indexing**: Strategic indexes on foreign keys
- **Connection Pooling**: SQLite with prepared statements
- **WebSocket Optimization**: Connection reuse and ping/pong
- **Caching**: Static asset caching with Nginx

### **Infrastructure Optimizations**
- **Nginx Caching**: Static asset caching with versioning
- **Gzip Compression**: Text compression for reduced bandwidth
- **Docker Multi-stage**: Optimized container builds
- **Volume Optimization**: Persistent data and development hot reload

## 🧪 Development Guide

### **Local Development Setup**
```bash
# Start development environment
make up-dev

# Frontend development (Hot reload enabled)
cd volumes/src_front
npm run dev

# Backend development (Nodemon auto-restart)
cd volumes/src_back
npm run dev

# Access services
# Frontend: http://localhost:5173 (Dev server)
# Backend: https://localhost:4430/api (Through Nginx)
# Full App: https://localhost:4430 (Production-like)
```

### **Code Style Guidelines**
```typescript
// TypeScript Style
interface GameOptions {
    aiType?: 'easy' | 'medium' | 'hard';
    onGameEnd?: (winner: string) => void;
    isTournamentMode?: boolean;
}

class GameComponent {
    private readonly player1: string;
    private readonly player2: string;
    
    constructor(player1: string, player2: string, options?: GameOptions) {
        this.player1 = player1;
        this.player2 = player2;
    }
    
    public async initializeGame(): Promise<void> {
        // Implementation
    }
}
```

### **Database Migrations**
```javascript
// Add new columns safely
try {
    await db.run("ALTER TABLE users ADD COLUMN new_field VARCHAR(255) DEFAULT NULL");
} catch (err) {
    if (!err.message.includes('duplicate column name')) {
        throw err;
    }
}
```

### **Testing Endpoints**
```bash
# Test authentication
curl -X POST https://localhost:4430/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass"}' \
  -c cookies.txt

# Test authenticated endpoint
curl -X GET https://localhost:4430/api/test_my_profile \
  -b cookies.txt

# Test WebSocket (using wscat)
npm install -g wscat
wscat -c wss://localhost:4430/api/ws/chat
```

## 🐛 Troubleshooting

### **Common Issues**

**SSL Certificate Issues**
```bash
# For development, accept self-signed certificates
# Chrome: Advanced -> Proceed to localhost (unsafe)
# Firefox: Advanced -> Accept the Risk and Continue
```

**Docker Issues**
```bash
# Clean Docker environment
make fullclean
docker system prune -a -f

# Check container logs
docker compose logs -f fastify
docker compose logs -f nginx
```

**Database Issues**
```bash
# Access database directly
docker compose exec fastify sh
sqlite3 database_sql.db
.tables
.schema users
```

**WebSocket Connection Issues**
```bash
# Check if WebSocket upgrade is working
# Browser DevTools -> Network -> Filter: WS
# Should show successful WebSocket connections
```

### **Environment Variables**
```bash
# Ensure .env file is configured
cat .env

# For Google OAuth, verify client ID
# Should match Google Cloud Console configuration
```

## 📈 Future Enhancements

### **Planned Features**
- **Additional Games**: Chess, Checkers, Tic-tac-toe
- **Advanced Tournaments**: Double elimination, Swiss system
- **Spectator Mode**: Live game viewing with chat
- **Mobile App**: React Native mobile client
- **Advanced Statistics**: ELO rating system, match history analytics
- **Social Features**: Clubs, leaderboards, achievements

### **Technical Improvements**
- **Microservices**: Split into game service, user service, chat service
- **Database Migration**: PostgreSQL for better performance
- **Redis Integration**: Caching and session storage
- **Kubernetes**: Container orchestration for scaling
- **Monitoring**: Prometheus + Grafana for metrics
- **Testing**: Unit tests, integration tests, E2E tests

## 📝 License

This project is part of the 42 School curriculum and is intended for educational purposes.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section above
- Review the API documentation for endpoint usage

---

**Transcendence** - Where classic games meet modern technology 🚀

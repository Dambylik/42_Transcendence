![ascii-text-art](https://github.com/Dambylik/42-project-badges/blob/main/badges/ft_transcendencem.png)

## 📖 Introduction

ft_transcendence is the final core project at 42 School, a full-stack web application designed to deliver a modern, real-time multiplayer online classic games (Pong and Connect4). This project goes beyond basic gameplay, incorporating extensive user management, social features, and a robust backend infrastructure. It serves as a comprehensive demonstration of full-stack development skills, real-time communication, database management, and cybersecurity best practices.

### Project Objectives

The core objective of ft_transcendence is to challenge students with unfamiliar technologies and complex tasks, fostering adaptability and problem-solving skills rather than simply demonstrating existing knowledge. This project emphasizes:

- **Adaptation**: Rapidly learning and implementing new programming languages, frameworks, and tools.
- **Problem-Solving**: Tackling intricate challenges in real-time game development, secure authentication, and scalable architecture.
- **Design & Planning**: Encouraging thoughtful design and project management before coding, especially given the project's long-term nature and potential for complex interdependencies.
- **Mandatory Requirements & Modules**: Adhering to a baseline set of features and then selecting a minimum of 7 major modules from a predefined list, each with specific technology constraints.

### 📸 Project Screenshots

![Welcome board](https://github.com/Dambylik/42_Transcendence/blob/main/screens/entry.png)

| | |
|:-------------------------:|:-------------------------:|
| <img width="1230" alt="Screen Shot 2024-05-09 at 12 22 47 PM" src="https://github.com/Dambylik/42_Transcendence/blob/main/screens/access.png"> | <img width="1245" alt="Screen Shot 2024-05-09 at 12 24 31 PM" src="https://github.com/Dambylik/42_Transcendence/blob/main/screens/registry.png">
| <img width="1346" alt="Screen Shot 2024-05-09 at 12 47 45 PM" src="https://github.com/Dambylik/42_Transcendence/blob/main/screens/chat.png"> | <img width="1288" alt="Screen Shot 2024-05-09 at 12 40 14 PM" src="https://github.com/Dambylik/42_Transcendence/blob/main/screens/friends.png"> |

![Dashboard Overview](https://github.com/Dambylik/42_Transcendence/blob/main/screens/dashboard.png)
*Main dashboard featuring the cyberpunk-themed interface and game selection*

| | |
|:-------------------------:|:-------------------------:|
| <img width="1230" alt="Screen Shot 2024-05-09 at 12 22 47 PM" src="https://github.com/Dambylik/42_Transcendence/blob/main/screens/pong_levels.png"> | <img width="1245" alt="Screen Shot 2024-05-09 at 12 24 31 PM" src="https://github.com/Dambylik/42_Transcendence/blob/main/screens/pong_ia.png">
| <img width="1346" alt="Screen Shot 2024-05-09 at 12 47 45 PM" src="https://github.com/Dambylik/42_Transcendence/blob/main/screens/pong_game_over.png"> | <img width="1288" alt="Screen Shot 2024-05-09 at 12 47 45 PM" src="https://github.com/Dambylik/42_Transcendence/blob/main/screens/tournament_invite.png"> |
*3D Pong game rendered with Babylon.js showing real-time multiplayer action*


![Connect4 Game](https://github.com/Dambylik/42_Transcendence/blob/main/screens/connect_4_1.png)
*Connect4 game with gravity animations and tournament integration*

![Settings](https://github.com/Dambylik/42_Transcendence/blob/main/screens/settings.png)
*Settings management with Two-Factor Authentication setup*

![User Profile](https://github.com/Dambylik/42_Transcendence/blob/main/screens/profile.png)
*User profile management with game stats*
## 🏗️ Architecture

### **Frontend Architecture**
- **Framework**: Vanilla TypeScript with Vite build system
- **UI Framework**: Custom component-based architecture with TailwindCSS
- **Routing**: Custom SPA router with history API
- **3D Graphics**: Babylon.js for Pong & Connect4 game rendering
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

```bash
# Clone the repository
git clone <repository_url>
cd transcendence

# Start development environment
make up-dev
# Build and start production services
docker exec -it front_end_vite_new npm run build

# Access the application
open https://localhost:4430
```

# AVAI Frontend Application

## Project Overview

**AVAI Agent for Hire Frontend** - Advanced AI Agent Interface for Internet Computer Canister Integration

This is the frontend interface for the AVAI (Advanced AI Agent) system, providing a modern React-based UI for interacting with Internet Computer canisters and AI agents.

## Features

- **Real-time WebSocket Communication** - Live updates and agent interactions
- **Internet Computer Integration** - Direct canister communication
- **Redis Queue Management** - Real-time task processing
- **Responsive Design** - Modern UI with dark/light themes
- **TypeScript Support** - Full type safety and developer experience

## Development Setup

### Prerequisites

- Node.js 18+ and npm installed
- Access to AVAI backend services
- Internet Computer development environment (optional for local testing)

### Installation

```bash
# Clone the repository
git clone https://github.com/AVAICannisterAgent/AVAI-CannisterAgent.git
cd AVAI-CannisterAgent/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Build and Deployment

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Deploy to Production

Build the project and deploy the `dist` folder to your hosting platform.

## Technologies Used

- **React** - Frontend framework
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Modern component library
- **WebSocket API** - Real-time communication
- **Internet Computer SDK** - Canister integration

## Project Structure

```
frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Application pages
│   ├── lib/           # Utility functions and configurations
│   ├── hooks/         # Custom React hooks
│   └── types/         # TypeScript type definitions
├── public/            # Static assets
└── dist/             # Production build output
```

## WebSocket Integration

The frontend connects to the AVAI WebSocket server at `wss://websocket.avai.life/ws` for real-time agent communication and updates.

## Internet Computer Integration

This frontend is designed to work with AVAI canisters deployed on the Internet Computer network, providing seamless integration with decentralized backend services.

## Configuration

Environment variables can be configured in `.env` files:

- `VITE_WEBSOCKET_URL` - WebSocket server URL
- `VITE_API_URL` - Backend API URL
- `VITE_CANISTER_ID` - Internet Computer canister ID

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is part of the AVAI Agent for Hire system. See LICENSE.md for details.

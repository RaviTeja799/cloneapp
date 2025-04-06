# GuardiaAI App

A SafeCommunity platform powered by AI to promote positive online interactions and prevent harmful content.

## Overview

GuardiaAI provides real-time content moderation for social communities using AI to detect and filter hate speech, violent content, and offensive language, ensuring a safe online environment for all users.

## Features

- **AI-powered Content Moderation**: Automatic detection of harmful content
- **User Authentication**: Secure login and user management
- **Content Publishing**: Users can share posts with the community
- **Moderator Dashboard**: Administration tools for content oversight
- **Privacy-focused**: User data protection and content safety

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account

### Installation

1. Clone the repository
```bash
git clone https://github.com/RaviTeja799/guardiaAIApp.git
cd guardiaAIApp
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file in the root directory with your Firebase configuration
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Development

Start the development server:
```bash
npm run dev
```

### Building for Production

Build the application for production:
```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Deployment

Deploy to Firebase Hosting:
```bash
firebase deploy
```

## Technology Stack

- React with TypeScript
- Vite build tool
- Firebase (Auth, Firestore, Storage, Hosting)
- Content moderation APIs

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

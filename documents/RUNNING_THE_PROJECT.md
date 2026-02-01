# Running FounderFlow

This guide explains how to run the FounderFlow project after you have completed the initial setup (see [SETUP_GUIDE.md](SETUP_GUIDE.md)).

## Quick Start (Development)

To start the development server with hot-reloading:

```bash
cd founder-flow
npm run dev
```

- **URL**: [http://localhost:3000](http://localhost:3000)
- **Port**: 3000 (default)

## Available Scripts

All commands should be run from the `founder-flow` directory.

### Development
```bash
npm run dev
```
Starts the Next.js development server.

### Production Build
To create a production-ready build:
```bash
npm run build
```
This compiles the application and optimizes it for performance. Verification of the build is recommended before deployment.

### Production Start
To start the application in production mode (requires `npm run build` first):
```bash
npm run start
```

### Linting
To check for code issues:
```bash
npm run lint
```

## Troubleshooting

- **Port in use**: If port 3000 is taken, Next.js will usually try 3001. Check the terminal output for the correct URL.
- **Missing dependencies**: If you see errors about missing modules, run:
  ```bash
  npm install
  ```
- **Environment Variables**: Ensure `.env.local` is present in the `founder-flow` folder.

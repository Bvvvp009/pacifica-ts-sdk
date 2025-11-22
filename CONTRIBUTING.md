# Contributing to Pacifica TypeScript SDK

Thank you for your interest in contributing! This is a community-built SDK, and we welcome contributions from everyone.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/ts-sdk.git`
3. Install dependencies: `npm install`
4. Create a branch: `git checkout -b feature/your-feature-name`

## Development Setup

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Watch mode for development
npm run dev

# Run linter
npm run lint
```

## Code Style

- Use TypeScript strict mode
- Follow existing code style and patterns
- Add JSDoc comments for public methods
- Export types and interfaces properly
- Use async/await for asynchronous operations

## Project Structure

```
src/
├── clients/          # API clients (SignClient, ApiClient, WebSocketClient)
├── types/           # TypeScript type definitions
├── utils/            # Utility functions (signing, etc.)
└── index.ts          # Main entry point
```

## Adding New Features

1. **New Endpoints**: Add methods to `SignClient` or `ApiClient` as appropriate
2. **New Types**: Add to `src/types/index.ts`
3. **New Utilities**: Add to appropriate utility file or create new one
4. **Documentation**: Update README.md with examples

## Testing

Before submitting a PR, please:

- [ ] Build the project successfully (`npm run build`)
- [ ] Run the linter (`npm run lint`)
- [ ] Test your changes manually
- [ ] Update documentation if needed
- [ ] Add examples if adding new features

## Pull Request Process

1. Ensure your code follows the project's style guidelines
2. Update the README.md if you're adding new features
3. Write clear commit messages
4. Reference any related issues in your PR description
5. Wait for review and address any feedback

## Questions?

Feel free to open an issue for questions or discussions about the SDK.

## Official Inclusion

This SDK is community-built. Once stable and feature-complete, we plan to reach out to the Pacifica team for official inclusion. Your contributions help make this possible!

Thank you for contributing! 🚀

















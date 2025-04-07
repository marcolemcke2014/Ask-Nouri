# Contributing to Paquapp_v1

Thank you for your interest in contributing to Paquapp_v1! This document provides guidelines and instructions for contributing to this project.

## Code Architecture Guidelines

Paquapp_v1 follows a "Russian doll" modular architecture where each feature, function, and UI component lives in its own neatly organized unit.

### Core Principles

1. **Everything must be modular** — each logical piece in its own file
2. **Avoid bloated components or endpoints** — break things into smaller files
3. **Structure for safe AI evolution** — make it easy for future AI to understand and extend
4. **Think in layers**: UI → logic → data → services

### File Organization Rules

- **One concern per file**: Each file should handle exactly one logical concern
- **Predictable imports**: Files that work together should be near each other
- **Domain separation**: Group files by domain (auth, scan, analyze) not technology
- **Shallow imports**: Use absolute imports with `@/` prefix over relative paths

### File Placement Rules

- Logic → `/lib`
- Types → `/types` 
- UI → `/components`
- State logic → `/hooks`
- API endpoints → `/app/api/`

## Development Workflow

### Setting Up Development Environment

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Create `.env.local` with required environment variables (see README)
4. Start development server: `npm run dev`

### Making Changes

1. Create a new branch for your changes
2. Make your changes following the code style guidelines
3. Write or update tests when necessary
4. Ensure all linting and type checks pass: `npm run lint`
5. Submit a pull request

## Pull Request Process

1. Update the README.md with details of changes if needed
2. Update documentation in relevant files if needed
3. Update the CHANGELOG.md with your changes if applicable
4. Submit the PR with a clear description of the changes and why they're needed

## Code Style Guidelines

### TypeScript

- Use TypeScript for all files
- No use of `any` type - define proper interfaces/types
- Use interfaces for objects that can be extended, types for unions/exact shapes
- Use enums for finite sets of options

### React Components

- Use functional components with hooks
- Use React.FC or proper TypeScript component typing
- Keep components small and focused
- Extract complex logic to custom hooks
- Use composition over inheritance

### File Naming Conventions

- CamelCase for filenames in `/lib`, `/types`, `/hooks`
- PascalCase for filenames in `/components`
- Snake case for API routes
- Use descriptive names that indicate purpose

### Code Formatting

- Use prettier for code formatting
- Use ESLint with recommended rules
- Keep line length reasonable (80-100 characters)
- Use meaningful variable and function names

## Testing Guidelines

- Write tests for critical functionality
- Use React Testing Library for component tests
- Use Jest for unit tests
- Test edge cases and error scenarios

## Documentation Guidelines

- Add JSDoc comments to functions and components
- Document complex logic with inline comments
- Keep documentation up to date when changing code
- Include purpose, parameters, and return values in comments

## Commit Message Guidelines

Follow conventional commits pattern:

```
feat: add new feature
fix: resolve bug
docs: update documentation
style: formatting changes
refactor: code changes that don't change behavior
test: add or update tests
chore: maintenance tasks
```

## Questions or Problems?

If you have questions or encounter problems, please:

1. Check existing issues to see if it's already reported
2. Open a new issue with a clear description and steps to reproduce

Thank you for contributing to Paquapp_v1! 
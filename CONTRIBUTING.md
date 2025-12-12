# Contributing to Sawa App

Thank you for your interest in contributing to Sawa App! This document provides guidelines and instructions for contributing.

## 🚀 Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone <your-fork-url>
   cd Sawa_App
   ```

3. **Install dependencies**
   ```bash
   npm run install:all
   ```

4. **Set up environment variables**
   - Copy `backend/.env.example` to `backend/.env` and configure it
   - Set up frontend environment variables if needed

5. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 📝 Code Style

- Follow the existing code style
- Run linting before committing: `npm run lint`
- Format code: `npm run format`
- Use TypeScript for type safety
- Write meaningful commit messages

## 🧪 Testing

- Write tests for new features
- Ensure all tests pass before submitting
- Test on both iOS and Android for frontend changes

## 📦 Commit Guidelines

Use conventional commit messages:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Example:
```
feat: add user authentication endpoint
fix: resolve CORS issue in development
docs: update API documentation
```

## 🔍 Pull Request Process

1. Update documentation if needed
2. Ensure all tests pass
3. Run linting and formatting
4. Create a descriptive PR with:
   - What changes were made
   - Why the changes were needed
   - How to test the changes

## 📋 Checklist

Before submitting a PR, ensure:

- [ ] Code follows the project's style guidelines
- [ ] All linting checks pass
- [ ] Code is properly formatted
- [ ] Documentation is updated (if needed)
- [ ] Tests are added/updated (if applicable)
- [ ] No console.logs or debug code left behind
- [ ] Environment variables are documented (if new ones are added)

## 🐛 Reporting Bugs

When reporting bugs, please include:

- Description of the issue
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Environment details (OS, Node version, etc.)

## 💡 Feature Requests

For feature requests:

- Describe the feature clearly
- Explain why it would be useful
- Provide examples if possible

Thank you for contributing! 🎉


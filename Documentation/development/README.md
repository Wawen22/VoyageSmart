# Development Guide

<div align="center">
  <h3>💻 Developer Resources</h3>
  <p>Everything developers need to contribute to VoyageSmart effectively.</p>
</div>

---

## 🛠️ Developer Resources

| Resource | Description | Status |
|----------|-------------|---------|
| **[📏 Code Standards](./code-standards.md)** | Coding standards and best practices | ✅ Available |
| **[🧪 Testing Framework](./testing-framework.md)** | Testing guidelines and procedures | ✅ Available |
| **[🧪 Testing Guide](./testing.md)** | Comprehensive testing documentation | ✅ Available |
| **[🔒 Security](./security-implementations.md)** | Security implementations and guidelines | ✅ Available |
| **[🤝 Contributing](./contributing.md)** | How to contribute to VoyageSmart | ✅ Available |
| **[🚀 Deployment](./deployment.md)** | Production deployment guide | ✅ Available |
| **[🎨 UI/UX Improvements](./ui-ux-improvements.md)** | UI/UX development guidelines | ✅ Available |

---

## 🚀 Quick Start for Developers

Ready to contribute? Here's what you need:

1. Set up your development environment as described in the [Installation Guide](../getting-started/installation.md)
2. Familiarized yourself with the [Architecture](../architecture/README.md)
3. Read and understood the [Code Standards](./code-standards.md)

## 🛠️ Development Workflow

VoyageSmart follows a standard Git workflow:

1. **Fork the repository** (if you're an external contributor)
2. **Create a new branch** for your feature or bugfix
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** following the [Code Standards](./code-standards.md)
4. **Write tests** for your changes
5. **Run tests** to ensure everything works
   ```bash
   npm run test
   ```
6. **Commit your changes** using Conventional Commits
   ```bash
   git commit -m "feat: add new feature"
   ```
7. **Push your branch** to GitHub
   ```bash
   git push origin feature/your-feature-name
   ```
8. **Create a Pull Request** against the main branch

## 🧪 Testing

VoyageSmart uses a comprehensive testing strategy:

- **Unit Tests**: For testing individual functions and components
- **Integration Tests**: For testing interactions between components
- **End-to-End Tests**: For testing the application as a whole

For more details, see the [Testing Guide](./testing.md).

## 📦 Deployment

VoyageSmart uses a CI/CD pipeline for automated testing and deployment:

- **Development**: Automatically deployed from the `develop` branch
- **Staging**: Automatically deployed from the `staging` branch
- **Production**: Manually deployed from the `main` branch

For more details, see the [Deployment Guide](./deployment.md).

## 🤝 Contributing

We welcome contributions from the community! Whether it's fixing bugs, adding features, or improving documentation, your help is appreciated.

For more details, see the [Contributing Guide](./contributing.md).

## 📚 Useful Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://reactjs.org/docs)
- [Supabase Documentation](https://supabase.io/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/introduction/getting-started)
- [Styled Components Documentation](https://styled-components.com/docs)
- [Mapbox Documentation](https://docs.mapbox.com)

---

Next: [Code Standards](./code-standards.md)

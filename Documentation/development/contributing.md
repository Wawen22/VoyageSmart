# Contributing to VoyageSmart

<div align="center">
  <h3>🤝 Contributing Guidelines</h3>
  <p>Welcome to VoyageSmart! We're excited to have you contribute to our intelligent travel planning platform.</p>
</div>

---

## 🌟 Welcome Contributors!

Thank you for your interest in contributing to VoyageSmart! Whether you're fixing bugs, adding features, improving documentation, or suggesting enhancements, your contributions are valuable and appreciated.

### Ways to Contribute

- 🐛 **Bug Reports** - Help us identify and fix issues
- ✨ **Feature Requests** - Suggest new functionality
- 💻 **Code Contributions** - Submit bug fixes and new features
- 📚 **Documentation** - Improve guides and documentation
- 🎨 **Design** - Enhance UI/UX and visual design
- 🧪 **Testing** - Help improve test coverage and quality

---

## 🚀 Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js 18+** installed
- **Git** for version control
- **Code editor** (VS Code recommended)
- **Basic knowledge** of React, Next.js, and TypeScript

### Development Setup

1. **Fork the Repository**
   ```bash
   # Fork the repo on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/VoyageSmart.git
   cd VoyageSmart
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up Environment**
   ```bash
   cp .env.local.example .env.local
   # Fill in your environment variables
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Verify Setup**
   - Open http://localhost:3000
   - Ensure the application loads correctly
   - Run tests: `npm test`

---

## 📋 Contribution Workflow

### 1. Choose an Issue

- Browse [open issues](https://github.com/Wawen22/VoyageSmart/issues)
- Look for issues labeled `good first issue` for beginners
- Comment on the issue to express interest
- Wait for assignment before starting work

### 2. Create a Branch

```bash
# Create and switch to a new branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

**Branch Naming Convention:**
- `feature/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `docs/documentation-update` - Documentation changes
- `refactor/component-name` - Code refactoring
- `test/test-description` - Test additions/improvements

### 3. Make Your Changes

- Write clean, readable code
- Follow our [coding standards](./code-standards.md)
- Add tests for new functionality
- Update documentation as needed
- Commit frequently with clear messages

### 4. Test Your Changes

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:e2e

# Check code quality
npm run lint
npm run type-check

# Test build
npm run build
```

### 5. Submit a Pull Request

```bash
# Push your branch
git push origin feature/your-feature-name

# Create pull request on GitHub
```

---

## 💻 Code Standards

### Code Style

- **TypeScript**: Use TypeScript for all new code
- **ESLint**: Follow ESLint configuration
- **Prettier**: Use Prettier for code formatting
- **Naming**: Use descriptive, camelCase variable names
- **Comments**: Add comments for complex logic

### Component Guidelines

```typescript
// ✅ Good component structure
interface Props {
  title: string;
  onSubmit: (data: FormData) => void;
  isLoading?: boolean;
}

export const TripForm: React.FC<Props> = ({ 
  title, 
  onSubmit, 
  isLoading = false 
}) => {
  // Component logic here
  
  return (
    <div className="trip-form">
      {/* JSX here */}
    </div>
  );
};
```

### File Organization

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI components
│   └── features/       # Feature-specific components
├── pages/              # Next.js pages
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
├── styles/             # Global styles
└── __tests__/          # Test files
```

---

## 🧪 Testing Guidelines

### Test Requirements

- **Unit Tests**: All utility functions and hooks
- **Component Tests**: Critical UI components
- **Integration Tests**: API endpoints and workflows
- **E2E Tests**: Key user journeys

### Writing Tests

```typescript
// Example component test
import { render, screen, fireEvent } from '@testing-library/react';
import { TripForm } from '../TripForm';

describe('TripForm', () => {
  it('should submit form with valid data', async () => {
    const mockSubmit = jest.fn();
    
    render(
      <TripForm 
        title="Create Trip" 
        onSubmit={mockSubmit} 
      />
    );
    
    // Test implementation
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    
    expect(mockSubmit).toHaveBeenCalledWith(expectedData);
  });
});
```

### Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

---

## 📝 Commit Guidelines

### Commit Message Format

Use the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
type(scope): description

[optional body]

[optional footer]
```

### Commit Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
# Good commit messages
feat(trips): add trip sharing functionality
fix(auth): resolve login redirect issue
docs(api): update authentication documentation
test(expenses): add expense splitting tests

# Bad commit messages
fix bug
update code
changes
```

---

## 🔍 Pull Request Guidelines

### PR Requirements

- **Clear Title**: Descriptive title following commit conventions
- **Description**: Explain what changes were made and why
- **Issue Reference**: Link to related issues
- **Screenshots**: Include screenshots for UI changes
- **Tests**: Ensure all tests pass
- **Documentation**: Update relevant documentation

### PR Template

```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring

## Related Issues
Fixes #123

## Testing
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Screenshots
(If applicable)

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
```

### Review Process

1. **Automated Checks**: CI/CD pipeline runs tests
2. **Code Review**: Maintainers review code quality
3. **Testing**: Manual testing if needed
4. **Approval**: At least one maintainer approval required
5. **Merge**: Squash and merge to main branch

---

## 🐛 Bug Reports

### Before Reporting

- Search existing issues for duplicates
- Try to reproduce the bug consistently
- Test on the latest version
- Check if it's a known limitation

### Bug Report Template

```markdown
**Bug Description**
Clear description of the bug.

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What should happen.

**Actual Behavior**
What actually happens.

**Environment**
- OS: [e.g., Windows 10]
- Browser: [e.g., Chrome 91]
- Version: [e.g., 1.2.3]

**Screenshots**
If applicable, add screenshots.

**Additional Context**
Any other relevant information.
```

---

## ✨ Feature Requests

### Feature Request Template

```markdown
**Feature Description**
Clear description of the proposed feature.

**Problem Statement**
What problem does this solve?

**Proposed Solution**
How should this feature work?

**Alternatives Considered**
Other solutions you've considered.

**Additional Context**
Mockups, examples, or references.
```

---

## 🏆 Recognition

### Contributors

We recognize contributors in several ways:

- **Contributors List**: Listed in README.md
- **Release Notes**: Mentioned in release announcements
- **Special Thanks**: Featured in major releases
- **Contributor Badge**: GitHub contributor status

### Contribution Levels

- **First-time Contributor**: Welcome badge
- **Regular Contributor**: 5+ merged PRs
- **Core Contributor**: 20+ merged PRs
- **Maintainer**: Trusted with review privileges

---

## 📞 Getting Help

### Communication Channels

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and ideas
- **Email**: For private matters (contact@voyagesmart.com)

### Development Help

- **Code Questions**: Ask in GitHub Discussions
- **Setup Issues**: Check troubleshooting guides
- **Architecture Questions**: Tag maintainers in issues

---

## 📜 Code of Conduct

### Our Standards

- **Be Respectful**: Treat everyone with respect
- **Be Inclusive**: Welcome diverse perspectives
- **Be Constructive**: Provide helpful feedback
- **Be Patient**: Help newcomers learn
- **Be Professional**: Maintain professional communication

### Enforcement

Violations of the code of conduct should be reported to the maintainers. All reports will be reviewed and investigated promptly.

---

## 🔗 Additional Resources

- **[Code Standards](./code-standards.md)** - Detailed coding guidelines
- **[Testing Framework](./testing-framework.md)** - Testing best practices
- **[Security Guidelines](./security-implementations.md)** - Security considerations
- **[API Documentation](../api/)** - API reference guides

---

<div align="center">
  <p><strong>Thank you for contributing to VoyageSmart!</strong></p>
  <p>Together, we're building the future of intelligent travel planning. 🌍✈️</p>
</div>

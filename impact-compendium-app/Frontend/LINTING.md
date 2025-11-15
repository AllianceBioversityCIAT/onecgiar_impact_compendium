# Linting and Code Formatting Setup

This project uses ESLint and Prettier to maintain consistent code quality and formatting.

## Tools Configured

### ESLint
- **Purpose**: Code quality and error detection
- **Configuration**: `.eslintrc.cjs`
- **Rules**: TypeScript, React, and React Hooks best practices
- **Plugins**: 
  - `@typescript-eslint/eslint-plugin`
  - `@typescript-eslint/parser`
  - `eslint-plugin-react-hooks`
  - `eslint-plugin-react-refresh`
  - `eslint-plugin-prettier`

### Prettier
- **Purpose**: Code formatting
- **Configuration**: `.prettierrc`
- **Settings**:
  - Semi-colons: enabled
  - Single quotes: enabled
  - Print width: 80 characters
  - Tab width: 2 spaces
  - Trailing commas: ES5 compatible

## Available Scripts

```bash
# Run ESLint to check for issues
npm run lint

# Run ESLint and automatically fix issues
npm run lint:fix

# Format all files with Prettier
npm run format

# Check if files are properly formatted
npm run format:check
```

## VS Code Integration

The project includes VS Code settings (`.vscode/settings.json`) that:
- Format files on save using Prettier
- Run ESLint fixes on save
- Validate TypeScript and React files

## Current Status

✅ **Implemented Features:**
- ESLint configuration with TypeScript and React support
- Prettier configuration for consistent formatting
- Automatic formatting on save (VS Code)
- Pre-commit linting integration ready
- All formatting issues resolved
- 71 warnings identified (mostly `any` types that need proper typing)

⚠️ **Warnings to Address:**
- Replace `any` types with proper TypeScript interfaces
- Fix React Hook dependency arrays
- Resolve unused variables
- Address React Fast Refresh warnings

## File Structure

```
Frontend/
├── .eslintrc.cjs          # ESLint configuration
├── .eslintignore          # Files to ignore during linting
├── .prettierrc            # Prettier configuration
├── .prettierignore        # Files to ignore during formatting
├── .vscode/
│   └── settings.json      # VS Code editor settings
└── LINTING.md            # This documentation
```

## Best Practices

1. **Before committing**: Run `npm run lint` and `npm run format`
2. **Fix warnings gradually**: Address TypeScript `any` types over time
3. **Use proper types**: Create interfaces instead of using `any`
4. **Follow React patterns**: Use proper dependency arrays in hooks
5. **Keep it clean**: Remove unused imports and variables

## Integration with CI/CD

The linting setup is ready for integration with CI/CD pipelines:

```yaml
# Example GitHub Actions step
- name: Lint and Format Check
  run: |
    npm run lint
    npm run format:check
```

## Troubleshooting

### Common Issues

1. **ESLint errors**: Run `npm run lint:fix` to auto-fix issues
2. **Formatting issues**: Run `npm run format` to format all files
3. **VS Code not formatting**: Ensure Prettier extension is installed
4. **TypeScript errors**: Check `tsconfig.json` and install missing types

### Performance

- ESLint processes ~60 files in ~2-3 seconds
- Prettier formats all files in ~1-2 seconds
- Both tools are optimized for the project structure

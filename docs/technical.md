# Task List Kanban - Technical Documentation

## Development Environment

### Prerequisites
- Node.js (Latest LTS version recommended)
- npm (Comes with Node.js)
- Git for version control
- A code editor (VS Code recommended)
- Obsidian for testing

### Project Setup
1. Clone the repository
2. Run `npm install` to install dependencies
3. Run `npm run dev` for development
4. Run `npm run build` for production build

## Technology Stack

### Core Technologies
- **TypeScript** - Primary programming language
- **Svelte** - UI framework
- **Obsidian API** - Plugin integration
- **Vite** - Build tool and development server
- **esbuild** - JavaScript bundler

### Key Dependencies
```json
{
  "dependencies": {
    "obsidian": "latest",
    "svelte": "^4.x.x",
    "typescript": "^5.x.x"
  },
  "devDependencies": {
    "vite": "^5.x.x",
    "esbuild": "^0.x.x"
  }
}
```

## Project Structure
```
task-list-kanban/
├── src/               # Source code
├── docs/             # Documentation
├── .cursor/          # Cursor IDE settings
├── node_modules/     # Dependencies
├── manifest.json     # Plugin manifest
├── package.json      # Project configuration
├── tsconfig.json     # TypeScript configuration
└── vite.config.ts    # Vite configuration
```

## Design Patterns

### Component Architecture
- Modular Svelte components
- State management through stores
- Event-driven updates
- Reactive UI patterns

### Plugin Integration
- Obsidian Plugin API usage
- File system integration
- Settings management
- View registration

## Development Workflow

### Local Development
1. Start development server: `npm run dev`
2. Make changes in `src/` directory
3. Test in Obsidian dev environment
4. Build for production: `npm run build`

### Testing
- Unit tests with Jest
- Integration testing in Obsidian
- Manual UI testing
- Performance profiling

### Code Style
- ESLint for linting
- Prettier for formatting
- TypeScript strict mode
- Conventional commits

## Build Process

### Development Build
```bash
npm run dev
```
- Watches for changes
- Hot module replacement
- Source maps enabled
- Development optimizations

### Production Build
```bash
npm run build
```
- Minification enabled
- Tree shaking
- Optimized bundles
- Production optimizations

## Deployment

### Release Process
1. Update version in manifest.json
2. Run build process
3. Create GitHub release
4. Publish to Obsidian community

### Version Control
- Git for source control
- GitHub for hosting
- Semantic versioning
- Release tags

## Performance Considerations

### Optimization Strategies
1. Lazy loading components
2. Efficient DOM updates
3. Debounced operations
4. Cached computations



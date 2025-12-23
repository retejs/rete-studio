Rete Studio
====
[![Discord](https://img.shields.io/discord/1081223198055604244?color=%237289da&label=Discord)](https://discord.gg/cxSFkPZdsV)

**Rete.js application**

## Introduction

Rete Studio is a general-purpose code generation tool powered by Rete.js. Its primary goal is to seamlessly bridge the gap between textual and visual programming languages. With Rete Studio, you can transform a textual programming language into a visual representation, which can then be transformed back into textual language.

![codegen](https://raw.githubusercontent.com/retejs/rete-studio/main/assets/codegen.png)

## Key features

- **Core**: basic interfaces and methods for graph transformation
- **Languages**: transformation of specific programming languages into graphs and vice versa
  - JavaScript (full support)
  - Template (minimal example)
  - DSL (custom domain-specific language example)
- **UI**: components for visualizing the node editor and code editor
- **Demo**: application featuring Playground (shown on the screenshot)

## Roadmap

Currently, JavaScript is the only fully supported language. Considering the complexity of the transformation process, our current priority is building [a robust application](https://studio.retejs.org/). Once we have fine-tuned our methodologies and algorithms (including different programming languages), we will introduce them as a published plugin for Rete.js.

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or pnpm

### Initial Setup

Choose the appropriate setup script for your operating system:

#### Linux / macOS
```bash
bash ./setup.sh
```

#### Windows (PowerShell)
```powershell
.\setup.ps1
```

This will:
1. Install dependencies in all packages
2. Build all packages (core, languages, ui)
3. Create package tarballs
4. Set up the demo application

### Running the Demo

```bash
cd demo
npm run dev
```

The demo will be available at `http://localhost:5173` (or the next available port).

---

## 🔧 Development

### Package Structure

```
rete-studio/
├── core/                    # rete-studio-core
├── languages/
│   ├── javascript/         # rete-studio-javascript-lang
│   ├── template/           # rete-studio-template-lang
│   └── dsl/               # rete-studio-dsl-lang
├── ui/                     # rete-studio-ui
└── demo/                   # Demo application
```

### Quick Updates During Development

When you make changes to package source code, use the update scripts to rebuild and sync to the demo:

#### Linux / macOS
```bash
# Update all packages
./update-packages.sh

# Update specific packages
./update-packages.sh --languages
./update-packages.sh --core
./update-packages.sh --ui

# Combine options
./update-packages.sh --core --languages
```

#### Windows (PowerShell)
```powershell
# Update all packages
.\update-packages.ps1

# Update specific packages
.\update-packages.ps1 -Languages
.\update-packages.ps1 -Core
.\update-packages.ps1 -UI

# Combine options
.\update-packages.ps1 -Core -Languages
```

### Update Script Options

| Option | Description |
|--------|-------------|
| `--all` / `-All` | Update all packages (default) |
| `--core` / `-Core` | Update core package only |
| `--languages` / `-Languages` | Update language packages (javascript, template, dsl) |
| `--ui` / `-UI` | Update UI package only |
| `--help` / `-Help` | Show help message |

### Development Workflow

```bash
# 1. Make changes to source code
vim languages/dsl/src/code-plugin.ts

# 2. Update the package in demo
./update-packages.sh --languages

# 3. Test in demo (with cache clearing)
cd demo
npm run dev -- --force

# 4. Make more changes and repeat
```

### Alternative: Watch Mode with rete-kit

For continuous development with automatic rebuilding:

```bash
npx rete-kit build -f core,ui,languages/template,languages/javascript,languages/dsl,demo
```

This will continuously build and synchronize dependencies. Don't forget to restart your application with [clearing the cache](https://vitejs.dev/guide/dep-pre-bundling.html#file-system-cache):

```bash
npm run dev -- --force
```

---

## 📜 Scripts Reference

### Setup Scripts

**Purpose:** Initial setup from scratch (installs dependencies + builds everything)

**When to use:**
- First time setting up the repository
- After cloning the repository
- When you need to reinstall all dependencies
- After adding/removing dependencies in package.json

| OS | Command |
|----|---------|
| Linux/macOS | `./setup.sh` |
| Windows | `.\setup.ps1` |

### Update Scripts

**Purpose:** Quick package updates without reinstalling dependencies

**When to use:**
- You made changes to source code
- You want to test changes in the demo quickly
- Dependencies haven't changed

| OS | Command | Options |
|----|---------|---------|
| Linux/macOS | `./update-packages.sh` | `--all`, `--core`, `--languages`, `--ui` |
| Windows | `.\update-packages.ps1` | `-All`, `-Core`, `-Languages`, `-UI` |

**What it does:**
1. Runs `npm run build` in specified packages
2. Runs `npm pack` to create tarballs
3. Reinstalls packages in demo to pick up changes

---

## 🐛 Troubleshooting

### "npm ERR! code ENOENT" when running update script

**Solution:** Run the setup script first to install dependencies

### Demo not picking up changes

**Solution:**
1. Check if the build succeeded in the package directory
2. Verify the `.tgz` file has a recent timestamp
3. Try `npm run dev -- --force` in demo to clear cache and restart

### Build fails with TypeScript errors

**Solution:**
1. Make sure `rete-studio-core` is up to date if you're building languages/ui
2. Run update script with `--core --languages` to update core first

### Windows PowerShell Execution Policy Error

If you get an error about execution policy when running `.ps1` scripts:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 🎯 Examples

### Example 1: Working on DSL Language

```bash
# Make changes to DSL source code
vim languages/dsl/src/transformers/tree-flow.ts

# Update only language packages
./update-packages.sh --languages

# Test in demo
cd demo
npm run dev
```

### Example 2: Updating Core and Dependent Packages

```bash
# Make changes to core
vim core/src/core/index.ts

# Update core and all packages that depend on it
./update-packages.sh --all

# Test in demo
cd demo
npm run dev -- --force
```

### Example 3: Quick UI Changes

```bash
# Make UI changes
vim ui/src/Playground.tsx

# Update only UI
./update-packages.sh --ui

# Test
cd demo
npm run dev
```

---

## 📦 Package Details

### Core Package
Location: `core/`
- Provides base interfaces and methods for graph transformation
- Used by all language packages

### Language Packages
Location: `languages/*/`

- **JavaScript** (`languages/javascript/`): Full-featured JavaScript ↔ Graph transformation
- **Template** (`languages/template/`): Minimal template for creating new language plugins
- **DSL** (`languages/dsl/`): Example custom domain-specific language
  - Uses ANTLR4 for parsing
  - Supports: variables, expressions, if statements, blocks

### UI Package
Location: `ui/`
- React components for the visual editor
- Code editor integration
- Playground interface

### Demo Application
Location: `demo/`
- Full-featured demo application
- Includes all language plugins
- Hot module replacement for development

---

## 🔗 Adding a New Language

To add a new language plugin:

1. Create a new directory in `languages/`
2. Use `languages/template/` as a starting point
3. Implement the required interfaces from `rete-studio-core`
4. Add the language to `setup.sh` and `update-packages.sh`
5. Add the language worker to `demo/src/workers/`
6. Update `demo/src/languages.ts`

For detailed examples, refer to:
- Simple: `languages/template/`
- Complex with ANTLR4: `languages/dsl/`
- Full-featured: `languages/javascript/`

---

## 🤝 Contribution

Please refer to the [Contribution](https://retejs.org/docs/contribution) guide

---

## 📄 License

[CC BY-NC-SA 4.0](https://github.com/retejs/rete-studio/blob/main/LICENSE)

---
name: context7-project-setup
description: "Comprehensive project scaffolding using context7 MCP tools. Use when creating new complete projects from scratch — TypeScript, React, Node.js, Next.js, Vite, MCP servers, VS Code extensions, etc. NOT for individual files or modifications to existing code."
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Context7 Project Setup Skill

Full project initialization and scaffolding using context7 MCP tools to fetch latest library documentation, APIs, and best practices.

## When to Use

- Creating a new complete project from scratch
- Setting up entire project frameworks (TypeScript, React, Node.js, etc.)
- Initializing MCP servers with full structure
- Creating VS Code extensions with proper scaffolding
- Setting up Next.js, Vite, or other framework-based projects
- User asks for "new project", "create a workspace", or "set up a [framework] project"
- Establishing a complete development environment with dependencies, config files, and folder structure

## When NOT to Use

- Creating single files or small code snippets
- Adding individual files to existing projects
- Making modifications to existing codebases
- User asks to "create a file" or "add a component"
- Simple code examples or demonstrations
- Debugging or fixing existing code

## Workflow

1. **Resolve library**: Call `mcp_context7_resolve-library-id` with project requirements to find the right library/framework
2. **Fetch docs**: Call `mcp_context7_get-library-docs` to get up-to-date scaffolding instructions
3. **Scaffold project**: Only set up a project if the folder is empty or if you've just created a workspace
4. **Configure**: Set up package.json, tsconfig, eslint, and other config files
5. **Install**: Install dependencies
6. **Boilerplate**: Create initial boilerplate code
7. **Verify**: Run build/lint to confirm everything works

## Capabilities

- Folder structure creation
- package.json and dependency management
- Configuration files (tsconfig, eslint, prettier, etc.)
- Initial boilerplate code
- Development environment setup
- Build and run instructions

## Target Processes

- project-scaffolding
- framework-setup
- dev-environment-onboarding
- react-app-development
- nextjs-fullstack-app
- vite-build-configuration

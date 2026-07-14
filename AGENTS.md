# Running commands that use Node.js

1. Execute `nvm.sh` first if necessary to get the `nvm` command. Example: `export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh";`
2. Run `nvm use` to switch to the correct Node.js installation.

# Running `openspec` Command

`openspec` uses Node.js. So, follow `Running commands that use Node.js` section first. Use `nvm` to switch to correct Node.js. Then run `openspec` command.

# Verification

ESLint and Prettier are run automatically when Git committing. So, no need to run them on each changes.

# Clean Code Architecture Layers (`// CCA: <n>` tags)

Source files under `src/` start with a `// CCA: <n>` comment declaring their Clean Code Architecture (CCA) layer:

1. **Entities** — pure domain models, business logic, and value-level policy facts (which values exist, which is the default), with no dependency on anything outside this layer..
2. **Use Cases** — application-specific orchestration: what the app does with the entities, expressed independently of any UI or storage technology.
3. **Interface Adapters** — translation between the app's inner world and external systems or formats.
4. **Frameworks & Drivers** — the outermost ring: UI framework, storage engine, external services, and the glue that wires them in.

**CCA Dependency Rule:** a file may only depend on files with an equal or lower CCA number — usually the `import`/`require` points inward. Apply this when writing or reviewing any dependency (`import`/`require`).

Rules of thumb:

- Tag only files that participate in the architecture — files that production code depends on. Files that production code does not depend on (test files, config files, type declarations) need no tag: there is no boundary to protect, since the dependency rule constrains dependants (usually importers) and nothing depends on them. Tests may depend on any layer.
- Tag the file's first line. If impossible, tag the first possible line.
- Enforcement is by convention and review (no lint rule yet).

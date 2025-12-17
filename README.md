# Rspack Minification Bug Reproduction

- [Rspack website](https://rspack.dev/)
- [Rspack repo](https://github.com/web-infra-dev/rspack)

When combining these patterns in a class constructor:
1. Destructuring with rest spread (`let { content, ...other } = options`)
2. Reassigning a destructured variable (`content = content || createContent()`)
3. Using spread in `super()` call (`super({ content, ...other })`)

The minifier may incorrectly optimize the code, causing `content` to be `undefined` when passed to the parent class.

## Minified JS

**Original source:**
```javascript
let { content, context, delimiter, reveal, ...other } = options;
content = content || createContent(context);      // Step 1: assign content
reveal = Promise.all([reveal, content.revealed]); // Step 2: use content
super({ content, context, reveal, ...other });    // Step 3: pass content to super
```

**Minified output (incorrect):**
```javascript
let{content:t,context:o,delimiter:s,reveal:r,...c}=e;
super({content:t,context:o,reveal:r=Promise.all([r,(t=t||n(o)).revealed]),...c})
```

The minifier collapses the reassignments into the `super()` call, but places `content:t` **before** the assignment `(t=t||n(o))`. Object properties are evaluated left-to-right, so `content:t` gets the original `undefined` value, then `t` is reassigned inside `Promise.all()` - too late.

## Related Issues

- https://github.com/jupyterlab/jupyterlab/issues/18227
- https://github.com/web-infra-dev/rspack/issues/12492

## Reproduction Steps

```bash
pnpm install

# Build with minification (triggers the bug in rspack, works in webpack)
pnpm run build:rspack
pnpm run test:rspack

pnpm run build:webpack
pnpm run test:webpack

# Build without minification (works correctly in both)
pnpm run build:rspack:no-minimize
pnpm run test:rspack

pnpm run build:webpack:no-minimize
pnpm run test:webpack
```

## Expected Output

**Rspack with minification (`pnpm run build:rspack && pnpm run test:rspack`):**
```
Testing CSVDocumentWidget...
✗ CSVDocumentWidget FAILED: Cannot read properties of undefined (reading 'node')

Testing CSVDocumentWidgetFixed...
setAttribute called: role=region
✓ CSVDocumentWidgetFixed created successfully
```

**Webpack with minification (`pnpm run build:webpack && pnpm run test:webpack`):**
```
Testing CSVDocumentWidget...
setAttribute called: role=region
✓ CSVDocumentWidget created successfully

Testing CSVDocumentWidgetFixed...
setAttribute called: role=region
✓ CSVDocumentWidgetFixed created successfully
```

**Without minification (both work correctly):**
```
Testing CSVDocumentWidget...
setAttribute called: role=region
✓ CSVDocumentWidget created successfully

Testing CSVDocumentWidgetFixed...
setAttribute called: role=region
✓ CSVDocumentWidgetFixed created successfully
```

`./webpack-dist` and `./rspack-dist` are purposely not added to `.gitignore`.

It is recommended to commit these files so we quickly compare the outputs.

## Environment

- rspack: ^1.6.0
- webpack: ^5.102.1
- Node.js: 24

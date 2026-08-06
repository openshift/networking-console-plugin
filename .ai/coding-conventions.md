---
description: Coding standards and best practices for this project
globs: ['src/**/*.{ts,tsx,scss}', 'cypress/**/*.{ts,tsx}', '**/*.test.{ts,tsx}']
---

# Coding Standards

These are the coding standards for the networking-console-plugin project. They apply to source code, tests, and styles
(see globs). All code contributions should follow these guidelines.

---

## General Goals

- Aim for **maintainable, scalable, and readable code** while maintaining consistency.
- Encourage contributions and ideas for continuous improvement.

---

## 1. File Conventions

### SDK Imports

- Console SDK: `@openshift-console/dynamic-plugin-sdk` — hooks (`useK8sWatchResource`, `useActiveNamespace`), CRUD
  functions, and UI primitives
- SDK internals: `@openshift-console/dynamic-plugin-sdk-internal` — telemetry (`getSegmentAnalytics`)
- KubeVirt API: `@kubevirt-ui/kubevirt-api/console` — `modelToGroupVersionKind`, `modelToRef`, and Kubernetes type
  definitions

### File Extensions

- **Components**: `.tsx` for all React components
- **Logic/Utilities**: `.ts` for non-component files (hooks, utils, types, constants)
- **Styles**: `.scss` for component styles
- **Tests**: `.test.ts` or `.test.tsx` for unit tests

### File Naming

- **Component files**: PascalCase matching component name (`VMDetailsPage.tsx`)
- **Non-component files**: camelCase (`vmUtils.ts`, `useVMData.ts`)
- **SCSS files**: PascalCase matching component (`VMDetailsPage.scss`)
- **Type files**: camelCase (`types.ts`, `vmTypes.ts`)
- **Constant files**: camelCase (`constants.ts`)

### Folder Naming

- Directories containing components or hooks that aren't located in `src/views` should use PascalCase and be the name of
  the parent component or hook within that directory. The exception to this rule are directories that hold unrelated
  components or hooks. Those directories should be kebab-case.
- Examples: `src/utils/components/ActionDropdownItem`, `src/utils/hooks/useProjects`

- Directories under `src/views` or not containing components or hooks should be kebab-case.
- Example: `src/views/network-policies/`
-

### One Component Per File (Strictly Enforced)

- Each `.tsx` file exports **at most one React component**
- The exported component name **must match** the filename: `MyWidget.tsx` exports `MyWidget`
- **No nested component definitions** inside other components (causes remounting on every render)
- Extract subcomponents into a `components/` subdirectory
- Extract helper functions into a `utils/utils.ts` file in that component's directory
- Extract constants into a `utils/constants.ts` file in that component's directory
- Extract types other than the props type for the component into a `utils/types.ts` file in that component's directory

```
// WRONG: two exported components in one file
// VMCard.tsx
export const NetworksCard: FC = () => { ... };
export const NetworksCardHeader: FC = () => { ... };  // extract to components/VMCardHeader.tsx

// WRONG: nested component definition
const ParentComponent: FC = () => {
  const ChildComponent: FC = () => <div />;  // recreated every render
  return <ChildComponent />;
};

// CORRECT: one component, filename matches
// NetworksCard.tsx
const NetworksCard: FC = () => { ... };
export default NetworksCard;
```

---

## 2. Component Structure

### Folder Organization

```
/components/MyComponent/
├── MyComponent.tsx           # Main component
├── MyComponent.scss          # Styles
├── components/               # Sub-components
├── hooks/                    # Component-specific hooks
├── utils/                    # Component-specific utilities
└── types/                    # Component-specific types
```

### Component Rules

- One exported component per file (see "One Component Per File" above)
- No nested component definitions inside other components
- Filename must match the exported component name
- Use functional components exclusively
- Class components only for error boundaries (`componentDidCatch`)
- Default export for components, named exports for utils/hooks/types
- Use explicit imports for React and lodash

---

## 3. React Patterns

### Component Function Order

1. Imports (external, then internal, then styles)
2. Type definitions (props, local types)
3. Component function
4. Default export

### Inside Component Order

1. Translation hook (`useNetworkingTranslation`)
2. Router hooks (`useParams`, `useNavigate`)
3. Data fetching hooks (`useK8sWatchResource`)
4. Local state (`useState`)
5. Derived values (`useMemo`)
6. Callbacks (`useCallback`)
7. Effects (`useEffect`)
8. Early returns (loading, error, empty states)
9. Main JSX return

### Hooks Best Practices

- Always specify dependencies in `useEffect`
- Empty array `[]` for mount-only effects
- Hooks contain logic only, never return JSX
- Extract complex logic to custom hooks
- Follow the `use` prefix convention
- Follow the `type <hook name in PascalCase> = (<argument types>) => <return types>` convention for the hook type
- The type should come before the hook

### Memoization

- Use `memo` for components with stable props but re-rendering parents
- Use `useMemo` for expensive calculations
- Use `useCallback` for callbacks passed to memoized children
- Don't over-memoize simple operations
- Lazy load components with `lazy` and `Suspense`

### Logic Separation

- Extract logic from components into custom hooks or utility files
- Avoid bloated components by delegating logic to external modules

---

## 4. TypeScript Standards

### Type vs Interface

- Prefer `type` over `interface` for object shapes
- Use `interface` only when extending is needed

### Type Safety

- **Never use `any`** -- use `unknown` and narrow with type guards
- Always define explicit return types on functions
- Use optional chaining (`?.`) for nullable access
- Provide fallback values with nullish coalescing (`??`)

### Naming Conventions

- Types: PascalCase (`NetworkPolicyActionsProps`, `IngressProps`)
- Constants: UPPER_SNAKE_CASE (`DEFAULT_NAMESPACE`, `MAX_RETRIES`)
- Functions/variables: camelCase (`getNetworkStatus`, `networkList`)
- Components: PascalCase (`NetworkPoliciesDetailsPage`)
- Use descriptive names over abbreviations
- If an acronym is used capitalize all letters in the acronym (`getVMStatus`, `getIPAddresses`)

### Type Organization

- Component-specific types: in component's `utils/types.ts` file
- Shared types: in `src/utils/types.ts`
- Use existing types from `@kubevirt-ui/kubevirt-api`

### Avoid Magic Numbers

- Component-specific constants: in component's `utils/constants.ts` file
- Shared constants: in relevant file in the `src/utils/types` directory. Create a new directory if no existing one has a
  relevant name.
- Include units in name: `POLL_INTERVAL_MS`, `MAX_RETRIES`

---

## 5. Styling Guidelines

### PatternFly components

- Rely on default styles of PatternFly components
- Use PatternFly components for layouts (Flex, Stack, Grid, Split, ...)
- Use PatternFly utility classes

### SCSS Usage

- Use SCSS when PatternFly components and utility classes are not sufficient
- Use SCSS for styling (nesting, variables, mixins)
- One SCSS file per component
- Filename matches component: `ActionsDropdown.tsx` -> `ActionsDropdown.scss`
- Extract into separate files, don't embed styles in components

### BEM Methodology

- **Block**: Component name (`.actions-dropdown`)
- **Element**: Child parts (`&__header`, `&__content`)
- **Modifier**: Variations (`&--loading`, `&--compact`)

### PatternFly Integration

- Use PatternFly variables for spacing, colors, typography
- Don't target PatternFly class names directly in selectors
- Add project-specific class names as anchors
- Classes change between PF versions

### Rules

- No `!important` unless absolutely necessary
- Use relative units (rem, %, em) over absolute (px)
- Use CSS variables for theming support

---

## 6. Code Quality

### Comments

- Avoid comments when possible; write self-documenting code
- Use comments for non-obvious decisions
- Include links to issues for workarounds

### Global/Store State

- Keep global state minimal and straightforward
- Use React Context or Zustand for truly global state

### Avoid Circular Dependencies

- Use index files cautiously
- Check import chains between files

### Error Handling

- Never swallow errors silently
- Always provide meaningful error messages
- Handle loading, success, and error states
- Clean up on component unmount

---

## 7. Testing

### Requirements

- New features must have tests
- Bug fixes should include regression tests
- Aim for behavior testing over implementation testing

### Tools

- Jest for unit tests
- Cypress for E2E tests
- Use `data-test` attributes for selectors

---

## 8. Code Reviews and Version Control

### Commits

- Meaningful commit messages
- Small, focused commits -- can be squashed on merge
- Don't commit broken code

### Pull Requests

- Small, dedicated PRs over large ones
- Include description, JIRA link, screenshots/video
- Self-review before requesting review
- No merge without peer review

### PR Subject Line Formatting

`[release-<release version>] <Jira issue ID, Jira issue ID>: <CVE IDs> <Summary>`

- Only add the release version tag if targeting a branch other than main
- Omit the Jira issue ID and CVE ID fields if there are no Jira and/or CVE issues associated with the PR
- If there are more than three Jira issues associated with the PR, add the first in the summary and ensure all the
  associated Jira issues are linked in the PR description
- If there are more than two CVE issues associated with the PR, add the first in the summary and ensure all the
  associated Jira issues are linked in the PR description

### PR Description Template

```markdown
## Description

> Add a brief description

## Links

> Add JIRA, Docs, and other PR/Issue links

## Demo

> Please add a video or an image of the behavior/changes, preferably before and after
```

---

## 9. Linting & Formatting

### Tools

- ESLint with React and TypeScript plugins
- Prettier for formatting
- lint-staged for staged file checking

### Commands

```bash
npm run lint          # Check for issues
npm run lint:fix      # Auto-fix issues
```

---

## 11. Code Quality Review Checklist

Before completing any code generation or review, verify **all** of the following:

### File Structure

- [ ] One exported React component per file
- [ ] Component name matches filename
- [ ] No nested component definitions
- [ ] Subcomponents extracted to `components/` subdirectory
- [ ] Helper functions extracted to `utils/utils.ts` file
- [ ] Constants extracted to `utils/constants.ts` file
- [ ] Single-use hooks stay co-located with their component, not in shared `utils/hooks/`
- [ ] Types other than the component props type or hooks type are extracted to `utils/types.ts` file
- [ ] SCSS file named in PascalCase matching the component name

### Code Quality

- [ ] Import order follows `simple-import-sort` groups (run `npm run lint`)
- [ ] Check for existing similar components and utilities before creating new ones
- [ ] Reuse hooks from `src/utils/hooks/` and components from `src/utils/components/`
- [ ] Match patterns of neighboring files in the same directory
- [ ] No `any` types -- use `unknown` and narrow
- [ ] Run `npm run check-types` after changes
- [ ] Path aliases (`@utils/`, `@views/`, `@styles/`) used instead of deep relative imports

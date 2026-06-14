# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

---

# Primary Objective

Optimize for:

- reliable implementation
- minimal regressions
- consistency with existing architecture
- fast iteration
- maintainable code

Do not optimize for:

- cleverness
- excessive abstraction
- unnecessary rewrites
- framework hype
- overengineering

---

# Engineering Philosophy

Prioritize:

1. simplicity
2. readability
3. maintainability
4. consistency
5. performance

Avoid:

- unnecessary abstractions
- over-componentization
- speculative architecture
- deeply nested state
- magic behavior
- unnecessary dependencies
- premature optimization

---

# Execution Rules

- Prefer editing existing files over creating new files
- Never create abstractions unless repetition appears 3+ times
- Preserve existing architecture and naming conventions
- Keep changes minimal and localized
- Do not modify unrelated files
- Do not rewrite working code unnecessarily
- Inspect existing patterns before implementing new ones
- Follow repository conventions over generic best practices
- Avoid introducing global state unless explicitly required
- Do not introduce Redux/Zustand/context unless requested
- Reuse existing utilities/components before creating new ones
- Prefer composition over complex inheritance patterns
- Avoid placeholder implementations
- Do not leave TODO comments unless explicitly requested
- Avoid fake/mock implementations in production code
- Preserve backward compatibility when possible

---

# Before Implementing

Claude must:

1. inspect related files
2. identify existing patterns
3. preserve architectural consistency
4. avoid duplicate logic
5. minimize scope of edits
6. verify imports and dependencies
7. check how similar problems are solved elsewhere in the repo

---

# Verification Rules

- Do not assume framework APIs from training data
- Verify patterns against the existing codebase
- Follow current repository conventions over generic best practices
- Inspect nearby implementations before creating new patterns
- Verify package usage before introducing new APIs
- Respect current Next.js version behavior
- Check for existing utilities before adding dependencies

---

# Response Rules

When making changes:

- explain what changed
- explain why
- mention affected files
- keep explanations concise
- avoid repeating obvious information

When uncertain:

- state uncertainty clearly
- inspect more files before proceeding
- avoid hallucinating APIs or package behavior

---

# Dependency Rules

- Do not add dependencies unless necessary
- Prefer built-in browser, React, or Next.js APIs first
- Explain why a new dependency is required before using it
- Avoid large UI/component libraries
- Avoid dependencies for trivial utilities
- Prefer existing repo tooling over introducing alternatives

---

# UI Rules

- Preserve existing design language
- Maintain dark-theme-first styling
- Use existing Tailwind utility patterns before introducing new ones
- Preserve responsiveness across screen sizes
- Reuse existing animation patterns and timing
- Avoid inline styles unless unavoidable
- Prefer clean component composition over deeply nested JSX
- Maintain visual consistency with existing dashboard components
- Use lucide-react icons consistently
- Respect existing spacing, radius, and motion patterns

---

# Animation Rules

- Preserve Framer Motion patterns already used in the repo
- Avoid excessive animation complexity
- Prefer subtle and performant transitions
- Do not break existing animation timing consistency
- Keep animations GPU-friendly when possible

---

# AI Route Rules

- Preserve streaming behavior using ReadableStream
- Never replace streaming responses with blocking JSON responses
- Maintain provider fallback logic
- Keep `export const dynamic = "force-dynamic"` on AI routes
- Do not expose API keys to client components
- Validate provider-specific model routing logic
- Avoid large synchronous operations in API handlers
- Preserve streaming UX and incremental rendering behavior
- Keep server-only libraries out of client bundles

---

# File Safety Rules

Exercise extra caution when modifying:

- `src/app/globals.css`
- `src/components/ui/radial-timeline.jsx`
- `src/components/dashboard/main.jsx`
- `src/components/dashboard/sidebar.jsx`

Before modifying these files:

1. understand existing behavior
2. preserve responsiveness
3. preserve animations
4. avoid breaking layout structure
5. avoid unnecessary refactors

---

# State Management Rules

- Prefer local state first
- Lift state only when necessary
- Avoid deeply nested prop chains when composition solves the issue
- Do not introduce global state without strong justification
- Preserve existing localStorage session behavior

---

# Performance Rules

- Avoid unnecessary re-renders
- Avoid unnecessary useEffect usage
- Prefer memoization only when profiling justifies it
- Keep client bundles lean
- Dynamically import heavy server-only libraries when appropriate
- Avoid blocking rendering paths

---

# Error Handling Rules

- Fail gracefully
- Preserve existing error handling patterns
- Avoid silent failures
- Return actionable error messages
- Do not swallow exceptions without reason
- Maintain streaming stability during provider failures

---

# Architecture

Next.js 16.2.4 App Router with React 19.2.4.

All components currently use `"use client"` directives.

Follow existing architecture unless explicitly instructed otherwise.

---

# Commands

```bash
npm run dev          # Start dev server with CSS watch
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run build:css    # Compile Tailwind CSS
```

# Product

## Register

product

## Users

Git-Ingest is for developers and AI-assisted builders who need to turn a local codebase into clean, portable context for LLM workflows. They are usually in a focused desktop work session, deciding which project files are safe and useful to include before copying or exporting generated output.

## Product Purpose

Git-Ingest scans a selected local project, applies simple rules, previews the resulting context bundle, generates AI-readable markdown or text, and helps the user copy or export it. Success means the user can trust what will be included, generate without second-guessing, and export the result quickly without exposing local filesystem access to the renderer.

## Brand Personality

Precise, native, trustworthy. The product should feel like a quiet macOS developer utility rather than a SaaS dashboard or marketing surface.

## Anti-references

Avoid Windows-first UI conventions, oversized dashboard cards, decorative gradients, fake command surfaces, dark terminal cosplay, and disabled controls that make the workflow endpoint feel missing. Avoid making file inspection more important than the generate/export task.

## Design Principles

- Make the workflow visible: Project, Rules, Preview, Generate, Export should always be understandable.
- Keep primary action ownership clear: Generate is the dominant action until output exists, then export actions become dominant.
- Use progressive disclosure for inspection details: summary first, full file lists and diagnostics only when useful.
- Earn macOS trust through restraint, density, native spacing, and predictable controls.
- Surface local safety as reassurance, not as a competing product feature.

## Accessibility & Inclusion

Target WCAG AA contrast for visible text and controls. Do not rely on color alone for status. Keep keyboard focus order aligned with the workflow, provide labels for icon controls, and respect reduced-motion preferences.

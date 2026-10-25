# TypeScript strict across the whole repo

Swayam confirmed on 24 Oct that JavaScript or TypeScript is acceptable for this project. We default to TypeScript. A lane may drop to JavaScript for a throwaway script, but anything that imports from `packages/shared` stays TypeScript.

The baseline prompt says plain JavaScript. We use TypeScript in strict mode instead. Two developers will build in parallel against shared types (queue state, hospital graph, i18n keys), and the compiler is the cheapest way to catch a broken contract between lanes. It also matches the team lead's standing preference.

## Consequences

- Prompts given to AI tools must say "TypeScript strict, no `any`".
- Shared types in `packages/shared` are the contract between lanes. Changing one needs the `contract` label (see `docs/git-workflow.md`).
- A slightly slower first render of each screen is accepted in exchange for fewer integration bugs on day two.

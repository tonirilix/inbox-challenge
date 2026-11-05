# Item types are typed code modules, not schema-driven

Each item type is a schema in the shared contracts, an executor on the API and a detail and action form on the web, all registered in typed maps so a missing piece fails to compile. Every item shares a common envelope, so the list, views, filters and counts work for any type without type-specific code, and an unknown type renders a generic fallback.

## Considered Options

A schema-driven UI, where item types are data and the frontend renders generic forms from a fixed field vocabulary, would let types be configured at runtime. It was rejected because it drifts into building a form builder, which is far beyond this project; the envelope keeps adding a type to three small, local changes, and configuration can be revisited later.

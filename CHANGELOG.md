# @zazuko/cube-hierarchy-query

## 3.0.0

### Major Changes

- a961078: Updated `@hydrofoil/shape-to-query` to 0.13. This introduces optimisations which should not be a breaking change but because `sparql-http-client` was also updated to v3, the return type of `getHierarchy` changed slightly where `query` is now `string`

## 2.2.2

### Patch Changes

- 887a95c: Improve performance of queries by using subselects (updates `@hydrofoil/shape-to-query` to `v0.10`) (closes #34, closes #21)

## 2.2.1

### Patch Changes

- cbeead9: Large hierachies could cause `414 URI Too Long` respose
- 82265d5: Prevent `sh:targetClass` from knocking out hierarchy nodes without targets (fixes #31)

## 2.2.0

### Minor Changes

- b8fd9b7: `getHierarchy`: add options to forward to `@hydrofoil/shape-to-query`

### Patch Changes

- b8fd9b7: Update `@zazuko/env` to `1.10.1`
- b8fd9b7: Update `@hydrofoil/shape-to-query` - allows extending `PropertyShape` (see [example/hierarchy.ts](example/hierarchy.ts))

## 2.1.1

### Patch Changes

- 2ac4681: Improve performance of `getHierarchy` called with numerous properties

## 2.1.0

### Minor Changes

- 24997e4: Use `@zazuko/env` instead of `rdf-ext`
- d002da4: Add an optional argument to `getHierarchy` to list exact properties to retrieve for all levels (closes #22)

### Patch Changes

- 24997e4: Update dependencies to ESM

## 2.0.0

### Major Changes

- 573ccd8: The `query` object returned by `children` and `example` functions is now typed as `Describe` which has a slightly different signature from `Construct` which was returned previously. (note that the actual query has not changed)
- 573ccd8: The `getHierarchy` exported by the main module now generates a `CONSTRUCT` query which should yield a great improvement in performance in some cases (closes #17)

### Patch Changes

- 573ccd8: Removed dependency on `chai-snapshot-matcher` which should have been dev-only

## 1.0.2

### Patch Changes

- 6542eae: As a regeression from #12, some data was still missing when fetching entire hierarchy

## 1.0.1

### Patch Changes

- a00f28a: Roots without children were not returned by the `getHierarchy` function

## 1.0.0

### Major Changes

- 29db201: The children() method result now returns the children (still as an
  array of GraphPointer) and the parent (as a GraphPointer).

  ```patch
  - const childrenResult = await children(...)
  + const { children: childrenResult } = await children(...)
  ```

- 1d4ac7e: First version

### Minor Changes

- f946c50: Getting entire hierarchy. See example in `examples/hierarchy.ts`. Run it like

  ```
  yarn run example examples/hierarchy.ts \
    --cube https://environment.ld.admin.ch/foen/fab_Offentliche_Ausgaben_test3/7
  ```

### Patch Changes

- 6340c7f: Add `@zazuko/vocabulary-extras` as dependency
- 6340c7f: Update `@tpluscode/rdf-ns-builders` to v2
- ac1db59: Missing type declarations in package
- b180146: Improve the query for example resources. Paging is now done in a `SELECT` subquery
- b180146: Update dependencies on `@rdfjs/*` and `rdf-ext` packages to use the ESM versions

## 1.0.0-pre.2

### Major Changes

- 29db201: The children() method result now returns the children (still as an
  array of GraphPointer) and the parent (as a GraphPointer).

  ```patch
  - const childrenResult = await children(...)
  + const { children: childrenResult } = await children(...)
  ```

### Patch Changes

- 6340c7f: Add `@zazuko/vocabulary-extras` as dependency
- 6340c7f: Update `@tpluscode/rdf-ns-builders` to v2
- b180146: Improve the query for example resources. Paging is now done in a `SELECT` subquery
- b180146: Update dependencies on `@rdfjs/*` and `rdf-ext` packages to use the ESM versions

## 1.0.0-pre.1

### Patch Changes

- ac1db59: Missing type declarations in package

## 1.0.0-pre.0

### Major Changes

- 1d4ac7e: First version

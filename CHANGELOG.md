# @zazuko/cube-hierarchy-query

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

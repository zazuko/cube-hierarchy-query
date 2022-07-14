# @zazuko/cube-hierarchy-query

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

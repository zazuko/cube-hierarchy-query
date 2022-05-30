---
"@zazuko/cube-hierarchy-query": major
---

The children() method result now returns the children (still as an
array of GraphPointer) and the parent (as a GraphPointer).

```patch
- const childrenResult = await children(...)
+ const { children: childrenResult } = await children(...)
```
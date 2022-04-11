import { GraphPointer } from 'clownface'
import { DESCRIBE } from '@tpluscode/sparql-builder'
import { getHierarchyPatterns } from './lib/patterns'
import { requiredPath } from './lib/firstLevel'

export function example(hierarchyLevel: GraphPointer): string {
  const patterns = getHierarchyPatterns(hierarchyLevel, {
    firstLevel: requiredPath,
  })
  if (!patterns) {
    return ''
  }

  return DESCRIBE`?this`
    .WHERE`
      ${patterns}
      filter(isiri(?this))
    `
    .LIMIT(1)
    .build()
}

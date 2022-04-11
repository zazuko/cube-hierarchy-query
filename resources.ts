import { GraphPointer } from 'clownface'
import { Construct, DESCRIBE } from '@tpluscode/sparql-builder'
import { getHierarchyPatterns } from './lib/patterns'
import { requiredPath } from './lib/firstLevel'

export function example(hierarchyLevel: GraphPointer): Construct | null {
  const patterns = getHierarchyPatterns(hierarchyLevel, {
    firstLevel: requiredPath,
  })
  if (!patterns) {
    return null
  }

  return DESCRIBE`?this`
    .WHERE`
      ${patterns}
      filter(isiri(?this))
    `
    .LIMIT(1)
}

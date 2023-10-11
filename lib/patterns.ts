import { Term } from 'rdf-js'
import rdf from '@zazuko/env'
import type { MultiPointer } from 'clownface'
import { sparql, SparqlTemplateResult } from '@tpluscode/sparql-builder'
import { meta } from '@zazuko/vocabulary-extras-builders'
import { requiredPath } from './firstLevel.js'
import { parent } from './variable.js'

interface GetHierarchyPatterns {
  restrictTypes?: boolean
  firstLevel(subject: Term, path: MultiPointer, level: number): SparqlTemplateResult
}

export function bottomUp(hierarchyLevel: MultiPointer, { restrictTypes = true, firstLevel }: GetHierarchyPatterns): SparqlTemplateResult {
  let currentLevel = hierarchyLevel
  let roots: Term[] = []
  let patterns = sparql``
  let subject = rdf.variable('this')
  let level = 1

  // walk up meta:nextInHierarchy and collect all paths
  while (currentLevel.term) {
    roots = currentLevel.out(meta.hierarchyRoot).terms
    if (roots.length) {
      break
    }

    let nextPattern: SparqlTemplateResult
    try {
      const path = currentLevel.out(rdf.ns.sh.path)
      if (level === 1) {
        nextPattern = firstLevel(subject, path, level)
      } else {
        nextPattern = requiredPath(subject, path, level)
      }
    } catch {
      break
    }

    const targetClass = currentLevel.out(rdf.ns.sh.targetClass).term
    if (targetClass && restrictTypes) {
      nextPattern = sparql`${nextPattern}\n${subject} a ${targetClass} .`
    }

    patterns = sparql`${nextPattern}\n${patterns}`

    currentLevel = currentLevel.in(meta.nextInHierarchy)
    subject = parent(level)
    level++
  }

  if (!roots.length) {
    return null
  }

  patterns = sparql`
    VALUES ${subject} { ${roots} }
    ${patterns}
  `

  return patterns
}

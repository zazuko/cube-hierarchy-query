import { Term } from 'rdf-js'
import rdf from '@rdfjs/data-model'
import { GraphPointer, MultiPointer } from 'clownface'
import { sparql, SparqlTemplateResult } from '@tpluscode/sparql-builder'
import { sh } from '@tpluscode/rdf-ns-builders'
import { meta } from '@zazuko/vocabulary-extras/builders'
import { VALUES } from '@tpluscode/sparql-builder/expressions'
import { toSparql } from 'clownface-shacl-path'
import { isGraphPointer } from 'is-graph-pointer'
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
      const path = currentLevel.out(sh.path)
      if (level === 1) {
        nextPattern = firstLevel(subject, path, level)
      } else {
        nextPattern = requiredPath(subject, path, level)
      }
    } catch {
      break
    }

    const targetClass = currentLevel.out(sh.targetClass).term
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

export function topDown(hierarchy: GraphPointer): SparqlTemplateResult {
  const roots = hierarchy.out(meta.hierarchyRoot).terms

  let level = 1
  let patterns = sparql``
  let currentLevel = hierarchy.out(meta.nextInHierarchy)
  while (currentLevel) {
    const path = currentLevel.out(sh.path)
    if (!isGraphPointer(path)) {
      break
    }

    const subject = rdf.variable(`level${level}`)
    const nextLevelSubject = rdf.variable(`level${level + 1}`)
    const currentLevelPath = sparql`${subject} ${toSparql(path)} ${nextLevelSubject} .`

    patterns = sparql`${patterns}\n${currentLevelPath}`

    level++
    currentLevel = currentLevel.out(meta.nextInHierarchy)
  }

  return sparql`
    ${VALUES({ root: roots })}
    
    ${patterns}
  `
}

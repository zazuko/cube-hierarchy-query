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

export function topDown(hierarchy: GraphPointer): {
  described: SparqlTemplateResult
  where: SparqlTemplateResult
} {
  const rootTerms = hierarchy.out(meta.hierarchyRoot).terms
  const roots = rootTerms.map((term) => ({ root: term }))

  let level = 0
  let currentLevel = hierarchy.out(meta.nextInHierarchy)
  const levelPatterns: SparqlTemplateResult[] = []
  const levels = []

  while (currentLevel) {
    const path = currentLevel.out(sh.path)
    if (!isGraphPointer(path)) {
      break
    }

    const subject = level === 0 ? rdf.variable('root') : rdf.variable(`level${level}`)
    const nextLevelSubject = rdf.variable(`level${level + 1}`)
    let currentLevelPatterns = sparql`${subject} ${toSparql(path)} ${nextLevelSubject} .`
    if (level !== 0) {
      levels.push(subject)
    }

    const targetClass = currentLevel.out(sh.targetClass).term
    if (targetClass) {
      currentLevelPatterns = sparql`
        ${currentLevelPatterns}
        ${nextLevelSubject} a ${targetClass} .
      `
    }

    levelPatterns.push(currentLevelPatterns)

    level++
    currentLevel = currentLevel.out(meta.nextInHierarchy)
  }

  const patterns = levelPatterns.reduceRight((previous: SparqlTemplateResult | string, next) => {
    if (previous === '') {
      return next
    }

    return sparql`${next}
      OPTIONAL {
        ${previous}
      }
    `
  }, '')

  const described = sparql`${rootTerms} ${levels}`

  const where = sparql`
    ${VALUES(...roots)}
    
    ${patterns}
  `

  return {
    described,
    where,
  }
}

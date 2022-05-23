import { NamedNode, Term, DatasetCoreFactory } from 'rdf-js'
import clownface, { GraphPointer } from 'clownface'
import { Construct, DESCRIBE, SELECT } from '@tpluscode/sparql-builder'
import { sh } from '@tpluscode/rdf-ns-builders/strict'
import { toSparql } from 'clownface-shacl-path'
import { StreamClient } from 'sparql-http-client'
import fromStream from 'rdf-dataset-ext/fromStream'
import rdf from '@rdfjs/data-model'
import { getHierarchyPatterns } from './lib/patterns'
import { requiredPath } from './lib/firstLevel'

/**
 * Creates a query to find an example resource found at the given level in hierarchy
 *
 * @param {GraphPointer} hierarchyLevel it must be a pointer to the full hierarchy dataset
 */
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

interface ChildrenOptions {
  limit?: number
  offset?: number
  orderBy?: NamedNode[]
}

interface Children {
  query: Construct
  execute(client: StreamClient, rdf: DatasetCoreFactory): Promise<GraphPointer[]>
}

/**
 * Creates a query to find a set of example resources found at the given level in hierarchy
 *
 * The results can be paged, ordered and sorted
 *
 * @param {GraphPointer} level it must be a pointer to the full hierarchy dataset
 * @param {Term} parent
 */
export function children(level: GraphPointer, parent: Term, { limit = 1, offset = 0, orderBy = [] }: ChildrenOptions = {}): Children | null {
  const patterns = getHierarchyPatterns(level, {
    firstLevel: requiredPath,
  })
  if (!patterns) {
    return null
  }
  const path = level.out(sh.path)

  const selectChildTerms = SELECT.DISTINCT`?this`
    .WHERE`
      ${parent} ${toSparql(path)} ?this .
      ${patterns}

      filter(isiri(?this))`
    .LIMIT(limit)
    .OFFSET(offset)

  const orderedQuery = orderBy.reduce((query, property, index) => {
    const orderVar = rdf.variable(`order${index}`)
    return query
      .WHERE`OPTIONAL { ?this ${property} ${orderVar} }`
      .ORDER().BY(orderVar)
  }, selectChildTerms)

  const query = DESCRIBE`${parent} ?this`
    .WHERE`
      {
        ${orderedQuery}      
      }
    `

  return {
    query,
    execute: async function (client: StreamClient, $rdf: DatasetCoreFactory) {
      const stream = await query.execute(client.query)
      const dataset = await fromStream($rdf.dataset(), stream)

      const parentNode = clownface({ dataset, term: parent })

      const inversePath = path.out(sh.inversePath).term
      if (inversePath) {
        return parentNode.in(inversePath).toArray()
      }

      return parentNode.out(path.term)
        .filter(child => child.out().values.length > 0)
        .toArray()
    },
  }
}

import { NamedNode, Term, DatasetCoreFactory } from 'rdf-js'
import type { GraphPointer } from 'clownface'
import { Describe, DESCRIBE, SELECT } from '@tpluscode/sparql-builder'
import { toSparql } from 'clownface-shacl-path'
import { StreamClient } from 'sparql-http-client'
import fromStream from 'rdf-dataset-ext/fromStream.js'
import rdf from '@zazuko/env'
import { bottomUp } from './lib/patterns.js'
import { requiredPath } from './lib/firstLevel.js'

/**
 * Creates a query to find an example resource found at the given level in hierarchy
 *
 * @param {GraphPointer} hierarchyLevel it must be a pointer to the full hierarchy dataset
 */
export function example(hierarchyLevel: GraphPointer): Describe | null {
  const patterns = bottomUp(hierarchyLevel, {
    firstLevel: requiredPath,
  })
  if (!patterns) {
    return null
  }

  return DESCRIBE`?this`.WHERE`
      ${patterns}
      filter(isiri(?this))
    `.LIMIT(1)
}

interface ChildrenOptions {
  limit?: number
  offset?: number
  orderBy?: NamedNode[]
}

interface Children {
  query: Describe
  execute(
    client: StreamClient,
    rdf: DatasetCoreFactory
  ): Promise<{ children: GraphPointer[]; parent: GraphPointer }>
}

/**
 * Creates a query to find a set of example resources found at the given level in hierarchy
 *
 * The results can be paged, ordered and sorted
 *
 * @param {GraphPointer} level it must be a pointer to the full hierarchy dataset
 * @param {Term} parent
 */
export function children(
  level: GraphPointer,
  parent: Term,
  { limit = 1, offset = 0, orderBy = [] }: ChildrenOptions = {},
): Children | null {
  const patterns = bottomUp(level, {
    firstLevel: requiredPath,
  })

  if (!patterns) {
    return null
  }
  const path = level.out(rdf.ns.sh.path)

  const selectChildTerms = SELECT.DISTINCT`?this`.WHERE`
      ${parent} ${toSparql(path)} ?this .
      ${patterns}

      filter(isiri(?this))`
    .LIMIT(limit)
    .OFFSET(offset)

  const orderedQuery = orderBy.reduce((query, property, index) => {
    const orderVar = rdf.variable(`order${index}`)
    return query.WHERE`OPTIONAL { ?this ${property} ${orderVar} }`
      .ORDER()
      .BY(orderVar)
  }, selectChildTerms)

  const query = DESCRIBE`${parent} ?this`.WHERE`
      {
        ${orderedQuery}      
      }
    `

  return {
    query,
    execute: async function (client: StreamClient, $rdf: DatasetCoreFactory) {
      const stream = await query.execute(client)
      const dataset = await fromStream($rdf.dataset(), stream)

      const parentNode = rdf.clownface({ dataset, term: parent })

      const inversePath = path.out(rdf.ns.sh.inversePath).term
      if (inversePath) {
        return {
          parent: parentNode,
          children: parentNode.in(inversePath).toArray(),
        }
      }

      return {
        parent: parentNode,
        children: parentNode
          .out(path.term)
          .filter(child => child.out().values.length > 0)
          .toArray(),
      }
    },
  }
}

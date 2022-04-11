import { NamedNode, Term, DatasetCoreFactory } from 'rdf-js'
import clownface, { GraphPointer } from 'clownface'
import { Construct, DESCRIBE, sparql } from '@tpluscode/sparql-builder'
import { sh } from '@tpluscode/rdf-ns-builders/strict'
import { toSparql } from 'clownface-shacl-path'
import { StreamClient } from 'sparql-http-client'
import fromStream from 'rdf-dataset-ext/fromStream'
import { variable } from '@rdfjs/data-model'
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

interface ChildrenOptions {
  limit?: number
  offset?: number
  orderBy?: NamedNode[]
}

interface Children {
  query: Construct
  execute(client: StreamClient, rdf: DatasetCoreFactory): Promise<GraphPointer[]>
}

export function children(level: GraphPointer, parent: Term, { limit = 1, offset = 0, orderBy = [] }: ChildrenOptions = {}): Children {
  const path = level.out(sh.path)

  const targetClass = level.out(sh.targetClass).term
  let typePattern = sparql``
  if (targetClass) {
    typePattern = sparql`?this a ${targetClass} .`
  }

  const orderPatterns = orderBy.reduce((prev, property, index) => {
    return sparql`${prev}
    OPTIONAL {
      ?this ${property} ${variable(`order${index}`)}
    }`
  }, sparql``)

  let query = DESCRIBE`${parent} ?this`
    .WHERE`
      ${parent} ${toSparql(path)} ?this .
      ${typePattern}
      ${orderPatterns}

      filter(isiri(?this))
    `
    .LIMIT(limit)
    .OFFSET(offset)

  orderBy.forEach((property, index) => {
    const orderVar = variable(`order${index}`)
    query = query
      .WHERE`OPTIONAL { ?this ${property} ${orderVar} }`
      .ORDER().BY(orderVar)
  })

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

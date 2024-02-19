import { DatasetCoreFactory, NamedNode } from 'rdf-js'
import rdf from '@zazuko/env'
import type { GraphPointer } from 'clownface'
import { Construct } from '@tpluscode/sparql-builder'
import type StreamClient from 'sparql-http-client'
import fromStream from 'rdf-dataset-ext/fromStream.js'
import { meta } from '@zazuko/vocabulary-extras-builders'
import { findNodes } from 'clownface-shacl-path'
import { isGraphPointer } from 'is-graph-pointer'
import { constructQuery, Options as ShapeToQueryOptions } from '@hydrofoil/shape-to-query'
import { fromHierarchy, PropertyWithConstraints } from './lib/hierarchyShape.js'

export class HierarchyNode {
  constructor(public readonly resource: GraphPointer, private hierarchyLevel: GraphPointer) {
  }

  get nextInHierarchy(): Array<HierarchyNode> {
    const nextLevel = this.hierarchyLevel.out(meta.nextInHierarchy)
    if (!isGraphPointer(nextLevel)) {
      return []
    }

    const path = nextLevel.out(rdf.ns.sh.path)
    if (!isGraphPointer(path)) {
      throw new Error('sh:path must be single node')
    }

    return findNodes(this.resource, path)
      .map(child => new HierarchyNode(child, nextLevel))
  }
}

export interface Hierarchy {
  query: Construct
  execute(
    client: StreamClient,
    rdf: DatasetCoreFactory,
  ): Promise<Array<HierarchyNode>>
}

interface GetHierarchyOptions {
  properties?: Array<NamedNode | PropertyWithConstraints>
  shapeToQueryOptions?: ShapeToQueryOptions
}

export function getHierarchy(hierarchy: GraphPointer, { properties = [], shapeToQueryOptions }: GetHierarchyOptions = {}): Hierarchy {
  const constraints = {
    properties: properties.reduce<PropertyWithConstraints[]>((previousValue, currentValue) => {
      const next: PropertyWithConstraints = 'termType' in currentValue ? [currentValue, {}] : currentValue
      return [...previousValue, next]
    }, []),
  }

  const query = constructQuery(fromHierarchy(hierarchy, constraints), shapeToQueryOptions)
  return {
    query,
    async execute(client, $rdf) {
      const stream = await query.execute(client.query, { operation: 'postUrlencoded' })
      const dataset = await fromStream($rdf.dataset(), stream)
      const roots = rdf.clownface({ dataset }).node(hierarchy.out(meta.hierarchyRoot))

      return roots.map(root => new HierarchyNode(root, hierarchy))
    },
  }
}

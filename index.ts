import { DatasetCoreFactory } from 'rdf-js'
import clownface, { GraphPointer } from 'clownface'
import { Construct, DESCRIBE } from '@tpluscode/sparql-builder'
import type StreamClient from 'sparql-http-client'
import fromStream from 'rdf-dataset-ext/fromStream.js'
import { meta } from '@zazuko/vocabulary-extras/builders'
import { findNodes } from 'clownface-shacl-path'
import { sh } from '@tpluscode/rdf-ns-builders'
import { isGraphPointer } from 'is-graph-pointer'
import { topDown } from './lib/patterns.js'

export class HierarchyNode {
  private readonly path: GraphPointer
  private readonly nextLevel: GraphPointer

  constructor(public readonly resource: GraphPointer, hierarchyLevel: GraphPointer) {
    const path = hierarchyLevel.out(sh.path)
    const nextLevel = hierarchyLevel.out(meta.nextInHierarchy)

    if (!isGraphPointer(path)) {
      throw new Error('sh:path must be single node')
    }
    if (!isGraphPointer(nextLevel)) {
      throw new Error('meta:nextInHierarchy must be single node')
    }

    this.path = path
    this.nextLevel = nextLevel
  }

  get nextInHierarchy(): Array<HierarchyNode> {
    return findNodes(this.resource, this.path)
      .map(child => new HierarchyNode(child, this.nextLevel))
  }
}

export interface Hierarchy {
  query: Construct
  execute(
    client: StreamClient,
    rdf: DatasetCoreFactory,
  ): Promise<Array<HierarchyNode>>
}

export function getHierarchy(hierarchy: GraphPointer): Hierarchy {
  const query = DESCRIBE`*`
    .WHERE`
      ${topDown(hierarchy)}
    `

  return {
    query,
    async execute(client, $rdf) {
      const stream = await query.execute(client.query)
      const dataset = await fromStream($rdf.dataset(), stream)
      const roots = clownface({ dataset }).node(hierarchy.out(meta.hierarchyRoot))

      return roots.map(root => new HierarchyNode(root, hierarchy))
    },
  }
}

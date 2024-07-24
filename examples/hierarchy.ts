import 'anylogger-debug'
import log from 'anylogger'
import StreamClient from 'sparql-http-client'
import argparse from 'argparse'
import $rdf from '@zazuko/env'
import { Source } from 'rdf-cube-view-query'
import { meta } from '@zazuko/vocabulary-extras-builders'
import { isGraphPointer } from 'is-graph-pointer'
import { getHierarchy, HierarchyNode } from '../index.js'
import { cbd } from './util.js'

const main = async () => {
  const parser = new argparse.ArgumentParser()
  parser.add_argument('--cube', { required: true })
  parser.add_argument('--dimensionIri', { required: false })
  parser.add_argument('--endpoint', { required: false, default: 'https://int.lindas.admin.ch/query' })
  parser.add_argument('--print-query', { action: 'store_true' })
  parser.add_argument('--print-shape', { action: 'store_true' })

  const args = parser.parse_args()
  const endpoint = {
    endpointUrl: args.endpoint,
  }

  performance.mark('begin load cube')
  const client = new StreamClient(endpoint)
  const cube = await new Source(endpoint).cube(args.cube)
  performance.mark('end load cube')
  performance.measure('load cube', 'begin load cube', 'end load cube')

  performance.mark('begin fetch shape')
  await cube.fetchShape()
  performance.mark('end fetch shape')
  performance.measure('fetch shape', 'begin fetch shape', 'end fetch shape')
  const hierarchy = cube.ptr
    .any()
    .has($rdf.ns.sh.path, $rdf.namedNode(args.dimensionIri))
    .has(meta.inHierarchy)
    .out(meta.inHierarchy)
    .toArray()
    .shift()

  if (!isGraphPointer(hierarchy)) {
    throw new Error(`Hierarchy not found ${args.dimensionIri}`)
  }

  const hierarchyQuery = getHierarchy(hierarchy, {
    properties: [
      $rdf.ns.schema.identifier,
      [$rdf.ns.schema.name, { language: 'de' }],
    ],
  })

  if (args.print_shape) {
    const shapeQuads = cbd(hierarchyQuery.shape)
    console.log($rdf.dataset.toCanonical(shapeQuads))
    process.exit(0)
  }

  if (args.print_query) {
    console.log(hierarchyQuery.query)
    process.exit(0)
  }

  performance.mark('begin getHierarchy')
  const results = await hierarchyQuery.execute(client, $rdf)
  performance.mark('end getHierarchy')
  performance.measure('getHierarchy', 'begin getHierarchy', 'end getHierarchy')

  results.forEach(print(0))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(log as any)('perf')(performance.getEntriesByType('measure').map(measure => `${measure.name}: ${measure.duration} ms`).join('\n'))
}

function print(indent: number) {
  return (hierarchyLevel: HierarchyNode) => {
    const { value } = hierarchyLevel.resource
    console.log(value.padStart(value.length + indent))
    hierarchyLevel.nextInHierarchy.forEach(print(indent + 2))
  }
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})

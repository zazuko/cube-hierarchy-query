import 'anylogger-debug'
import log from 'anylogger'
import StreamClient from 'sparql-http-client'
import argparse from 'argparse'
import $rdf from 'rdf-ext'
import { Source } from 'rdf-cube-view-query'
import { sh } from '@tpluscode/rdf-ns-builders'
import { meta } from '@zazuko/vocabulary-extras/builders'
import { isGraphPointer } from 'is-graph-pointer'
import { getHierarchy, HierarchyNode } from '..'

const main = async () => {
  const parser = new argparse.ArgumentParser()
  parser.add_argument('--cube', { required: true })
  parser.add_argument('--dimensionIri', { required: false })
  parser.add_argument('--endpoint', { required: false, default: 'https://int.lindas.admin.ch/query' })

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
    .has(sh.path, $rdf.namedNode(args.dimensionIri))
    .has(meta.inHierarchy)
    .out(meta.inHierarchy)
    .toArray()
    .shift()

  if (!isGraphPointer(hierarchy)) {
    throw new Error(`Hierarchy not found ${args.dimensionIri}`)
  }

  performance.mark('begin getHierarchy')
  const results = await getHierarchy(hierarchy).execute(client, $rdf)
  performance.mark('end getHierarchy')
  performance.measure('getHierarchy', 'begin getHierarchy', 'end getHierarchy')

  results.forEach(print(0))
  performance.measure('print', 'begin print', 'end print')

  log('perf')(performance.getEntriesByType('measure').map(measure => `${measure.name}: ${measure.duration} ms`).join('\n'))
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

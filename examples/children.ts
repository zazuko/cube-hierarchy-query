import { Source } from 'rdf-cube-view-query'
import namespace from '@rdfjs/namespace'
import StreamClient from 'sparql-http-client'
import { MultiPointer } from 'clownface'
import $rdf from 'rdf-ext'
import { schema, sh } from '@tpluscode/rdf-ns-builders'
import { children } from '../resources'

const endpoint = {
  endpointUrl: 'https://int.lindas.admin.ch/query',
}

const queryOptions = {
  limit: 10,
  orderBy: [schema.name],
}

const client = new StreamClient(endpoint)
const meta = namespace('https://cube.link/meta/')

// Load cube using rdf-cube-view-query
const cube = await new Source(endpoint).cube('https://environment.ld.admin.ch/foen/ubd0104/7')
await cube.fetchShape()

// Find dimensions which have a hierarchy
const dimensions: MultiPointer = cube.ptr.any().has(meta.hasHierarchy)

// Select hierarchy for the desired dimension by narrowing down on sh:path
const hierarchy = dimensions
  .has(sh.path, $rdf.namedNode('https://environment.ld.admin.ch/foen/ubd0104/location'))
  .out(meta.hasHierarchy)
  .toArray().shift()

// Take the first level and a root
let level = hierarchy.out(meta.nextInHierarchy).toArray().shift()
const root = hierarchy.out(meta.hierarchyRoot).terms.shift()

// Drill down into subsequent hierarchy levels by expanding the first child every time
while (level) {
  const levelName = level.out(schema.name).value

  // Retrieve 10 children on the current level
  const childrenPointers = await children(level, root, queryOptions).execute(client, $rdf)
  console.log(`Level "${levelName}":`, childrenPointers.map(child => `${child.out(schema.name).value} (${child.value})`))

  // find the next level by following meta:nextInHierarchy property
  level = level.out(meta.nextInHierarchy).toArray().shift()
}

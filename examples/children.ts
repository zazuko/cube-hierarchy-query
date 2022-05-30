import { Source } from 'rdf-cube-view-query'
import namespace from '@rdfjs/namespace'
import StreamClient from 'sparql-http-client'
import { MultiPointer } from 'clownface'
import $rdf from 'rdf-ext'
import { schema, sh } from '@tpluscode/rdf-ns-builders'
import argparse from 'argparse'
import { children } from '../resources'

const queryOptions = {
  limit: 100,
  orderBy: [schema.name],
}

const uniqueBy = <T>(iterable: T[], key: (item: T) => string): T[] => {
  const res = {}
  for (const item of iterable) {
    res[key(item)] = item
  }
  return Object.values(res)
}

const meta = namespace('https://cube.link/meta/')

type Dimension = {
  iri: string
  name: string
};

// TODO Replace by a Cube type from rdf-cube-view-query
type Cube = any

const listHierarchicalDimensions = (cube: Cube): Dimension[] => {
  // Find dimensions which have a hierarchy
  const dimensions: MultiPointer = cube.ptr.any().has(meta.hasHierarchy)

  return uniqueBy(
    dimensions.toArray().map(d => ({
      name: d.out(schema.name, {
        language: 'en',
      }).value,
      iri: d.out(sh.path).value,
      hierarchies: d.out(meta.hasHierarchy).out(),
    })),
    x => x.iri,
  )
}

/**
 * List all the hierarchical levels for cube & dimension
 */
const listHierarchicalLevels = async (client: StreamClient, cube, dimensionIri: string) => {
  const hierarchy = cube.ptr
    .any()
    .has(sh.path, $rdf.namedNode(dimensionIri))
    .has(meta.hasHierarchy)
    .out(meta.hasHierarchy)

  const roots = hierarchy.out(meta.hierarchyRoot).terms

  // by level by iri
  const res = {}

  for (const root of roots) {
    let level = hierarchy
      .out(meta.nextInHierarchy)
      .toArray()
      .shift()
    // Drill down into subsequent hierarchy levels by expanding the first child every time
    while (level) {
      const levelName = level.out(schema.name).value

      const { parent, children: childrenPointers } = await children(
        level,
        root,
        queryOptions,
      ).execute(client, $rdf)

      res[level.value] = res[level.value] || {
        name: levelName,
        iri: level.value,
        children: {},
      }

      res[level.value].children[parent.value] =
        res[level.value].children[parent.value] || []

      res[level.value].children[parent.value].push({
        name: parent.out(schema.name).value,
        iri: parent.value,
        children: childrenPointers.map(child => ({
          name: child.out(schema.name).value,
          value: child.value,
        })),
      })

      // find the next level by following meta:nextInHierarchy property
      level = level
        .out(meta.nextInHierarchy)
        .toArray()
        .shift()
    }
  }
  console.log(JSON.stringify(res, null, 2))
}

const main = async () => {
  const parser = new argparse.ArgumentParser()
  parser.add_argument('mode', {
    choices: ['list-values', 'list-dimensions', 'fetch'],
  })
  parser.add_argument('--cube', { required: true })
  parser.add_argument('--dimensionIri', { required: false })
  parser.add_argument('--endpoint', { required: false, default: 'https://int.lindas.admin.ch/query' })
  const args = parser.parse_args()

  const endpoint = {
    endpointUrl: args.endpoint,
  }
  const client = new StreamClient(endpoint)

  // Load cube using rdf-cube-view-query
  const cube = await new Source(endpoint).cube(args.cube)

  await cube.fetchShape()

  if (args.mode === 'list-values') {
    const values = await listHierarchicalLevels(client, cube, args.dimensionIri)
    console.log(values)
  } else if (args.mode === 'list-dimensions') {
    const dims = await listHierarchicalDimensions(cube)
    console.log(dims)
  }
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})

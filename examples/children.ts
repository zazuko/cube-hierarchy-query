import { Source } from 'rdf-cube-view-query'
import { meta } from '@zazuko/vocabulary-extras-builders'
import StreamClient from 'sparql-http-client'
import { MultiPointer } from 'clownface'
import $rdf from '@zazuko/env'
import argparse from 'argparse'
import { children } from '../resources.js'

const queryOptions = {
  limit: 100,
  orderBy: [$rdf.ns.schema.name],
}

const uniqueBy = <T>(iterable: T[], key: (item: T) => string): T[] => {
  const res = {}
  for (const item of iterable) {
    res[key(item)] = item
  }
  return Object.values(res)
}

type Dimension = {
  iri: string
  name: string
};

// TODO Replace by a Cube type from rdf-cube-view-query
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Cube = any

const listHierarchicalDimensions = (cube: Cube): Dimension[] => {
  // Find dimensions which have a hierarchy
  const dimensions: MultiPointer = cube.ptr.any().has(meta.inHierarchy)

  return uniqueBy(
    dimensions.toArray().map(d => ({
      name: d.out($rdf.ns.schema.name, {
        language: 'en',
      }).value,
      iri: d.out($rdf.ns.sh.path).value,
      hierarchies: d.out(meta.inHierarchy).out(),
    })),
    x => x.iri,
  )
}

/**
 * List all the hierarchical levels for cube & dimension
 */
const listHierarchicalLevels = async (client: StreamClient, cube, dimensionIri: string, language?: string) => {
  const hierarchy = cube.ptr
    .any()
    .has($rdf.ns.sh.path, $rdf.namedNode(dimensionIri))
    .has(meta.inHierarchy)
    .out(meta.inHierarchy)

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
      const levelName = level.out($rdf.ns.schema.name).value

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
        name: parent.out($rdf.ns.schema.name, language ? { language } : undefined).value,
        iri: parent.value,
        children: childrenPointers.map(child => ({
          name: child.out($rdf.ns.schema.name, language ? { language } : undefined).value,
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
  parser.add_argument('--language')

  const args = parser.parse_args()

  const endpoint = {
    endpointUrl: args.endpoint,
  }
  const client = new StreamClient(endpoint)

  // Load cube using rdf-cube-view-query
  const cube = await new Source(endpoint).cube(args.cube)

  await cube.fetchShape()

  if (args.mode === 'list-values') {
    const values = await listHierarchicalLevels(client, cube, args.dimensionIri, args.language)
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

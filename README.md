# @zazuko/cube-hierarchy-query ![esm](https://img.shields.io/static/v1?label=ES&message=modules&color=green)

Use it to work with hierarchies defined using the [RDF Cube Schema](https://zazuko.github.io/rdf-cube-schema/#hierarchies)

## Usage

The examples below assume `dataset` is an RDF/JS graph of Swiss cantons:

```turtle
PREFIX schema: <http://schema.org/>
PREFIX meta: <https://cube.link/meta/>
PREFIX sh: <http://www.w3.org/ns/shacl#>

<hierarchy/Switzerland>
  a meta:Hierarchy ;
  meta:hierarchyRoot <country/CHE> ;
  meta:nextInHierarchy <hierarchy/Switzerland/cantons> .
  
<hierarchy/Switzerland/cantons>
  schema:name "Canton" ;
  sh:path schema:containsPlace ;
  meta:nextInHierarchy <hierarchy/Switzerland/districts> .
  
<hierarchy/Switzerland/districts>
  schema:name "Districts" ;
  sh:path [ sh:inversePath schema:containedInPlace ] ;
  meta:nextInHierarchy <hierarchy/Switzerland/municipalities> .
    
<hierarchy/Switzerland/municipalities>
  schema:name "Municipalities" ;
  sh:path [ sh:inversePath schema:containedInPlace ] .
```

### Get entire hierarchy

The simplest usage is to retrieve entire hierarchy. It generates a `CONSTRUCT` SPARQL query which will retrieve triples of the root resources and all resources on all hierarchy levels.

* `sh:targetClass`, if present is added as a restriction on each applicable level

```typescript
import { getHierarchy } from '@zazuko/cube-hierarchy-query'
import $rdf from '@zazuko/env'
import StreamClient from 'sparql-http-builder'

let dataset: DatasetCore
const client = new StreamClient()

const myHierarchy = clownface({ dataset }).namedNode('my-hierarchy')
const results = await getHierarchy(myHierarchy).execute(client, $rdf)

results.forEach(print(0))

function print(indent: number) {
  return (hierarchyLevel: HierarchyNode) => {
    const { value } = hierarchyLevel.resource
    console.log(value.padStart(value.length + indent))
    hierarchyLevel.nextInHierarchy.forEach(print(indent + 2))
  }
}
```

By default, all properties of every hierarchy level are retrieved. That may prove very verbose and in such
cases, the caller can explicitly request specific properties to be returned by passing a second argument to
the `getHierarchy` function.

```ts
import rdf from '@zazuko/env'

getHierarchy(myHierarchy, {
  properties: [
    rdf.ns.schema.identifier,
    [rdf.ns.schema.name, { language: 'de' }]  
  ]
})
```

The above will fetch only `schema:identifier` and `schema:name` of all levels, additionally filtering 
names only in German.

### Find resources

Given a hierarchy level ([`GraphPointer`](https://zazuko.github.io/clownface/#/api?id=clownface)) and the URI of a resource from that hierarchy,
finds children of that resource

```typescript
import { children } from '@zazuko/cube-hierarchy-query/resources'
import $rdf from '@zazuko/env'
import StreamClient from 'sparql-http-builder'
import { schema } from '@tpluscode/rdf-ns-builders'

let dataset: DatasetCore
let municipality: NamedNode

const districtLevel = clownface({ dataset }).namedNode('hierarchy/Switzerland/districts')
const client = new StreamClient()

const query = children(districtLevel, municipality, {
  limit: 10,            // optional (default 1)
  offset: 10,           // optional (default 0)
  orderBy: schema.name, // optional (default undefined)
})

// will return array of graph pointers to children on the given municipality
const pointers: GraphPointer[] = await query.execute(client, $rdf)
```

### Introspect properties

Given a hierarchy level ([`GraphPointer`](https://zazuko.github.io/clownface/#/api?id=clownface)),
finds properties which connect resources from that level with the next.

Return a graph of `?property rdfs:label ?label` quads of found properties

```typescript
import { properties } from '@zazuko/cube-hierarchy-query/introspect'
import StreamClient from 'sparql-http-builder'

const districtLevel = clownface({ dataset }).namedNode('hierarchy/Switzerland/cantons')
const client = new StreamClient()

const stream = await properties(cantonLevel).execute(client.query)
```

### Introspect types

Given a hierarchy level ([`GraphPointer`](https://zazuko.github.io/clownface/#/api?id=clownface)),
finds types of resources at the given level 

Return a graph of `?type rdfs:label ?label` quads of found properties

```typescript
import { types } from '@zazuko/cube-hierarchy-query/introspect'
import StreamClient from 'sparql-http-builder'

const districtLevel = clownface({ dataset }).namedNode('hierarchy/Switzerland/cantons')
const client = new StreamClient()

const stream = await types(cantonLevel).execute(client.query)
```

## Examples

The [examples](./examples) directory contains snippets showing the usage on real cubes & hierarchies.

To run call from `example` NPM script and pass the example file's path as argument. For example

```
yarn example ./examples/children.ts
```

To have the executed queries printed in the console, set a command flag:

```diff
yarn example ./examples/children.ts --print-query
```

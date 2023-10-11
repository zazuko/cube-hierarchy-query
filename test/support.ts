/* eslint-disable @typescript-eslint/no-explicit-any */
import { turtle, TurtleValue } from '@tpluscode/rdf-string'
import { INSERT, sparql } from '@tpluscode/sparql-builder'
import type { GraphPointer } from 'clownface'
import formats from '@rdfjs-elements/formats-pretty'
import rdfExt from 'rdf-dataset-ext'
import toStream from 'string-to-stream'
import $rdf from '@zazuko/env'
import * as compose from 'docker-compose'
import waitOn from 'wait-on'
import { Context } from 'mocha'
import getStream from 'get-stream'
import prefixes from '@zazuko/prefixes'
import { prefixes as extraPrefixes } from '@zazuko/vocabulary-extras'
import { s2q } from '@hydrofoil/shape-to-query'
import { client } from './client.js'

const { parsers, serializers } = formats
export const ex = $rdf.namespace('http://example.com/')

const testDataGraph = $rdf.namedNode('urn:hierarchy:test')

export async function startFuseki(this: Context) {
  this.timeout(200000)
  await compose.upAll()
  await waitOn({
    resources: ['http://localhost:3030'],
  })
}

export async function insertTestData(strings: TemplateStringsArray, ...values: TurtleValue[]) {
  const query = sparql`
      DROP SILENT GRAPH ${testDataGraph} ;

      ${INSERT.DATA`GRAPH ${testDataGraph} {
        ${turtle(strings, ...values)}
      }`}
    `.toString({
    base: 'http://example.com/',
  })

  await client.query.update(query)
}

export async function parse(strings: TemplateStringsArray, ...values: TurtleValue[]) {
  const graph = turtle(strings, ...values).toString({
    base: 'http://example.com/',
  })
  const dataset = await $rdf.dataset().import(<any>parsers.import('text/turtle', <any>toStream(graph))!)
  return $rdf.clownface({ dataset })
}

export async function serialize(ptr: GraphPointer): Promise<string> {
  const { rdf, sh, schema } = prefixes
  const { cube, meta } = extraPrefixes

  const dataset = $rdf.traverser(() => true).match(<any>ptr)

  return getStream(serializers.import('text/turtle', rdfExt.toStream(dataset), {
    prefixes: {
      cube,
      meta,
      sh,
      schema,
      rdf,
      s2q: s2q().value,
    },
  }) as any)
}

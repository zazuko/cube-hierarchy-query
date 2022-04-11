import { turtle, TurtleValue } from '@tpluscode/rdf-string'
import { INSERT, sparql } from '@tpluscode/sparql-builder'
import clownface from 'clownface'
import { parsers } from '@rdfjs/formats-common'
import toStream from 'string-to-stream'
import $rdf from 'rdf-ext'
import namespace from '@rdfjs/namespace'
import * as compose from 'docker-compose'
import waitOn from 'wait-on'
import { Context } from 'mocha'
import { client } from './client'

export const ex = namespace('http://example.com/')

const testDataGraph = $rdf.namedNode('urn:hierarchy:test')

export async function startFuseki(this: Context) {
  this.timeout(200000)
  await compose.upAll()
  await waitOn({
    resources: ['http://localhost:3030'],
  })
}

export async function testData(strings: TemplateStringsArray, ...values: TurtleValue[]) {
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
  const dataset = await $rdf.dataset().import(parsers.import('text/turtle', toStream(graph))!)
  return clownface({ dataset })
}

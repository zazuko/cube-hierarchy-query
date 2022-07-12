import { meta } from '@zazuko/vocabulary-extras/builders'
import { schema, sh } from '@tpluscode/rdf-ns-builders'
import { expect } from 'chai'
import $rdf from 'rdf-ext'
import { getHierarchy, HierarchyNode } from '../index.js'
import { ex, parse, startFuseki } from './support.js'
import { insertGeoData } from './testData.js'
import { streamClient } from './client.js'

describe('@zazuko/cube-hierarchy-query', () => {
  before(startFuseki)

  before(insertGeoData)

  describe('getHierarchy', async () => {
    // given
    const hierarchy = await parse`
        <>
          ${meta.hierarchyRoot} <Europe>, <North-America>, <South-America> ;
          ${meta.nextInHierarchy} <countryLevel> ;
        .
        
        <countryLevel>
          ${sh.path} [
            ${sh.inversePath} ${schema.containedInPlace} ;
          ] ;
          ${meta.nextInHierarchy} <cantonLevel> ;
        .
        
        <cantonLevel> 
          ${sh.path} [
            ${sh.inversePath} ${schema.containedInPlace} ;
          ] ;
          ${meta.nextInHierarchy} <municipalityLevel> ;
        .
        
        <municipalityLevel> 
          ${sh.path} [
            ${sh.inversePath} ${schema.containedInPlace} ;
          ] ;
          ${meta.nextInHierarchy} <districtLevel> ;
        .
        
        <districtLevel> ${sh.path} ${schema.containsPlace} .
      `

    // when
    const hierarchyTree = await getHierarchy(hierarchy.namedNode(ex(''))).execute(streamClient, $rdf)
    const json = hierarchyTree.map(toPlain)

    // then
    expect(json).to.deep.eq([
      {
        resource: ex('North-America'),
        nextInHierarchy: [
          { resource: ex('US') },
        ],
      },
      {
        resource: ex('South-America'),
        nextInHierarchy: [
          { resource: ex('BR') },
          { resource: ex('AR') },
          { resource: ex('VE') },
        ],
      },
      {
        resource: ex('Europe-America'),
        nextInHierarchy: [
          {
            resource: ex('CH'),
            nextInHierarchy: [
              {
                resource: ex('ZH'),
                nextInHierarchy: [
                  {
                    resource: ex('Affoltern'),
                    nextInHierarchy: [
                      { resource: ex('Bonstetten') },
                      { resource: ex('Rifferswil') },
                      { resource: ex('Stallikon') },
                      { resource: ex('Knonau') },
                    ],
                  },
                ],
              },
              {
                resource: ex('BE'),
                nextInHierarchy: [
                  {
                    resource: ex('Biel-Bienne'),
                    nextInHierarchy: [
                      { resource: ex('Aegerten') },
                      { resource: ex('Ligerz') },
                      { resource: ex('Nidau') },
                      { resource: ex('Port') },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ])
  })
})

function toPlain(node: HierarchyNode): Record<string, unknown> {
  return {
    resource: node.resource.term,
    nextInHierarchy: node.nextInHierarchy.map(toPlain),
  }
}

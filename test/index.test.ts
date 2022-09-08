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

  describe('getHierarchy', () => {
    const countriesHierarchy = parse`
      <>
        ${meta.hierarchyRoot} <Europe>, <North-America>, <South-America>, <Asia> ;
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

    it('loads all levels', async function () {
      // given
      const hierarchy = await countriesHierarchy

      // when
      const hierarchyQuery = getHierarchy(hierarchy.namedNode(ex('')))
      const hierarchyTree = await hierarchyQuery.execute(streamClient, $rdf)

      expect(hierarchyQuery.query.build()).to.matchSnapshot(this)

      const plainTree = hierarchyTree.map(toPlain)

      // then
      expect(plainTree).to.containSubset([
        {
          resource: ex('Europe'),
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
        {
          resource: ex('Asia'),
        },
      ])
    })

    it('loads shallower paths', async () => {
      // given
      const hierarchy = await countriesHierarchy

      // when
      const hierarchyTree = await getHierarchy(hierarchy.namedNode(ex(''))).execute(streamClient, $rdf)
      const plainTree = hierarchyTree.map(toPlain)

      // then
      expect(plainTree).to.containSubset([{
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
      }])
    })

    it('applies type filter', async () => {
      // given
      const hierarchy = await countriesHierarchy
      hierarchy.namedNode(ex('countryLevel'))
        .addOut(sh.targetClass, ex.Country)

      // when
      const hierarchyTree = await getHierarchy(hierarchy.namedNode(ex(''))).execute(streamClient, $rdf)
      const plainTree = hierarchyTree.map(toPlain)

      // then
      expect(plainTree).not.to.containSubset([{
        resource: ex('Europe'),
        nextInHierarchy: [
          { resource: $rdf.namedNode('https://sws.geonames.org/798544') },
        ],
      }])
    })
  })
})

function toPlain(node: HierarchyNode): Record<string, unknown> {
  if (!node.nextInHierarchy.length) {
    return {
      resource: node.resource.term,
    }
  }

  return {
    resource: node.resource.term,
    nextInHierarchy: node.nextInHierarchy.map(toPlain),
  }
}

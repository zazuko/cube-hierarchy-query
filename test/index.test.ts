import { meta } from '@zazuko/vocabulary-extras-builders'
import chai, { expect } from 'chai'
import $rdf from '@zazuko/env'
import { jestSnapshotPlugin } from 'mocha-chai-jest-snapshot'
import { getHierarchy, HierarchyNode } from '../index.js'
import { ex, parse, startFuseki } from './support.js'
import { insertGeoData } from './testData.js'
import { streamClient } from './client.js'

describe('@zazuko/cube-hierarchy-query', () => {
  chai.use(jestSnapshotPlugin())

  before(startFuseki)

  before(insertGeoData)

  describe('getHierarchy', () => {
    const countriesHierarchy = parse`
      <>
        ${meta.hierarchyRoot} <Europe>, <North-America>, <South-America>, <Asia> ;
        ${meta.nextInHierarchy} <countryLevel> ;
      .
      
      <countryLevel>
        ${$rdf.ns.sh.path} [
          ${$rdf.ns.sh.inversePath} ${$rdf.ns.schema.containedInPlace} ;
        ] ;
        ${meta.nextInHierarchy} <cantonLevel> ;
      .
      
      <cantonLevel> 
        ${$rdf.ns.sh.path} [
          ${$rdf.ns.sh.inversePath} ${$rdf.ns.schema.containedInPlace} ;
        ] ;
        ${meta.nextInHierarchy} <municipalityLevel> ;
      .
      
      <municipalityLevel> 
        ${$rdf.ns.sh.path} [
          ${$rdf.ns.sh.inversePath} ${$rdf.ns.schema.containedInPlace} ;
        ] ;
        ${meta.nextInHierarchy} <districtLevel> ;
      .
      
      <districtLevel> ${$rdf.ns.sh.path} ${$rdf.ns.schema.containsPlace} .
    `

    it('loads all levels', async function () {
      // given
      const hierarchy = await countriesHierarchy

      // when
      const hierarchyQuery = getHierarchy(hierarchy.namedNode(ex('')))
      const hierarchyTree = await hierarchyQuery.execute(streamClient, $rdf)

      expect(hierarchyQuery.query.build()).to.matchSnapshot()

      const plainTree = hierarchyTree.map(toPlain)

      // then
      expect(plainTree).to.containSubset([
        {
          resource: ex('Europe'),
          name: 'Europe',
          nextInHierarchy: [
            {
              resource: ex('CH'),
              name: 'Switzerland',
              nextInHierarchy: [
                {
                  resource: ex('ZH'),
                  name: 'Kanton Zürich',
                  nextInHierarchy: [
                    {
                      resource: ex('Affoltern'),
                      nextInHierarchy: [
                        { resource: ex('Bonstetten'), name: 'Bonstetten' },
                        { resource: ex('Rifferswil'), name: 'Rifferswil' },
                        { resource: ex('Stallikon'), name: 'Stallikon' },
                        { resource: ex('Knonau'), name: 'Knonau' },
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
        .addOut($rdf.ns.sh.targetClass, ex.Country)

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
      name: node.resource.out($rdf.ns.schema.name).value,
    }
  }

  return {
    resource: node.resource.term,
    nextInHierarchy: node.nextInHierarchy.map(toPlain),
    name: node.resource.out($rdf.ns.schema.name).value,
  }
}

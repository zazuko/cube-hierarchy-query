import { gn, rdf, schema, sh } from '@tpluscode/rdf-ns-builders/strict'
import { expect } from 'chai'
import $rdf from 'rdf-ext'
import clownface from 'clownface'
import { meta } from '../lib/ns'
import { example } from '../resources'
import { client } from './client'
import { ex, parse, startFuseki, testData } from './support'

describe('@zazuko/cube-hierarchy-query/resources', () => {
  before(startFuseki)

  before(async function () {
    await testData`
      <US> a ${ex.Country} ; ${schema.containedInPlace} <North-America> .
      <BR> a ${ex.Country} ; ${schema.containedInPlace} <South-America> .

      <CH> a ${ex.Country} ; ${schema.containedInPlace} <Europe> .

      <https://sws.geonames.org/2658434>
        a ${gn.A} ; ${gn.parentFeature} <Europe> .


      <https://sws.geonames.org/798544>
        a ${gn.A} ; ${schema.containedInPlace} <Europe> .

      <ZH> a ${ex.Canton} ; ${schema.containedInPlace} <CH> .

      <Affoltern> a ${ex.District} ;
        ${schema.containedInPlace} <ZH> ;
        ${schema.containsPlace} <Bonstetten> ;
      .

      <Bonstetten> a ${ex.Municipality} .
    `
  })

  describe('example', () => {
    it('returns empty query when last property id not defined', async () => {
      // given
      const hierarchy = await parse`
        <>
          ${meta.hierarchyRoot} <Europe> ;
          ${meta.nextInHierarchy} <firstLevel> ;
        .
        <firstLevel> ${sh.path} [] .
      `

      // when
      const query = example(hierarchy.namedNode(ex.firstLevel))

      // then
      expect(query).to.be.empty
    })

    it('returns single instance', async () => {
      // given
      const hierarchy = await parse`
        <>
          ${meta.hierarchyRoot} <Europe> ;
          ${meta.nextInHierarchy} <firstLevel> ;
        .
        <firstLevel> ${sh.path} [
          ${sh.inversePath} ${schema.containedInPlace}
        ] .
      `

      // when
      const query = example(hierarchy.namedNode(ex.firstLevel))
      const dataset = $rdf.dataset(await client.query.construct(query))

      // then
      const country = clownface({ dataset }).has(rdf.type)
      expect(country.term).to.deep.eq(ex.CH)
    })

    it('returns instance narrowed by class name', async () => {
      // given
      const hierarchy = await parse`
        <>
          ${meta.hierarchyRoot} <Europe> ;
          ${meta.nextInHierarchy} <firstLevel> ;
        .
        <firstLevel>
          ${sh.path} [
            ${sh.inversePath} ${schema.containedInPlace}
          ] ;
          ${sh.targetClass} ${gn.A} ;
        .
      `

      // when
      const query = example(hierarchy.namedNode(ex.firstLevel))
      const dataset = $rdf.dataset(await client.query.construct(query))

      // then
      const country = clownface({ dataset }).has(rdf.type)
      expect(country.term).to.deep.eq($rdf.namedNode('https://sws.geonames.org/798544'))
    })
  })
})

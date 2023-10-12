import { expect } from 'chai'
import $rdf from '@zazuko/env'
import { meta } from '@zazuko/vocabulary-extras-builders'
import { children, example } from '../resources.js'
import { client, streamClient } from './client.js'
import { ex, parse, startFuseki } from './support.js'
import { insertGeoData } from './testData.js'

describe('@zazuko/cube-hierarchy-query/resources', () => {
  before(startFuseki)

  before(insertGeoData)

  describe('example', () => {
    it('returns empty query when last property id not defined', async () => {
      // given
      const hierarchy = await parse`
        <>
          ${meta.hierarchyRoot} <Europe> ;
          ${meta.nextInHierarchy} <firstLevel> ;
        .
        <firstLevel> ${$rdf.ns.sh.path} [] .
      `

      // when
      const query = example(hierarchy.namedNode(ex.firstLevel))

      // then
      expect(query).to.be.null
    })

    it('returns single instance', async () => {
      // given
      const hierarchy = await parse`
        <>
          ${meta.hierarchyRoot} <Europe> ;
          ${meta.nextInHierarchy} <firstLevel> ;
        .
        <firstLevel> ${$rdf.ns.sh.path} [
          ${$rdf.ns.sh.inversePath} ${$rdf.ns.schema.containedInPlace}
        ] .
      `

      // when
      const query = example(hierarchy.namedNode(ex.firstLevel))
      const dataset = $rdf.dataset(await query.execute(client.query))

      // then
      const country = $rdf.clownface({ dataset }).has($rdf.ns.rdf.type)
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
          ${$rdf.ns.sh.path} [
            ${$rdf.ns.sh.inversePath} ${$rdf.ns.schema.containedInPlace}
          ] ;
          ${$rdf.ns.sh.targetClass} ${$rdf.ns.gn.A} ;
        .
      `

      // when
      const query = example(hierarchy.namedNode(ex.firstLevel))
      const dataset = $rdf.dataset(await query.execute(client.query))

      // then
      const country = $rdf.clownface({ dataset }).has($rdf.ns.rdf.type)
      expect(country.term).to.deep.eq($rdf.namedNode('https://sws.geonames.org/798544'))
    })
  })

  describe('children', () => {
    it('return N matched children by inverse path', async () => {
      // given
      const hierarchy = await parse`
        <>
          ${meta.hierarchyRoot} <South-America> ;
          ${meta.nextInHierarchy} <firstLevel> ;
        .
        <firstLevel> ${$rdf.ns.sh.path} [
          ${$rdf.ns.sh.inversePath} ${$rdf.ns.schema.containedInPlace} ;
        ] .
      `

      // when
      const query = children(hierarchy.namedNode(ex.firstLevel), ex('South-America'), {
        limit: 1,
      })
      const { children: result } = await query.execute(streamClient, $rdf)

      // then
      expect(result).to.have.length(1)
    })

    it('return N matched children by direct path', async () => {
      // given
      const hierarchy = await parse`
        <>
          ${meta.hierarchyRoot} <Europe> ;
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

      // when
      const query = children(hierarchy.namedNode(ex.districtLevel), ex('Affoltern'), {
        limit: 1,
      })
      const { children: result } = await query.execute(streamClient, $rdf)

      // then
      expect(result).to.have.length(1)
    })

    it('return N matched children, sorted and offset', async () => {
      // given
      const hierarchy = await parse`
        <>
          ${meta.hierarchyRoot} <Europe> ;
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

      // when
      const query = children(hierarchy.namedNode(ex.districtLevel), ex('Affoltern'), {
        limit: 1,
        offset: 2,
        orderBy: [$rdf.ns.schema.position, $rdf.ns.schema.name],
      })
      const { children: [result] } = await query.execute(streamClient, $rdf)

      // then
      expect(result.term).to.deep.eq(ex.Rifferswil)
    })
  })
})

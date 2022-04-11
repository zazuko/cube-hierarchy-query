import { gn, rdf, schema, sh } from '@tpluscode/rdf-ns-builders/strict'
import { expect } from 'chai'
import $rdf from 'rdf-ext'
import clownface from 'clownface'
import { meta } from '../lib/ns'
import { children, example } from '../resources'
import { client, streamClient } from './client'
import { ex, parse, startFuseki, testData } from './support'

describe('@zazuko/cube-hierarchy-query/resources', () => {
  before(startFuseki)

  before(async function () {
    await testData`
      <US> a ${ex.Country} ; ${schema.containedInPlace} <North-America> .
      <BR> a ${ex.Country} ; ${schema.containedInPlace} <South-America> .
      <AR> a ${ex.Country} ; ${schema.containedInPlace} <South-America> .
      <VE> a ${ex.Country} ; ${schema.containedInPlace} <South-America> .

      <CH> a ${ex.Country} ; ${schema.containedInPlace} <Europe> .

      <https://sws.geonames.org/2658434>
        a ${gn.A} ; ${gn.parentFeature} <Europe> .


      <https://sws.geonames.org/798544>
        a ${gn.A} ; ${schema.containedInPlace} <Europe> .

      <ZH> a ${ex.Canton} ; ${schema.containedInPlace} <CH> .

      <Affoltern> a ${ex.District} ;
        ${schema.containedInPlace} <ZH> ;
        ${schema.containsPlace} <Bonstetten>, <Rifferswil>, <Stallikon>, <Knonau> ;
      .

      <Bonstetten> a ${ex.Municipality} ; ${schema.name} "Bonstetten" .
      <Rifferswil> a ${ex.Municipality} ; ${schema.name} "Rifferswil" .
      <Stallikon> a ${ex.Municipality} ; ${schema.name} "Stallikon" .
      <Knonau> a ${ex.Municipality} ; ${schema.name} "Knonau" .
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
      expect(query).to.be.null
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
      const dataset = $rdf.dataset(await query.execute(client.query))

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
      const dataset = $rdf.dataset(await query.execute(client.query))

      // then
      const country = clownface({ dataset }).has(rdf.type)
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
        <firstLevel> ${sh.path} [
          ${sh.inversePath} ${schema.containedInPlace} ;
        ] .
      `

      // when
      const query = children(hierarchy.namedNode(ex.firstLevel), ex('South-America'), {
        limit: 1,
      })
      const result = await query.execute(streamClient, $rdf)

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
      const query = children(hierarchy.namedNode(ex.districtLevel), ex('Affoltern'), {
        limit: 1,
      })
      const result = await query.execute(streamClient, $rdf)

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
      const query = children(hierarchy.namedNode(ex.districtLevel), ex('Affoltern'), {
        limit: 1,
        offset: 2,
        orderBy: [schema.position, schema.name],
      })
      const [result] = await query.execute(streamClient, $rdf)

      // then
      expect(result.term).to.deep.eq(ex.Rifferswil)
    })
  })
})

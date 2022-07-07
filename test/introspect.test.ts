import { expect } from 'chai'
import $rdf from 'rdf-ext'
import clownface from 'clownface'
import { gn, rdf, rdfs, schema, sh } from '@tpluscode/rdf-ns-builders'
import TermSet from '@rdfjs/term-set'
import { meta } from '@zazuko/vocabulary-extras/builders'
import { properties, types } from '../introspect.js'
import { client } from './client.js'
import { ex, parse, startFuseki, testData } from './support.js'

describe('@zazuko/cube-hierarchy-query/introspect', () => {
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

  describe('properties', () => {
    it('returns properties for first level', async () => {
      // given
      const hierarchy = await parse`
        <>
          ${meta.hierarchyRoot} <CH> ;
          ${meta.nextInHierarchy} <firstLevel> ;
        .
      `
      const query = properties(hierarchy.namedNode(ex.firstLevel))

      // when
      const dataset = $rdf.dataset(await query.execute(client.query))

      // then
      const result = clownface({ dataset })
      expect(result.node(rdf.type).out(rdfs.label).terms).to.have.length.gt(0)
    })

    it('filters by resources at level by sh:targetClass', async () => {
      // given
      const hierarchy = await parse`
        <>
          ${meta.hierarchyRoot} <Europe> ;
          ${meta.nextInHierarchy} <firstLevel> ;
        .

        <firstLevel> ${sh.targetClass} ${ex.Country} ; ${sh.path} [] .
      `
      const query = properties(hierarchy.namedNode(ex.firstLevel))

      // when
      const dataset = $rdf.dataset(await query.execute(client.query))

      // then
      const results = clownface({ dataset })
        .has(rdfs.label)
        .terms
      expect(results).to.have.length(1)
      expect(results[0].equals(schema.containedInPlace))
    })

    it('returns inverse properties for first level', async () => {
      // given
      const hierarchy = await parse`
        <>
          ${meta.hierarchyRoot} <CH> ;
          ${meta.nextInHierarchy} <firstLevel> ;
        .

        <firstLevel> ${sh.path} [] .
      `
      const query = properties(hierarchy.namedNode(ex.firstLevel))

      // when
      const dataset = $rdf.dataset(await query.execute(client.query))

      // then
      const result = clownface({ dataset })
      expect(result.node(schema.containedInPlace).out(rdfs.label).terms).to.have.length.gt(0)
    })

    it('returns inverse properties for deep level', async () => {
      // given
      const hierarchy = await parse`
        <>
          ${meta.hierarchyRoot} <Europe> ;
          ${schema.name} "From continent to Station" ;
          ${meta.nextInHierarchy} [
            ${sh.path} [
              ${sh.inversePath} ${schema.containedInPlace} ;
            ] ;
            ${meta.nextInHierarchy} [
              ${schema.name} "Canton" ;
              ${sh.path} [
                ${sh.inversePath} ${schema.containedInPlace} ;
              ] ;
              ${meta.nextInHierarchy} [
                ${schema.name} "District" ;
                ${sh.path} [
                  ${sh.inversePath} ${schema.containedInPlace} ;
                ] ;
                ${meta.nextInHierarchy} <municipalityLevel>
              ] ;
            ] ;
          ]
        .
      `
      const query = properties(hierarchy.namedNode(ex.municipalityLevel))

      // when
      const dataset = $rdf.dataset(await query.execute(client.query))

      // then
      const result = clownface({ dataset })
      expect(result.node(schema.containsPlace).out(rdfs.label).terms).to.have.length.gt(0)
    })

    it('returns empty string if an intermediate path is invalid', async () => {
      // given
      const hierarchy = await parse`
        <>
          ${meta.hierarchyRoot} <Europe> ;
          ${schema.name} "From continent to Station" ;
          ${meta.nextInHierarchy} [
            ${sh.path} [
              ${sh.inversePath} ${schema.containedInPlace} ;
            ] ;
            ${meta.nextInHierarchy} [
              ${schema.name} "Canton" ;
              ${sh.path} [
              ] ;
              ${meta.nextInHierarchy} [
                ${schema.name} "District" ;
                ${sh.path} [
                  ${sh.inversePath} ${schema.containedInPlace} ;
                ] ;
                ${meta.nextInHierarchy} <municipalityLevel>
              ] ;
            ] ;
          ]
        .
      `
      // when
      const query = properties(hierarchy.namedNode(ex.municipalityLevel))

      // then
      expect(query).to.be.null
    })
  })

  describe('types', () => {
    it('returns types of resources in specific level in hierarchy', async () => {
      // given
      const hierarchy = await parse`
        <>
          ${meta.hierarchyRoot} <Europe> ;
          ${meta.nextInHierarchy} <firstLevel> ;
        .
        <firstLevel> ${sh.path} [] .
      `
      const query = types(hierarchy.namedNode(ex.firstLevel))

      // when
      const dataset = $rdf.dataset(await query.execute(client.query))

      // then
      const result = new TermSet(clownface({ dataset }).has(rdfs.label).terms)
      expect(result.has(gn.A))
      expect(result.has(ex.Country))
    })

    it('handles multiple roots', async () => {
      // given
      const hierarchy = await parse`
        <>
          ${meta.hierarchyRoot} <South-America>, <North-America> ;
          ${meta.nextInHierarchy} <firstLevel> ;
        .
        <firstLevel> ${sh.path} [] .
      `
      const query = types(hierarchy.namedNode(ex.firstLevel))

      // when
      const dataset = $rdf.dataset(await query.execute(client.query))

      // then
      const result = clownface({ dataset })
      expect(result.has(rdfs.label).terms).to.deep.contain.members([
        ex.Country,
      ])
    })
  })
})

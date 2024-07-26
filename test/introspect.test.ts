import { expect } from 'chai'
import $rdf from '@zazuko/env'
import { meta } from '@zazuko/vocabulary-extras-builders'
import { properties, types } from '../introspect.js'
import { client } from './client.js'
import { ex, parse, startFuseki } from './support.js'
import { insertGeoData } from './testData.js'

describe('@zazuko/cube-hierarchy-query/introspect', () => {
  before(startFuseki)

  before(insertGeoData)

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
      const dataset = $rdf.dataset(await query.execute(client))

      // then
      const result = $rdf.clownface({ dataset })
      expect(result.node($rdf.ns.rdf.type).out($rdf.ns.rdfs.label).terms).to.have.length.gt(0)
    })

    it('filters by resources at level by sh:targetClass', async () => {
      // given
      const hierarchy = await parse`
        <>
          ${meta.hierarchyRoot} <Europe> ;
          ${meta.nextInHierarchy} <firstLevel> ;
        .

        <firstLevel> ${$rdf.ns.sh.targetClass} ${ex.Country} ; ${$rdf.ns.sh.path} [] .
      `
      const query = properties(hierarchy.namedNode(ex.firstLevel))

      // when
      const dataset = $rdf.dataset(await query.execute(client))

      // then
      const results = $rdf.clownface({ dataset })
        .has($rdf.ns.rdfs.label)
        .terms
      expect(results).to.have.length(1)
      expect(results[0].equals($rdf.ns.schema.containedInPlace))
    })

    it('returns inverse properties for first level', async () => {
      // given
      const hierarchy = await parse`
        <>
          ${meta.hierarchyRoot} <CH> ;
          ${meta.nextInHierarchy} <firstLevel> ;
        .

        <firstLevel> ${$rdf.ns.sh.path} [] .
      `
      const query = properties(hierarchy.namedNode(ex.firstLevel))

      // when
      const dataset = $rdf.dataset(await query.execute(client))

      // then
      const result = $rdf.clownface({ dataset })
      expect(result.node($rdf.ns.schema.containedInPlace).out($rdf.ns.rdfs.label).terms).to.have.length.gt(0)
    })

    it('returns inverse properties for deep level', async () => {
      // given
      const hierarchy = await parse`
        <>
          ${meta.hierarchyRoot} <Europe> ;
          ${$rdf.ns.schema.name} "From continent to Station" ;
          ${meta.nextInHierarchy} [
            ${$rdf.ns.sh.path} [
              ${$rdf.ns.sh.inversePath} ${$rdf.ns.schema.containedInPlace} ;
            ] ;
            ${meta.nextInHierarchy} [
              ${$rdf.ns.schema.name} "Canton" ;
              ${$rdf.ns.sh.path} [
                ${$rdf.ns.sh.inversePath} ${$rdf.ns.schema.containedInPlace} ;
              ] ;
              ${meta.nextInHierarchy} [
                ${$rdf.ns.schema.name} "District" ;
                ${$rdf.ns.sh.path} [
                  ${$rdf.ns.sh.inversePath} ${$rdf.ns.schema.containedInPlace} ;
                ] ;
                ${meta.nextInHierarchy} <municipalityLevel>
              ] ;
            ] ;
          ]
        .
      `
      const query = properties(hierarchy.namedNode(ex.municipalityLevel))

      // when
      const dataset = $rdf.dataset(await query.execute(client))

      // then
      const result = $rdf.clownface({ dataset })
      expect(result.node($rdf.ns.schema.containsPlace).out($rdf.ns.rdfs.label).terms).to.have.length.gt(0)
    })

    it('returns empty string if an intermediate path is invalid', async () => {
      // given
      const hierarchy = await parse`
        <>
          ${meta.hierarchyRoot} <Europe> ;
          ${$rdf.ns.schema.name} "From continent to Station" ;
          ${meta.nextInHierarchy} [
            ${$rdf.ns.sh.path} [
              ${$rdf.ns.sh.inversePath} ${$rdf.ns.schema.containedInPlace} ;
            ] ;
            ${meta.nextInHierarchy} [
              ${$rdf.ns.schema.name} "Canton" ;
              ${$rdf.ns.sh.path} [
              ] ;
              ${meta.nextInHierarchy} [
                ${$rdf.ns.schema.name} "District" ;
                ${$rdf.ns.sh.path} [
                  ${$rdf.ns.sh.inversePath} ${$rdf.ns.schema.containedInPlace} ;
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
        <firstLevel> ${$rdf.ns.sh.path} [] .
      `
      const query = types(hierarchy.namedNode(ex.firstLevel))

      // when
      const dataset = $rdf.dataset(await query.execute(client))

      // then
      const result = $rdf.termSet($rdf.clownface({ dataset }).has($rdf.ns.rdfs.label).terms)
      expect(result.has($rdf.ns.gn.A))
      expect(result.has(ex.Country))
    })

    it('handles multiple roots', async () => {
      // given
      const hierarchy = await parse`
        <>
          ${meta.hierarchyRoot} <South-America>, <North-America> ;
          ${meta.nextInHierarchy} <firstLevel> ;
        .
        <firstLevel> ${$rdf.ns.sh.path} [] .
      `
      const query = types(hierarchy.namedNode(ex.firstLevel))

      // when
      const dataset = $rdf.dataset(await query.execute(client))

      // then
      const result = $rdf.clownface({ dataset })
      expect(result.has($rdf.ns.rdfs.label).terms).to.deep.contain.members([
        ex.Country,
      ])
    })
  })
})

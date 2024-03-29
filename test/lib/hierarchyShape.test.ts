import { meta } from '@zazuko/vocabulary-extras-builders'
import $rdf from '@zazuko/env'
import chai, { expect } from 'chai'
import { jestSnapshotPlugin } from 'mocha-chai-jest-snapshot'
import { fromHierarchy } from '../../lib/hierarchyShape.js'
import { ex, parse, serialize } from '../support.js'

describe('lib/hierarchyShape', () => {
  chai.use(jestSnapshotPlugin())

  describe('fromHierarchy', () => {
    it('excludes property from SPO rule', async () => {
      // given
      const hierarchy = await parse`
        <>
          ${meta.hierarchyRoot} <Europe> ;
          ${meta.nextInHierarchy} <firstLevel> ;
        .
        <firstLevel> 
          ${$rdf.ns.sh.path} ${$rdf.ns.schema.containsPlace} ;
          ${meta.nextInHierarchy} <secondLevel> .
        <secondLevel> 
          ${$rdf.ns.sh.path} ${$rdf.ns.schema.containsPlace} .
      `

      // when
      const shape = fromHierarchy(hierarchy.namedNode(ex()))

      // then
      expect(
        await serialize(shape),
      ).toMatchSnapshot()
    })

    it('does not add excludes when properties are inverse', async () => {
      // given
      const hierarchy = await parse`
        <>
          ${meta.hierarchyRoot} <Europe> ;
          ${meta.nextInHierarchy} <firstLevel> ;
        .
        <firstLevel> 
          ${$rdf.ns.sh.path} [ ${$rdf.ns.sh.inversePath} ${$rdf.ns.schema.containedInPlace} ] ;
          ${meta.nextInHierarchy} <secondLevel> .
        <secondLevel> 
          ${$rdf.ns.sh.path} [ ${$rdf.ns.sh.inversePath} ${$rdf.ns.schema.containedInPlace} ] ; .
      `

      // when
      const shape = fromHierarchy(hierarchy.namedNode(ex()))

      // then
      expect(
        await serialize(shape),
      ).toMatchSnapshot()
    })
  })
})

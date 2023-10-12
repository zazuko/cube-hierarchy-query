import $rdf from '@zazuko/env'
import { ex, insertTestData } from './support.js'

export const insertGeoData = () => insertTestData`
  <North-America> ${$rdf.ns.schema.name} "North America".
  <BR> ${$rdf.ns.schema.name} "Brasil".
  <CH> ${$rdf.ns.schema.name} "Switzerland".
  <Europe> ${$rdf.ns.schema.name} "Europe".
  <ZH> ${$rdf.ns.schema.name} "Kanton Zürich".

  <US> a ${ex.Country} ; ${$rdf.ns.schema.containedInPlace} <North-America> .
  <BR> a ${ex.Country} ; ${$rdf.ns.schema.containedInPlace} <South-America> .
  <AR> a ${ex.Country} ; ${$rdf.ns.schema.containedInPlace} <South-America> .
  <VE> a ${ex.Country} ; ${$rdf.ns.schema.containedInPlace} <South-America> .

  <CH> a ${ex.Country} ; ${$rdf.ns.schema.containedInPlace} <Europe> .

  <https://sws.geonames.org/2658434>
    a ${$rdf.ns.gn.A} ; ${$rdf.ns.gn.parentFeature} <Europe> .

  <https://sws.geonames.org/798544>
    a ${$rdf.ns.gn.A} ; ${$rdf.ns.schema.containedInPlace} <Europe> .

  <ZH> a ${ex.Canton} ; ${$rdf.ns.schema.containedInPlace} <CH> .

  <Affoltern> a ${ex.District} ;
    ${$rdf.ns.schema.containedInPlace} <ZH> ;
    ${$rdf.ns.schema.containsPlace} <Bonstetten>, <Rifferswil>, <Stallikon>, <Knonau> ;
  .

  <Bonstetten> a ${ex.Municipality} ; ${$rdf.ns.schema.name} "Bonstetten" .
  <Rifferswil> a ${ex.Municipality} ; ${$rdf.ns.schema.name} "Rifferswil" .
  <Stallikon> a ${ex.Municipality} ; ${$rdf.ns.schema.name} "Stallikon" .
  <Knonau> a ${ex.Municipality} ; ${$rdf.ns.schema.name} "Knonau" .
  
  <BE> a ${ex.Canton} ; ${$rdf.ns.schema.containedInPlace} <CH> .
  
  <Biel-Bienne> a ${ex.District} ;
    ${$rdf.ns.schema.containedInPlace} <BE> ;
    ${$rdf.ns.schema.containsPlace} <Aegerten>, <Ligerz>, <Nidau>, <Port> ;
  .
`

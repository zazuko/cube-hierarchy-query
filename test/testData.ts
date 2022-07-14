import { gn, schema } from '@tpluscode/rdf-ns-builders'
import { ex, insertTestData } from './support.js'

export const insertGeoData = () => insertTestData`
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
  
  <BE> a ${ex.Canton} ; ${schema.containedInPlace} <CH> .
  
  <Biel-Bienne> a ${ex.District} ;
    ${schema.containedInPlace} <BE> ;
    ${schema.containsPlace} <Aegerten>, <Ligerz>, <Nidau>, <Port> ;
  .
`

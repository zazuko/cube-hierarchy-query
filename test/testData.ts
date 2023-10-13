import $rdf from '@zazuko/env'
import { ex, insertTestData } from './support.js'

export const insertGeoData = () => insertTestData`
  <North-America> a ${$rdf.ns.schema.Continent} .

  <North-America> ${$rdf.ns.schema.name} "North America"@en, "Nordamerika"@de.
  <BR> ${$rdf.ns.schema.name} "Brasil"@en, "Brasilien"@de.
  <CH> ${$rdf.ns.schema.name} "Switzerland"@en, "Die Schweiz"@de.
  <Europe> ${$rdf.ns.schema.name} "Europe"@en, "Europa"@de.
  <ZH> ${$rdf.ns.schema.name} "Canton Zurich"@en, "Kanton Zürich"@de.
  
  <North-America> ${$rdf.ns.schema.identifier} "NA" .
  <BR> ${$rdf.ns.schema.identifier} "BR" .
  <CH> ${$rdf.ns.schema.identifier} "CH" .
  <Europe> ${$rdf.ns.schema.identifier} "EU" .
  <ZH> ${$rdf.ns.schema.identifier} "ZH" .

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

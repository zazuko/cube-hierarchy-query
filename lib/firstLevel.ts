import { Term } from 'rdf-js'
import type { MultiPointer } from 'clownface'
import { sparql, SparqlTemplateResult } from '@tpluscode/sparql-builder'
import { toSparql } from 'clownface-shacl-path'
import { parent } from './variable.js'

export function anyPath(subject: Term, path: MultiPointer, level: number): SparqlTemplateResult {
  const inverse = path.term?.termType === 'BlankNode'
  if (inverse) {
    return sparql`${subject} ?property ${parent(level)} .`
  }

  return sparql`${parent(level)} ?property ${subject} .`
}

export function requiredPath(subject: Term, path: MultiPointer, level: number): SparqlTemplateResult {
  return sparql`${parent(level)} ${toSparql(path)} ${subject} .`
}

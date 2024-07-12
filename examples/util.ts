/* eslint-disable @typescript-eslint/no-explicit-any */
import { DatasetCore } from 'rdf-js'
import { GraphPointer } from 'clownface'
import $rdf from '@zazuko/env'

export function cbd(ptr: GraphPointer): DatasetCore {
  return $rdf.traverser(({ level, quad: { subject } }) => level === 0 || subject.termType === 'BlankNode').match(ptr as any)
}

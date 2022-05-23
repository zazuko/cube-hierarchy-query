import { Variable } from 'rdf-js'
import rdf from '@rdfjs/data-model'

export function parent(level: number): Variable {
  return rdf.variable(`parent${level}`)
}

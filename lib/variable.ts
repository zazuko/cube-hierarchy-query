import { Variable } from 'rdf-js'
import { variable } from '@rdfjs/data-model'

export function parent(level: number): Variable {
  return variable(`parent${level}`)
}

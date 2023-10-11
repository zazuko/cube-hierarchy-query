import { Variable } from 'rdf-js'
import rdf from '@zazuko/env'

export function parent(level: number): Variable {
  return rdf.variable(`parent${level}`)
}

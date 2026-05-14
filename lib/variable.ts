import type { Variable } from '@rdfjs/types'
import rdf from '@zazuko/env'

export function parent(level: number): Variable {
  return rdf.variable(`parent${level}`)
}

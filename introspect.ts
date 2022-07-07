import { Construct, CONSTRUCT, SELECT } from '@tpluscode/sparql-builder'
import { rdfs } from '@tpluscode/rdf-ns-builders'
import { GraphPointer } from 'clownface'
import { meta } from '@zazuko/vocabulary-extras/builders'
import { getHierarchyPatterns } from './lib/patterns.js'
import { anyPath } from './lib/firstLevel.js'

/**
 * Creates a query to find properties connecting the given hierarchy
 * level with its immediate parent.
 *
 * @param {GraphPointer} hierarchyLevel it must be a pointer to the full hierarchy dataset
 */
export function properties(hierarchyLevel: GraphPointer): Construct | null {
  const patterns = getHierarchyPatterns(hierarchyLevel, {
    firstLevel: anyPath,
  })
  if (!patterns) {
    return null
  }

  return CONSTRUCT`?property ${rdfs.label} ?label`
    .WHERE`
      {
        ${SELECT.DISTINCT`?property`.WHERE`
          ${patterns}
          filter(isiri(?this))
        `}
      }

      optional { ?property ${rdfs.label} ?rdfsLabel }

      bind(if(bound(?rdfsLabel), concat(?rdfsLabel, " (", str(?property), ")"), str(?property)) as ?label)
    `
}

/**
 * Creates a query to find all RDF types of resources at a given hierarchy level
 *
 * @param {GraphPointer} hierarchyLevel it must be a pointer to the full hierarchy dataset
 */
export function types(hierarchyLevel: GraphPointer): Construct | null {
  const patterns = getHierarchyPatterns(hierarchyLevel, {
    restrictTypes: false,
    firstLevel: anyPath,
  })
  if (!patterns) {
    return null
  }

  return CONSTRUCT`?type ${rdfs.label} ?label`
    .WHERE`
      {
        ${SELECT.DISTINCT`?type`.WHERE`
          ${patterns}
          ?this a ?type
          filter(isiri(?this))
          minus {
            ?this a ${meta.Hierarchy}
          }
        `}
      }

      optional { ?type ${rdfs.label} ?rdfsLabel }

      bind(if(bound(?rdfsLabel), concat(?rdfsLabel, " (", str(?type), ")"), str(?type)) as ?label)
    `
}

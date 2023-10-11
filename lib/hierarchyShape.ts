import rdf from '@zazuko/env'
import type { GraphPointer } from 'clownface'
import { meta } from '@zazuko/vocabulary-extras-builders'
import { isGraphPointer, isNamedNode } from 'is-graph-pointer'
import { s2q } from '@hydrofoil/shape-to-query'

export function fromHierarchy(hierarchy: GraphPointer) {
  const clone = rdf.clownface({
    dataset: hierarchy.dataset.match(),
    term: hierarchy.term,
  })

  const rootShape = clone.blankNode()

  rootShape
    .addOut(rdf.ns.rdf.type, rdf.ns.sh.NodeShape)
    .addOut(rdf.ns.sh.targetNode, hierarchy.out(meta.hierarchyRoot))
    .addOut(rdf.ns.sh.rule, rule => {
      rule.addOut(rdf.ns.rdf.type, s2q.SPORule)
    })

  let currentLevel = hierarchy.out(meta.nextInHierarchy)
  let currentLevelShape: GraphPointer = rootShape

  while (currentLevel) {
    const path = currentLevel.out(rdf.ns.sh.path)
    if (!isGraphPointer(path)) {
      break
    }

    let nextLevelShape : GraphPointer

    currentLevelShape
      .addOut(rdf.ns.sh.property, constraint => {
        constraint.addOut(rdf.ns.sh.path, path)
          .addOut(rdf.ns.sh.node, nodeConstraint => {
            nodeConstraint.addOut(rdf.ns.sh.rule, rule => {
              rule.addOut(rdf.ns.rdf.type, s2q.SPORule)
            })

            nextLevelShape = nodeConstraint
          })

        const targetClass = currentLevel.out(rdf.ns.sh.targetClass).term
        if (targetClass) {
          constraint.addOut(rdf.ns.sh.class, targetClass)
        }

        if (isNamedNode(path)) {
          currentLevelShape.out(rdf.ns.sh.rule)
            .addOut(s2q.predicateFilter, propertyFilter(path))
        }
      })

    currentLevel = currentLevel.out(meta.nextInHierarchy)
    currentLevelShape = nextLevelShape
  }

  return rootShape
}

function propertyFilter(path: GraphPointer) {
  return (ptr: GraphPointer) => {
    ptr.addList(rdf.ns.dashSparql.not, [
      ptr.blankNode().addList(rdf.ns.dashSparql.eq, [
        rdf.ns.sh.this,
        path,
      ]),
    ])
  }
}

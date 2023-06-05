import clownface, { GraphPointer } from 'clownface'
import { rdf, sh, dashSparql } from '@tpluscode/rdf-ns-builders'
import { meta } from '@zazuko/vocabulary-extras/builders'
import { isGraphPointer, isNamedNode } from 'is-graph-pointer'
import { s2q } from '@hydrofoil/shape-to-query'

export function fromHierarchy(hierarchy: GraphPointer) {
  const clone = clownface({
    dataset: hierarchy.dataset.match(),
    term: hierarchy.term,
  })

  const rootShape = clone.blankNode()

  rootShape
    .addOut(rdf.type, sh.NodeShape)
    .addOut(sh.targetNode, hierarchy.out(meta.hierarchyRoot))
    .addOut(sh.rule, rule => {
      rule.addOut(rdf.type, s2q.SPORule)
    })

  let currentLevel = hierarchy.out(meta.nextInHierarchy)
  let currentLevelShape: GraphPointer = rootShape

  while (currentLevel) {
    const path = currentLevel.out(sh.path)
    if (!isGraphPointer(path)) {
      break
    }

    let nextLevelShape : GraphPointer

    currentLevelShape
      .addOut(sh.property, constraint => {
        constraint.addOut(sh.path, path)
          .addOut(sh.node, nodeConstraint => {
            nodeConstraint.addOut(sh.rule, rule => {
              rule.addOut(rdf.type, s2q.SPORule)
            })

            nextLevelShape = nodeConstraint
          })

        const targetClass = currentLevel.out(sh.targetClass).term
        if (targetClass) {
          constraint.addOut(sh.class, targetClass)
        }

        if (isNamedNode(path)) {
          currentLevelShape.out(sh.rule)
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
    ptr.addList(dashSparql.not, [
      ptr.blankNode().addList(dashSparql.eq, [
        sh.this,
        path,
      ]),
    ])
  }
}

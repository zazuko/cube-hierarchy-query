import { NamedNode, Term } from 'rdf-js'
import rdf from '@zazuko/env'
import type { GraphPointer } from 'clownface'
import { meta } from '@zazuko/vocabulary-extras-builders'
import { isGraphPointer, isNamedNode } from 'is-graph-pointer'
import { s2q } from '@hydrofoil/shape-to-query'

export type PropertyWithConstraints = [NamedNode, {
  language?: string
}]

export interface HierarchyConstraints {
  properties?: PropertyWithConstraints[]
}

export function fromHierarchy(hierarchy: GraphPointer, constraints: HierarchyConstraints = {}) {
  const clone = rdf.clownface({
    dataset: hierarchy.dataset.match(),
    term: hierarchy.term,
  })

  const rootShape = clone.blankNode()

  rootShape
    .addOut(rdf.ns.rdf.type, rdf.ns.sh.NodeShape)
    .addOut(rdf.ns.sh.targetNode, hierarchy.out(meta.hierarchyRoot))

  addPropertyConstraints(rootShape, constraints)

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
            addPropertyConstraints(nodeConstraint, constraints)

            nextLevelShape = nodeConstraint
          })

        const targetClass = currentLevel.out(rdf.ns.sh.targetClass).term
        if (targetClass) {
          addTargetClassFilter(constraint, targetClass)
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

function addTargetClassFilter(constraint: GraphPointer, targetClass: Term) {
  constraint.addOut(rdf.ns.sh.values, rule => {
    rule.addOut(rdf.ns.sh.nodes, path => {
      path.addOut(rdf.ns.sh.path, constraint.out(rdf.ns.sh.path))
    })
    rule.addOut(rdf.ns.sh.filterShape, filter => {
      filter.addOut(rdf.ns.sh.property, type => {
        type.addOut(rdf.ns.sh.path, rdf.ns.rdf.type)
        type.addOut(rdf.ns.sh.hasValue, targetClass)
      })
    })
  })
}

function addPropertyConstraints(shape: GraphPointer, { properties = [] }: HierarchyConstraints) {
  if (properties.length === 0) {
    shape.addOut(rdf.ns.sh.rule, rule => {
      rule.addOut(rdf.ns.rdf.type, s2q.SPORule)
    })
    return
  }

  properties.forEach(addProperty.bind(null, shape))

  if (!properties.find(([prop]) => prop.equals(rdf.ns.rdf.type))) {
    addProperty(shape, [rdf.ns.rdf.type, {}])
  }
}

function addProperty(shape: GraphPointer, [property, constraints]: PropertyWithConstraints) {
  shape.addOut(rdf.ns.sh.property, propertyShape => {
    propertyShape.addOut(rdf.ns.sh.path, property)
    if (constraints.language) {
      propertyShape.addOut(rdf.ns.sh.values, rule => {
        rule.addOut(rdf.ns.sh.nodes, selector => {
          selector.addOut(rdf.ns.sh.path, property)
        })
        rule.addOut(rdf.ns.sh.filterShape, filter => {
          filter.addList(rdf.ns.sh.languageIn, constraints.language)
        })
      })
    }
  })
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

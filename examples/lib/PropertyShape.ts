import { PropertyShape, ShapePatterns, sparql } from '@hydrofoil/shape-to-query'

export class PropertyShapeEx extends PropertyShape {
  nodeConstraintPatterns({ constructClause, whereClause }: ShapePatterns): ShapePatterns {
    return {
      constructClause,
      whereClause: sparql`
        #pragma group.joins
        ${whereClause}
      `,
    }
  }
}

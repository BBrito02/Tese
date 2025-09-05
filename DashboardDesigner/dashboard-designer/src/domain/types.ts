// Tipos base do meta-modelo

/** Kinds that belong to the Interaction_Comp family */
// export type InteractionCompKind = 'Button' | 'Filter' | 'Parameter';

export type NodeKind = //Rever melhor se sao so estes os tipos de nos (size, color, shape)?

    | 'Dashboard'
    | 'Visualization'
    | 'Legend'
    | 'Tooltip'
    | 'Button'
    | 'Filter'
    | 'Parameter'
    | 'DataAction'
    | 'Datum'
    | 'Placeholder';

export interface NodeDataBase {
  title: string;
  description?: string;
  kind: NodeKind;
}

export type NodeData = NodeDataBase;

// @ts-nocheck
import {
  ASTNodeBase, Context, flowToTree, Schemes, ToASTContext, treeToFlow
} from 'rete-studio-core'

import { Transformer } from './add-controls'

export class TreeFlow<ASTNode extends ASTNodeBase, S extends Schemes>
  extends Transformer<Context<ASTNode, S>, ToASTContext<ASTNode, S>> {
  constructor() {
    super('tree flow')
  }

  async up(context: Context<ASTNode, S>) {
    await (treeToFlow<S, ASTNode>({
      isStart: node => ['Program'].includes(node.label),
      isSequence: node => {
        if (['Program', 'Block'].includes(node.label)) return /^body\[.*\]$/

        return false
      },
      getBlockParameterName(node) {
        if (node.label === 'Program' || node.label === 'Block') return { array: true, key: 'body' }

        return { array: true, key: 'body' }
      },
      isBranch: node => {
        if (['IfStatement'].includes(node.label)) return /(alternate|consequent)/

        return false
      }
    }))(context)
  }

  async down(context: ToASTContext<ASTNode, S>): Promise<void> {
    await (flowToTree<S, ASTNode>({
      isRoot(node) {
        if (node.label === 'Block') {
          return false
        }

        return node.label === 'Program'
      },
      isBranch(node) {
        return ['IfStatement'].includes(node.label)
      },
      getBranchNames(node) {
        if (node.label === 'IfStatement') return ['consequent', 'alternate']

        throw new Error(`Unknown branch node ${node.label}`)
      },
      isBlock(node) {
        return ['Block', 'Program'].includes(node.label)
      },
      getBlockParameterName(node) {
        if (node.label === 'Program' || node.label === 'Block') return { array: true, key: 'body' }

        throw new Error(`Unknown block node ${node.label}`)
      }
    }))(context)
  }
}

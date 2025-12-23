// @ts-nocheck
import {
  ASTNodeBase, Context, Schemes, ToASTContext
} from 'rete-studio-core'

export class Transformer<C, T> {
  name: string

  constructor(name: string) {
    this.name = name
  }

  async up(_context: C) {
    // Default implementation
  }

  async down(_context: T): Promise<void> {
    // Default implementation
  }
}

/* eslint-disable max-len */
export class AddControls<ASTNode extends ASTNodeBase, S extends Schemes>
  extends Transformer<Context<ASTNode, S>, ToASTContext<ASTNode, S>> {
  constructor() {
    super('add controls')
  }

  async up(_context: Context<ASTNode, S>) {
    // For DSL, we'll keep this simple for now
    // Controls can be added as needed
  }

  async down(_context: ToASTContext<ASTNode, S>): Promise<void> {
    // No reverse transformation needed
  }
}

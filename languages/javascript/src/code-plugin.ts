
import generate from '@babel/generator'
import { parse, ParserOptions } from '@babel/parser'
import * as BabelType from '@babel/types'
import { ClassicPreset, NodeEditor } from 'rete'
import { AreaPlugin } from 'rete-area-plugin'
import { BaseNode, BaseOptions, CodePlugin, Connection, Output, Schemes, socket } from 'rete-studio-core'

import { applyAstReverseTransformations, applyAstTransformations, makePurifiedExecutable } from './ast'
import { AddControls } from './transformers/add-controls'
import { AddFlowPlaceholder } from './transformers/add-flow-placeholder'
import { CleanUpPorts } from './transformers/clean-up-ports'
import { ClearUnknown } from './transformers/clear-unknown'
import { ExpressionIntoStatement } from './transformers/expression-into-statement'
import { InnerPorts } from './transformers/inner-ports'
import { LiteralsToControls } from './transformers/literals-to-controls'
import { MarkClosures } from './transformers/mark-closures'
import { MarkConstructor } from './transformers/mark-constructor'
import { MarkControlSockets } from './transformers/mark-control-sockets'
import { MarkFrames } from './transformers/mark-frames'
import { MirrorDataflowExpressions } from './transformers/mirror-dataflow-expressions'
import { OmitBlockNodes } from './transformers/omit-block-nodes'
import { OmitBreak } from './transformers/omit-break'
import { OmitContinue } from './transformers/omit-continue'
import { OmitLabeled } from './transformers/omit-labeled'
import { OmitRestoreClosures } from './transformers/omit-restore-closures'
import { PruneDeadStatements } from './transformers/prune-dead-statements'
import { Rename } from './transformers/rename'
import { RestoreBindPorts } from './transformers/restore-bind-ports'
import { ReverseUnpackSolidClosures } from './transformers/reverse-unpack-solid-closures'
import { SaveVariableKind } from './transformers/save-variable-kind'
import { SimplifyIdentifiers } from './transformers/simplify-identifiers'
import { SolidBlocksEntry } from './transformers/solid-blocks-entry'
import { TreeFlow } from './transformers/tree-flow'

const base: BaseOptions<Schemes> = {
  createInput(label) {
    return new ClassicPreset.Input(socket, label, true)
  },
  createOutput(label) {
    return new Output(socket, label, true)
  },
  createConnection(source, sourceOutput, target, targetInput, options) {
    return new Connection(source, sourceOutput, target, targetInput, options)
  },
  createNode(type) {
    return new BaseNode(type)
  }
}

export const astTools = {
  parse(code: string) {
    const parserOptions: ParserOptions = {
      sourceType: 'module',
      strictMode: false,
      errorRecovery: true
    }

    return parse(code, parserOptions)
  },
  generate(ast: BabelType.File) {
    return generate(ast).code
  },
  purify(ast: BabelType.File) {
    return applyAstTransformations(ast)
  },
  unpurify(ast: BabelType.File) {
    return applyAstReverseTransformations(ast)
  },
  executable(ast: BabelType.File) {
    return makePurifiedExecutable(BabelType.cloneNode(ast))
  }
}

export function initCodePlugin<K>(editor: NodeEditor<Schemes>, area: AreaPlugin<Schemes, K>) {
  const processedTypes = new Set<string>()
  const unsupportedTypes = [
    'ClassPrivateProperty', 'ClassPrivateMethod', 'PrivateName', 'WithStatement',
    'Directive', 'FunctionDeclaration', 'ClassDeclaration', 'CommentLine'
  ]
  const code = new CodePlugin<Schemes, BabelType.Node>({
    transformers: [
      new MarkClosures(),
      new ClearUnknown(),
      new AddFlowPlaceholder(),
      new SaveVariableKind(),
      new TreeFlow(),
      new SolidBlocksEntry(),
      new OmitBlockNodes(),
      new OmitContinue(),
      new PruneDeadStatements(),
      new OmitBreak(),
      new PruneDeadStatements(),
      new OmitLabeled(),
      new ReverseUnpackSolidClosures(),
      new MarkConstructor(),
      new RestoreBindPorts(),
      new MirrorDataflowExpressions(),
      new SimplifyIdentifiers(),
      new LiteralsToControls(),
      new OmitRestoreClosures(),
      new ExpressionIntoStatement(),
      new InnerPorts(),
      new CleanUpPorts(),
      new MarkFrames(),
      new MarkControlSockets(),
      new AddControls(editor, area),
      new Rename()
    ],
    up: {
      ...base,
      isSupported: node => !unsupportedTypes.includes(node.type),
      isStatement(data) {
        return BabelType.isStatement(data) || BabelType.isVariableDeclarator(data)
          || BabelType.isSwitchCase(data) || BabelType.isCatchClause(data)
      },
      isExpression(data) {
        return BabelType.isProgram(data) || BabelType.isExpression(data)
          || BabelType.isLiteral(data) || BabelType.isSpreadElement(data)
          || BabelType.isClassBody(data) || BabelType.isClassMethod(data)
          || BabelType.isClassProperty(data) || BabelType.isTemplateElement(data)
          || BabelType.isSwitchCase(data) || BabelType.isObjectProperty(data)
          || BabelType.isObjectMethod(data) || BabelType.isModuleSpecifier(data)
          || BabelType.isRestElement(data) || BabelType.isPattern(data)
      },
      nodeCreated(node) {
        node.type && processedTypes.add(node.type)
      }
    },
    down: {
      ...base,
      createASTNode(node, args) {
        if (!(node.label in BabelType)) throw new Error(`Unknown factory ${node.label}`)
        const factory = (BabelType as Record<string, (() => any) | unknown>)[node.label]

        if (typeof factory !== 'function') throw new Error(`Factory ${node.label} is not a function`)

        return factory(...args)
      },
      nodeParameters(label) {
        return BabelType.BUILDER_KEYS[label]
      },
      defaults(node, key) {
        if (['FunctionExpression', 'ArrowFunctionExpression', 'ClassMethod'].includes(node.label)) {
          if (key === 'params') return []
          if (key === 'body') return BabelType.blockStatement([])
        }
        if (['IfStatement'].includes(node.label) && key === 'alternate') return null
        if (['IfStatement'].includes(node.label) && key === 'consequent') return BabelType.blockStatement([])
        if (['ImportDeclaration'].includes(node.label) && key === 'specifiers') return []
        if (['CallExpression', 'NewExpression'].includes(node.label) && key === 'arguments') return []
        if (['ClassBody', 'BlockStatement'].includes(node.label) && key === 'body') return []
        if (['TemplateLiteral'].includes(node.label) && key === 'expressions') return []
        if (['ObjectPattern'].includes(node.label) && key === 'properties') return []
      }
    }
  })

  async function toGraph(ast: BabelType.File, imported?: () => void) {
    await code.toGraph(ast, async () => {
      // const processed = Array.from(processedTypes)

      // console.log('total types', processed)
      // console.log('unhandled', BabelType.STANDARDIZED_TYPES.filter(t => ![...unsupportedTypes, ...processed].includes(t)))
      imported && imported()
    })
  }

  async function toAST() {
    const ast = await code.toAST<BabelType.File>()

    return astTools.unpurify(ast)
  }

  return {
    code,
    astTools,
    unsupportedTypes,
    processedTypes,
    toGraph,
    toAST
  }
}

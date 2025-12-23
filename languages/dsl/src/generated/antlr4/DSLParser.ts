// @ts-nocheck
// Generated from antlr4/DSL.g4 by ANTLR 4.9.0-SNAPSHOT

import { ATN } from 'antlr4ts/atn/ATN'
import { ATNDeserializer } from 'antlr4ts/atn/ATNDeserializer'
import { ParserATNSimulator } from 'antlr4ts/atn/ParserATNSimulator'
import { NotNull } from 'antlr4ts/Decorators'
import { Override } from 'antlr4ts/Decorators'
import { FailedPredicateException } from 'antlr4ts/FailedPredicateException'
import * as Utils from 'antlr4ts/misc/Utils'
import { NoViableAltException } from 'antlr4ts/NoViableAltException'
import { Parser } from 'antlr4ts/Parser'
import { ParserRuleContext } from 'antlr4ts/ParserRuleContext'
import { RecognitionException } from 'antlr4ts/RecognitionException'
import { RuleContext } from 'antlr4ts/RuleContext'
import { Token } from 'antlr4ts/Token'
import { TokenStream } from 'antlr4ts/TokenStream'
import { ParseTreeListener } from 'antlr4ts/tree/ParseTreeListener'
import { ParseTreeVisitor } from 'antlr4ts/tree/ParseTreeVisitor'
// import { RuleVersion } from "antlr4ts/RuleVersion";
import { TerminalNode } from 'antlr4ts/tree/TerminalNode'
import { Vocabulary } from 'antlr4ts/Vocabulary'
import { VocabularyImpl } from 'antlr4ts/VocabularyImpl'

import { DSLListener } from './DSLListener'
import { DSLVisitor } from './DSLVisitor'

export class DSLParser extends Parser {
  public static readonly T__0 = 1
  public static readonly T__1 = 2
  public static readonly T__2 = 3
  public static readonly T__3 = 4
  public static readonly T__4 = 5
  public static readonly T__5 = 6
  public static readonly T__6 = 7
  public static readonly T__7 = 8
  public static readonly T__8 = 9
  public static readonly T__9 = 10
  public static readonly T__10 = 11
  public static readonly T__11 = 12
  public static readonly T__12 = 13
  public static readonly T__13 = 14
  public static readonly T__14 = 15
  public static readonly T__15 = 16
  public static readonly T__16 = 17
  public static readonly T__17 = 18
  public static readonly ID = 19
  public static readonly NUMBER = 20
  public static readonly WS = 21
  public static readonly RULE_program = 0
  public static readonly RULE_statement = 1
  public static readonly RULE_varDeclaration = 2
  public static readonly RULE_ifStatement = 3
  public static readonly RULE_elseIfClause = 4
  public static readonly RULE_elseClause = 5
  public static readonly RULE_block = 6
  public static readonly RULE_expressionStatement = 7
  public static readonly RULE_expression = 8
  public static readonly RULE_primary = 9
  // tslint:disable:no-trailing-whitespace
  public static readonly ruleNames: string[] = [
    'program', 'statement', 'varDeclaration', 'ifStatement', 'elseIfClause',
    'elseClause', 'block', 'expressionStatement', 'expression', 'primary'
  ]

  private static readonly _LITERAL_NAMES: Array<string | undefined> = [
    undefined, "'let'", "'='", "'if'", "'('", "')'", "'else'", "'{'", "'}'",
    "'*'", "'/'", "'+'", "'-'", "'>'", "'<'", "'>='", "'<='", "'=='", "'!='"
  ]
  private static readonly _SYMBOLIC_NAMES: Array<string | undefined> = [
    undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    undefined, undefined, undefined, undefined, undefined, 'ID', 'NUMBER',
    'WS'
  ]
  public static readonly VOCABULARY: Vocabulary = new VocabularyImpl(DSLParser._LITERAL_NAMES, DSLParser._SYMBOLIC_NAMES, [])

  // @Override
  // @NotNull
  public get vocabulary(): Vocabulary {
    return DSLParser.VOCABULARY
  }
  // tslint:enable:no-trailing-whitespace

  // @Override
  public get grammarFileName(): string { return 'DSL.g4' }

  // @Override
  public get ruleNames(): string[] { return DSLParser.ruleNames }

  // @Override
  public get serializedATN(): string { return DSLParser._serializedATN }

  protected createFailedPredicateException(predicate?: string, message?: string): FailedPredicateException {
    return new FailedPredicateException(this, predicate, message)
  }

  constructor(input: TokenStream) {
    super(input)
    this._interp = new ParserATNSimulator(DSLParser._ATN, this)
  }
  // @RuleVersion(0)
  public program(): ProgramContext {
    const _localctx: ProgramContext = new ProgramContext(this._ctx, this.state)

    this.enterRule(_localctx, 0, DSLParser.RULE_program)
    let _la: number

    try {
      this.enterOuterAlt(_localctx, 1)
      {
        this.state = 23
        this._errHandler.sync(this)
        _la = this._input.LA(1)
        while ((((_la) & ~0x1F) === 0 && ((1 << _la) & ((1 << DSLParser.T__0) | (1 << DSLParser.T__2) | (1 << DSLParser.T__3) | (1 << DSLParser.ID) | (1 << DSLParser.NUMBER))) !== 0)) {
          {
            {
              this.state = 20
              this.statement()
            }
          }
          this.state = 25
          this._errHandler.sync(this)
          _la = this._input.LA(1)
        }
        this.state = 26
        this.match(DSLParser.EOF)
      }
    }
    catch (re) {
      if (re instanceof RecognitionException) {
        _localctx.exception = re
        this._errHandler.reportError(this, re)
        this._errHandler.recover(this, re)
      } else {
        throw re
      }
    }
    finally {
      this.exitRule()
    }
    return _localctx
  }
  // @RuleVersion(0)
  public statement(): StatementContext {
    const _localctx: StatementContext = new StatementContext(this._ctx, this.state)

    this.enterRule(_localctx, 2, DSLParser.RULE_statement)
    try {
      this.state = 31
      this._errHandler.sync(this)
      switch (this._input.LA(1)) {
      case DSLParser.T__0:
        this.enterOuterAlt(_localctx, 1)
        {
          this.state = 28
          this.varDeclaration()
        }
        break
      case DSLParser.T__2:
        this.enterOuterAlt(_localctx, 2)
        {
          this.state = 29
          this.ifStatement()
        }
        break
      case DSLParser.T__3:
      case DSLParser.ID:
      case DSLParser.NUMBER:
        this.enterOuterAlt(_localctx, 3)
        {
          this.state = 30
          this.expressionStatement()
        }
        break
      default:
        throw new NoViableAltException(this)
      }
    }
    catch (re) {
      if (re instanceof RecognitionException) {
        _localctx.exception = re
        this._errHandler.reportError(this, re)
        this._errHandler.recover(this, re)
      } else {
        throw re
      }
    }
    finally {
      this.exitRule()
    }
    return _localctx
  }
  // @RuleVersion(0)
  public varDeclaration(): VarDeclarationContext {
    const _localctx: VarDeclarationContext = new VarDeclarationContext(this._ctx, this.state)

    this.enterRule(_localctx, 4, DSLParser.RULE_varDeclaration)
    try {
      this.enterOuterAlt(_localctx, 1)
      {
        this.state = 33
        this.match(DSLParser.T__0)
        this.state = 34
        this.match(DSLParser.ID)
        this.state = 35
        this.match(DSLParser.T__1)
        this.state = 36
        this.expression(0)
      }
    }
    catch (re) {
      if (re instanceof RecognitionException) {
        _localctx.exception = re
        this._errHandler.reportError(this, re)
        this._errHandler.recover(this, re)
      } else {
        throw re
      }
    }
    finally {
      this.exitRule()
    }
    return _localctx
  }
  // @RuleVersion(0)
  public ifStatement(): IfStatementContext {
    const _localctx: IfStatementContext = new IfStatementContext(this._ctx, this.state)

    this.enterRule(_localctx, 6, DSLParser.RULE_ifStatement)
    let _la: number

    try {
      let _alt: number

      this.enterOuterAlt(_localctx, 1)
      {
        this.state = 38
        this.match(DSLParser.T__2)
        this.state = 39
        this.match(DSLParser.T__3)
        this.state = 40
        this.expression(0)
        this.state = 41
        this.match(DSLParser.T__4)
        this.state = 42
        this.block()
        this.state = 46
        this._errHandler.sync(this)
        _alt = this.interpreter.adaptivePredict(this._input, 2, this._ctx)
        while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
          if (_alt === 1) {
            {
              {
                this.state = 43
                this.elseIfClause()
              }
            }
          }
          this.state = 48
          this._errHandler.sync(this)
          _alt = this.interpreter.adaptivePredict(this._input, 2, this._ctx)
        }
        this.state = 50
        this._errHandler.sync(this)
        _la = this._input.LA(1)
        if (_la === DSLParser.T__5) {
          {
            this.state = 49
            this.elseClause()
          }
        }
      }
    }
    catch (re) {
      if (re instanceof RecognitionException) {
        _localctx.exception = re
        this._errHandler.reportError(this, re)
        this._errHandler.recover(this, re)
      } else {
        throw re
      }
    }
    finally {
      this.exitRule()
    }
    return _localctx
  }
  // @RuleVersion(0)
  public elseIfClause(): ElseIfClauseContext {
    const _localctx: ElseIfClauseContext = new ElseIfClauseContext(this._ctx, this.state)

    this.enterRule(_localctx, 8, DSLParser.RULE_elseIfClause)
    try {
      this.enterOuterAlt(_localctx, 1)
      {
        this.state = 52
        this.match(DSLParser.T__5)
        this.state = 53
        this.match(DSLParser.T__2)
        this.state = 54
        this.match(DSLParser.T__3)
        this.state = 55
        this.expression(0)
        this.state = 56
        this.match(DSLParser.T__4)
        this.state = 57
        this.block()
      }
    }
    catch (re) {
      if (re instanceof RecognitionException) {
        _localctx.exception = re
        this._errHandler.reportError(this, re)
        this._errHandler.recover(this, re)
      } else {
        throw re
      }
    }
    finally {
      this.exitRule()
    }
    return _localctx
  }
  // @RuleVersion(0)
  public elseClause(): ElseClauseContext {
    const _localctx: ElseClauseContext = new ElseClauseContext(this._ctx, this.state)

    this.enterRule(_localctx, 10, DSLParser.RULE_elseClause)
    try {
      this.enterOuterAlt(_localctx, 1)
      {
        this.state = 59
        this.match(DSLParser.T__5)
        this.state = 60
        this.block()
      }
    }
    catch (re) {
      if (re instanceof RecognitionException) {
        _localctx.exception = re
        this._errHandler.reportError(this, re)
        this._errHandler.recover(this, re)
      } else {
        throw re
      }
    }
    finally {
      this.exitRule()
    }
    return _localctx
  }
  // @RuleVersion(0)
  public block(): BlockContext {
    const _localctx: BlockContext = new BlockContext(this._ctx, this.state)

    this.enterRule(_localctx, 12, DSLParser.RULE_block)
    let _la: number

    try {
      this.enterOuterAlt(_localctx, 1)
      {
        this.state = 62
        this.match(DSLParser.T__6)
        this.state = 66
        this._errHandler.sync(this)
        _la = this._input.LA(1)
        while ((((_la) & ~0x1F) === 0 && ((1 << _la) & ((1 << DSLParser.T__0) | (1 << DSLParser.T__2) | (1 << DSLParser.T__3) | (1 << DSLParser.ID) | (1 << DSLParser.NUMBER))) !== 0)) {
          {
            {
              this.state = 63
              this.statement()
            }
          }
          this.state = 68
          this._errHandler.sync(this)
          _la = this._input.LA(1)
        }
        this.state = 69
        this.match(DSLParser.T__7)
      }
    }
    catch (re) {
      if (re instanceof RecognitionException) {
        _localctx.exception = re
        this._errHandler.reportError(this, re)
        this._errHandler.recover(this, re)
      } else {
        throw re
      }
    }
    finally {
      this.exitRule()
    }
    return _localctx
  }
  // @RuleVersion(0)
  public expressionStatement(): ExpressionStatementContext {
    const _localctx: ExpressionStatementContext = new ExpressionStatementContext(this._ctx, this.state)

    this.enterRule(_localctx, 14, DSLParser.RULE_expressionStatement)
    try {
      this.enterOuterAlt(_localctx, 1)
      {
        this.state = 71
        this.expression(0)
      }
    }
    catch (re) {
      if (re instanceof RecognitionException) {
        _localctx.exception = re
        this._errHandler.reportError(this, re)
        this._errHandler.recover(this, re)
      } else {
        throw re
      }
    }
    finally {
      this.exitRule()
    }
    return _localctx
  }

  public expression(): ExpressionContext
  public expression(_p: number): ExpressionContext
  // @RuleVersion(0)
  public expression(_p?: number): ExpressionContext {
    if (_p === undefined) {
      _p = 0
    }

    const _parentctx: ParserRuleContext = this._ctx
    const _parentState: number = this.state
    let _localctx: ExpressionContext = new ExpressionContext(this._ctx, _parentState)
    let _prevctx: ExpressionContext = _localctx
    const _startState = 16

    this.enterRecursionRule(_localctx, 16, DSLParser.RULE_expression, _p)
    let _la: number

    try {
      let _alt: number

      this.enterOuterAlt(_localctx, 1)
      {
        this.state = 79
        this._errHandler.sync(this)
        switch (this._input.LA(1)) {
        case DSLParser.ID:
        case DSLParser.NUMBER:
          {
            _localctx = new PrimaryExprContext(_localctx)
            this._ctx = _localctx
            _prevctx = _localctx

            this.state = 74
            this.primary()
          }
          break
        case DSLParser.T__3:
          {
            _localctx = new ParenExprContext(_localctx)
            this._ctx = _localctx
            _prevctx = _localctx
            this.state = 75
            this.match(DSLParser.T__3)
            this.state = 76
            this.expression(0)
            this.state = 77
            this.match(DSLParser.T__4)
          }
          break
        default:
          throw new NoViableAltException(this)
        }
        this._ctx._stop = this._input.tryLT(-1)
        this.state = 92
        this._errHandler.sync(this)
        _alt = this.interpreter.adaptivePredict(this._input, 7, this._ctx)
        while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
          if (_alt === 1) {
            if (this._parseListeners != null) {
              this.triggerExitRuleEvent()
            }
            _prevctx = _localctx
            {
              this.state = 90
              this._errHandler.sync(this)
              switch (this.interpreter.adaptivePredict(this._input, 6, this._ctx)) {
              case 1:
                {
                  _localctx = new MulDivExprContext(new ExpressionContext(_parentctx, _parentState))
                  this.pushNewRecursionContext(_localctx, _startState, DSLParser.RULE_expression)
                  this.state = 81
                  if (!(this.precpred(this._ctx, 3))) {
                    throw this.createFailedPredicateException('this.precpred(this._ctx, 3)')
                  }
                  this.state = 82
                  _la = this._input.LA(1)
                  if (!(_la === DSLParser.T__8 || _la === DSLParser.T__9)) {
                    this._errHandler.recoverInline(this)
                  } else {
                    if (this._input.LA(1) === Token.EOF) {
                      this.matchedEOF = true
                    }

                    this._errHandler.reportMatch(this)
                    this.consume()
                  }
                  this.state = 83
                  this.expression(4)
                }
                break

              case 2:
                {
                  _localctx = new AddSubExprContext(new ExpressionContext(_parentctx, _parentState))
                  this.pushNewRecursionContext(_localctx, _startState, DSLParser.RULE_expression)
                  this.state = 84
                  if (!(this.precpred(this._ctx, 2))) {
                    throw this.createFailedPredicateException('this.precpred(this._ctx, 2)')
                  }
                  this.state = 85
                  _la = this._input.LA(1)
                  if (!(_la === DSLParser.T__10 || _la === DSLParser.T__11)) {
                    this._errHandler.recoverInline(this)
                  } else {
                    if (this._input.LA(1) === Token.EOF) {
                      this.matchedEOF = true
                    }

                    this._errHandler.reportMatch(this)
                    this.consume()
                  }
                  this.state = 86
                  this.expression(3)
                }
                break

              case 3:
                {
                  _localctx = new ComparisonExprContext(new ExpressionContext(_parentctx, _parentState))
                  this.pushNewRecursionContext(_localctx, _startState, DSLParser.RULE_expression)
                  this.state = 87
                  if (!(this.precpred(this._ctx, 1))) {
                    throw this.createFailedPredicateException('this.precpred(this._ctx, 1)')
                  }
                  this.state = 88
                  _la = this._input.LA(1)
                  if (!((((_la) & ~0x1F) === 0 && ((1 << _la) & ((1 << DSLParser.T__12) | (1 << DSLParser.T__13) | (1 << DSLParser.T__14) | (1 << DSLParser.T__15) | (1 << DSLParser.T__16) | (1 << DSLParser.T__17))) !== 0))) {
                    this._errHandler.recoverInline(this)
                  } else {
                    if (this._input.LA(1) === Token.EOF) {
                      this.matchedEOF = true
                    }

                    this._errHandler.reportMatch(this)
                    this.consume()
                  }
                  this.state = 89
                  this.expression(2)
                }
                break
              }
            }
          }
          this.state = 94
          this._errHandler.sync(this)
          _alt = this.interpreter.adaptivePredict(this._input, 7, this._ctx)
        }
      }
    }
    catch (re) {
      if (re instanceof RecognitionException) {
        _localctx.exception = re
        this._errHandler.reportError(this, re)
        this._errHandler.recover(this, re)
      } else {
        throw re
      }
    }
    finally {
      this.unrollRecursionContexts(_parentctx)
    }
    return _localctx
  }
  // @RuleVersion(0)
  public primary(): PrimaryContext {
    const _localctx: PrimaryContext = new PrimaryContext(this._ctx, this.state)

    this.enterRule(_localctx, 18, DSLParser.RULE_primary)
    let _la: number

    try {
      this.enterOuterAlt(_localctx, 1)
      {
        this.state = 95
        _la = this._input.LA(1)
        if (!(_la === DSLParser.ID || _la === DSLParser.NUMBER)) {
          this._errHandler.recoverInline(this)
        } else {
          if (this._input.LA(1) === Token.EOF) {
            this.matchedEOF = true
          }

          this._errHandler.reportMatch(this)
          this.consume()
        }
      }
    }
    catch (re) {
      if (re instanceof RecognitionException) {
        _localctx.exception = re
        this._errHandler.reportError(this, re)
        this._errHandler.recover(this, re)
      } else {
        throw re
      }
    }
    finally {
      this.exitRule()
    }
    return _localctx
  }

  public sempred(_localctx: RuleContext, ruleIndex: number, predIndex: number): boolean {
    switch (ruleIndex) {
    case 8:
      return this.expression_sempred(_localctx as ExpressionContext, predIndex)
    }
    return true
  }
  private expression_sempred(_localctx: ExpressionContext, predIndex: number): boolean {
    switch (predIndex) {
    case 0:
      return this.precpred(this._ctx, 3)

    case 1:
      return this.precpred(this._ctx, 2)

    case 2:
      return this.precpred(this._ctx, 1)
    }
    return true
  }

  public static readonly _serializedATN: string =
    '\x03\uC91D\uCABA\u058D\uAFBA\u4F53\u0607\uEA8B\uC241\x03\x17d\x04\x02' +
		'\t\x02\x04\x03\t\x03\x04\x04\t\x04\x04\x05\t\x05\x04\x06\t\x06\x04\x07' +
		'\t\x07\x04\b\t\b\x04\t\t\t\x04\n\t\n\x04\v\t\v\x03\x02\x07\x02\x18\n\x02' +
		'\f\x02\x0E\x02\x1B\v\x02\x03\x02\x03\x02\x03\x03\x03\x03\x03\x03\x05\x03' +
		'"\n\x03\x03\x04\x03\x04\x03\x04\x03\x04\x03\x04\x03\x05\x03\x05\x03\x05' +
		'\x03\x05\x03\x05\x03\x05\x07\x05/\n\x05\f\x05\x0E\x052\v\x05\x03\x05\x05' +
		'\x055\n\x05\x03\x06\x03\x06\x03\x06\x03\x06\x03\x06\x03\x06\x03\x06\x03' +
		'\x07\x03\x07\x03\x07\x03\b\x03\b\x07\bC\n\b\f\b\x0E\bF\v\b\x03\b\x03\b' +
		'\x03\t\x03\t\x03\n\x03\n\x03\n\x03\n\x03\n\x03\n\x05\nR\n\n\x03\n\x03' +
		'\n\x03\n\x03\n\x03\n\x03\n\x03\n\x03\n\x03\n\x07\n]\n\n\f\n\x0E\n`\v\n' +
		'\x03\v\x03\v\x03\v\x02\x02\x03\x12\f\x02\x02\x04\x02\x06\x02\b\x02\n\x02' +
		'\f\x02\x0E\x02\x10\x02\x12\x02\x14\x02\x02\x06\x03\x02\v\f\x03\x02\r\x0E' +
		'\x03\x02\x0F\x14\x03\x02\x15\x16\x02c\x02\x19\x03\x02\x02\x02\x04!\x03' +
		'\x02\x02\x02\x06#\x03\x02\x02\x02\b(\x03\x02\x02\x02\n6\x03\x02\x02\x02' +
		'\f=\x03\x02\x02\x02\x0E@\x03\x02\x02\x02\x10I\x03\x02\x02\x02\x12Q\x03' +
		'\x02\x02\x02\x14a\x03\x02\x02\x02\x16\x18\x05\x04\x03\x02\x17\x16\x03' +
		'\x02\x02\x02\x18\x1B\x03\x02\x02\x02\x19\x17\x03\x02\x02\x02\x19\x1A\x03' +
		'\x02\x02\x02\x1A\x1C\x03\x02\x02\x02\x1B\x19\x03\x02\x02\x02\x1C\x1D\x07' +
		'\x02\x02\x03\x1D\x03\x03\x02\x02\x02\x1E"\x05\x06\x04\x02\x1F"\x05\b' +
		'\x05\x02 "\x05\x10\t\x02!\x1E\x03\x02\x02\x02!\x1F\x03\x02\x02\x02! ' +
		'\x03\x02\x02\x02"\x05\x03\x02\x02\x02#$\x07\x03\x02\x02$%\x07\x15\x02' +
		"\x02%&\x07\x04\x02\x02&\'\x05\x12\n\x02\'\x07\x03\x02\x02\x02()\x07\x05" +
		'\x02\x02)*\x07\x06\x02\x02*+\x05\x12\n\x02+,\x07\x07\x02\x02,0\x05\x0E' +
		'\b\x02-/\x05\n\x06\x02.-\x03\x02\x02\x02/2\x03\x02\x02\x020.\x03\x02\x02' +
		'\x0201\x03\x02\x02\x0214\x03\x02\x02\x0220\x03\x02\x02\x0235\x05\f\x07' +
		'\x0243\x03\x02\x02\x0245\x03\x02\x02\x025\t\x03\x02\x02\x0267\x07\b\x02' +
		'\x0278\x07\x05\x02\x0289\x07\x06\x02\x029:\x05\x12\n\x02:;\x07\x07\x02' +
		'\x02;<\x05\x0E\b\x02<\v\x03\x02\x02\x02=>\x07\b\x02\x02>?\x05\x0E\b\x02' +
		'?\r\x03\x02\x02\x02@D\x07\t\x02\x02AC\x05\x04\x03\x02BA\x03\x02\x02\x02' +
		'CF\x03\x02\x02\x02DB\x03\x02\x02\x02DE\x03\x02\x02\x02EG\x03\x02\x02\x02' +
		'FD\x03\x02\x02\x02GH\x07\n\x02\x02H\x0F\x03\x02\x02\x02IJ\x05\x12\n\x02' +
		'J\x11\x03\x02\x02\x02KL\b\n\x01\x02LR\x05\x14\v\x02MN\x07\x06\x02\x02' +
		'NO\x05\x12\n\x02OP\x07\x07\x02\x02PR\x03\x02\x02\x02QK\x03\x02\x02\x02' +
		'QM\x03\x02\x02\x02R^\x03\x02\x02\x02ST\f\x05\x02\x02TU\t\x02\x02\x02U' +
		']\x05\x12\n\x06VW\f\x04\x02\x02WX\t\x03\x02\x02X]\x05\x12\n\x05YZ\f\x03' +
		'\x02\x02Z[\t\x04\x02\x02[]\x05\x12\n\x04\\S\x03\x02\x02\x02\\V\x03\x02' +
		'\x02\x02\\Y\x03\x02\x02\x02]`\x03\x02\x02\x02^\\\x03\x02\x02\x02^_\x03' +
		'\x02\x02\x02_\x13\x03\x02\x02\x02`^\x03\x02\x02\x02ab\t\x05\x02\x02b\x15' +
		'\x03\x02\x02\x02\n\x19!04DQ\\^'
  public static __ATN: ATN
  public static get _ATN(): ATN {
    if (!DSLParser.__ATN) {
      DSLParser.__ATN = new ATNDeserializer().deserialize(Utils.toCharArray(DSLParser._serializedATN))
    }

    return DSLParser.__ATN
  }
}

export class ProgramContext extends ParserRuleContext {
  public EOF(): TerminalNode { return this.getToken(DSLParser.EOF, 0) }
  public statement(): StatementContext[]
  public statement(i: number): StatementContext
  public statement(i?: number): StatementContext | StatementContext[] {
    if (i === undefined) {
      return this.getRuleContexts(StatementContext)
    }
    return this.getRuleContext(i, StatementContext)
  }
  constructor(parent: ParserRuleContext | undefined, invokingState: number) {
    super(parent, invokingState)
  }
  // @Override
  public get ruleIndex(): number { return DSLParser.RULE_program }
  // @Override
  public enterRule(listener: DSLListener): void {
    if (listener.enterProgram) {
      listener.enterProgram(this)
    }
  }
  // @Override
  public exitRule(listener: DSLListener): void {
    if (listener.exitProgram) {
      listener.exitProgram(this)
    }
  }
  // @Override
  public accept<Result>(visitor: DSLVisitor<Result>): Result {
    if (visitor.visitProgram) {
      return visitor.visitProgram(this)
    }
    return visitor.visitChildren(this)
  }
}

export class StatementContext extends ParserRuleContext {
  public varDeclaration(): VarDeclarationContext | undefined {
    return this.tryGetRuleContext(0, VarDeclarationContext)
  }
  public ifStatement(): IfStatementContext | undefined {
    return this.tryGetRuleContext(0, IfStatementContext)
  }
  public expressionStatement(): ExpressionStatementContext | undefined {
    return this.tryGetRuleContext(0, ExpressionStatementContext)
  }
  constructor(parent: ParserRuleContext | undefined, invokingState: number) {
    super(parent, invokingState)
  }
  // @Override
  public get ruleIndex(): number { return DSLParser.RULE_statement }
  // @Override
  public enterRule(listener: DSLListener): void {
    if (listener.enterStatement) {
      listener.enterStatement(this)
    }
  }
  // @Override
  public exitRule(listener: DSLListener): void {
    if (listener.exitStatement) {
      listener.exitStatement(this)
    }
  }
  // @Override
  public accept<Result>(visitor: DSLVisitor<Result>): Result {
    if (visitor.visitStatement) {
      return visitor.visitStatement(this)
    }
    return visitor.visitChildren(this)
  }
}

export class VarDeclarationContext extends ParserRuleContext {
  public ID(): TerminalNode { return this.getToken(DSLParser.ID, 0) }
  public expression(): ExpressionContext {
    return this.getRuleContext(0, ExpressionContext)
  }
  constructor(parent: ParserRuleContext | undefined, invokingState: number) {
    super(parent, invokingState)
  }
  // @Override
  public get ruleIndex(): number { return DSLParser.RULE_varDeclaration }
  // @Override
  public enterRule(listener: DSLListener): void {
    if (listener.enterVarDeclaration) {
      listener.enterVarDeclaration(this)
    }
  }
  // @Override
  public exitRule(listener: DSLListener): void {
    if (listener.exitVarDeclaration) {
      listener.exitVarDeclaration(this)
    }
  }
  // @Override
  public accept<Result>(visitor: DSLVisitor<Result>): Result {
    if (visitor.visitVarDeclaration) {
      return visitor.visitVarDeclaration(this)
    }
    return visitor.visitChildren(this)
  }
}

export class IfStatementContext extends ParserRuleContext {
  public expression(): ExpressionContext {
    return this.getRuleContext(0, ExpressionContext)
  }
  public block(): BlockContext {
    return this.getRuleContext(0, BlockContext)
  }
  public elseIfClause(): ElseIfClauseContext[]
  public elseIfClause(i: number): ElseIfClauseContext
  public elseIfClause(i?: number): ElseIfClauseContext | ElseIfClauseContext[] {
    if (i === undefined) {
      return this.getRuleContexts(ElseIfClauseContext)
    }
    return this.getRuleContext(i, ElseIfClauseContext)
  }
  public elseClause(): ElseClauseContext | undefined {
    return this.tryGetRuleContext(0, ElseClauseContext)
  }
  constructor(parent: ParserRuleContext | undefined, invokingState: number) {
    super(parent, invokingState)
  }
  // @Override
  public get ruleIndex(): number { return DSLParser.RULE_ifStatement }
  // @Override
  public enterRule(listener: DSLListener): void {
    if (listener.enterIfStatement) {
      listener.enterIfStatement(this)
    }
  }
  // @Override
  public exitRule(listener: DSLListener): void {
    if (listener.exitIfStatement) {
      listener.exitIfStatement(this)
    }
  }
  // @Override
  public accept<Result>(visitor: DSLVisitor<Result>): Result {
    if (visitor.visitIfStatement) {
      return visitor.visitIfStatement(this)
    }
    return visitor.visitChildren(this)
  }
}

export class ElseIfClauseContext extends ParserRuleContext {
  public expression(): ExpressionContext {
    return this.getRuleContext(0, ExpressionContext)
  }
  public block(): BlockContext {
    return this.getRuleContext(0, BlockContext)
  }
  constructor(parent: ParserRuleContext | undefined, invokingState: number) {
    super(parent, invokingState)
  }
  // @Override
  public get ruleIndex(): number { return DSLParser.RULE_elseIfClause }
  // @Override
  public enterRule(listener: DSLListener): void {
    if (listener.enterElseIfClause) {
      listener.enterElseIfClause(this)
    }
  }
  // @Override
  public exitRule(listener: DSLListener): void {
    if (listener.exitElseIfClause) {
      listener.exitElseIfClause(this)
    }
  }
  // @Override
  public accept<Result>(visitor: DSLVisitor<Result>): Result {
    if (visitor.visitElseIfClause) {
      return visitor.visitElseIfClause(this)
    }
    return visitor.visitChildren(this)
  }
}

export class ElseClauseContext extends ParserRuleContext {
  public block(): BlockContext {
    return this.getRuleContext(0, BlockContext)
  }
  constructor(parent: ParserRuleContext | undefined, invokingState: number) {
    super(parent, invokingState)
  }
  // @Override
  public get ruleIndex(): number { return DSLParser.RULE_elseClause }
  // @Override
  public enterRule(listener: DSLListener): void {
    if (listener.enterElseClause) {
      listener.enterElseClause(this)
    }
  }
  // @Override
  public exitRule(listener: DSLListener): void {
    if (listener.exitElseClause) {
      listener.exitElseClause(this)
    }
  }
  // @Override
  public accept<Result>(visitor: DSLVisitor<Result>): Result {
    if (visitor.visitElseClause) {
      return visitor.visitElseClause(this)
    }
    return visitor.visitChildren(this)
  }
}

export class BlockContext extends ParserRuleContext {
  public statement(): StatementContext[]
  public statement(i: number): StatementContext
  public statement(i?: number): StatementContext | StatementContext[] {
    if (i === undefined) {
      return this.getRuleContexts(StatementContext)
    }
    return this.getRuleContext(i, StatementContext)
  }
  constructor(parent: ParserRuleContext | undefined, invokingState: number) {
    super(parent, invokingState)
  }
  // @Override
  public get ruleIndex(): number { return DSLParser.RULE_block }
  // @Override
  public enterRule(listener: DSLListener): void {
    if (listener.enterBlock) {
      listener.enterBlock(this)
    }
  }
  // @Override
  public exitRule(listener: DSLListener): void {
    if (listener.exitBlock) {
      listener.exitBlock(this)
    }
  }
  // @Override
  public accept<Result>(visitor: DSLVisitor<Result>): Result {
    if (visitor.visitBlock) {
      return visitor.visitBlock(this)
    }
    return visitor.visitChildren(this)
  }
}

export class ExpressionStatementContext extends ParserRuleContext {
  public expression(): ExpressionContext {
    return this.getRuleContext(0, ExpressionContext)
  }
  constructor(parent: ParserRuleContext | undefined, invokingState: number) {
    super(parent, invokingState)
  }
  // @Override
  public get ruleIndex(): number { return DSLParser.RULE_expressionStatement }
  // @Override
  public enterRule(listener: DSLListener): void {
    if (listener.enterExpressionStatement) {
      listener.enterExpressionStatement(this)
    }
  }
  // @Override
  public exitRule(listener: DSLListener): void {
    if (listener.exitExpressionStatement) {
      listener.exitExpressionStatement(this)
    }
  }
  // @Override
  public accept<Result>(visitor: DSLVisitor<Result>): Result {
    if (visitor.visitExpressionStatement) {
      return visitor.visitExpressionStatement(this)
    }
    return visitor.visitChildren(this)
  }
}

export class ExpressionContext extends ParserRuleContext {
  constructor(parent: ParserRuleContext | undefined, invokingState: number) {
    super(parent, invokingState)
  }
  // @Override
  public get ruleIndex(): number { return DSLParser.RULE_expression }
  public copyFrom(ctx: ExpressionContext): void {
    super.copyFrom(ctx)
  }
}
export class PrimaryExprContext extends ExpressionContext {
  public primary(): PrimaryContext {
    return this.getRuleContext(0, PrimaryContext)
  }
  constructor(ctx: ExpressionContext) {
    super(ctx.parent, ctx.invokingState)
    this.copyFrom(ctx)
  }
  // @Override
  public enterRule(listener: DSLListener): void {
    if (listener.enterPrimaryExpr) {
      listener.enterPrimaryExpr(this)
    }
  }
  // @Override
  public exitRule(listener: DSLListener): void {
    if (listener.exitPrimaryExpr) {
      listener.exitPrimaryExpr(this)
    }
  }
  // @Override
  public accept<Result>(visitor: DSLVisitor<Result>): Result {
    if (visitor.visitPrimaryExpr) {
      return visitor.visitPrimaryExpr(this)
    }
    return visitor.visitChildren(this)
  }
}
export class ParenExprContext extends ExpressionContext {
  public expression(): ExpressionContext {
    return this.getRuleContext(0, ExpressionContext)
  }
  constructor(ctx: ExpressionContext) {
    super(ctx.parent, ctx.invokingState)
    this.copyFrom(ctx)
  }
  // @Override
  public enterRule(listener: DSLListener): void {
    if (listener.enterParenExpr) {
      listener.enterParenExpr(this)
    }
  }
  // @Override
  public exitRule(listener: DSLListener): void {
    if (listener.exitParenExpr) {
      listener.exitParenExpr(this)
    }
  }
  // @Override
  public accept<Result>(visitor: DSLVisitor<Result>): Result {
    if (visitor.visitParenExpr) {
      return visitor.visitParenExpr(this)
    }
    return visitor.visitChildren(this)
  }
}
export class MulDivExprContext extends ExpressionContext {
  public expression(): ExpressionContext[]
  public expression(i: number): ExpressionContext
  public expression(i?: number): ExpressionContext | ExpressionContext[] {
    if (i === undefined) {
      return this.getRuleContexts(ExpressionContext)
    }
    return this.getRuleContext(i, ExpressionContext)
  }
  constructor(ctx: ExpressionContext) {
    super(ctx.parent, ctx.invokingState)
    this.copyFrom(ctx)
  }
  // @Override
  public enterRule(listener: DSLListener): void {
    if (listener.enterMulDivExpr) {
      listener.enterMulDivExpr(this)
    }
  }
  // @Override
  public exitRule(listener: DSLListener): void {
    if (listener.exitMulDivExpr) {
      listener.exitMulDivExpr(this)
    }
  }
  // @Override
  public accept<Result>(visitor: DSLVisitor<Result>): Result {
    if (visitor.visitMulDivExpr) {
      return visitor.visitMulDivExpr(this)
    }
    return visitor.visitChildren(this)
  }
}
export class AddSubExprContext extends ExpressionContext {
  public expression(): ExpressionContext[]
  public expression(i: number): ExpressionContext
  public expression(i?: number): ExpressionContext | ExpressionContext[] {
    if (i === undefined) {
      return this.getRuleContexts(ExpressionContext)
    }
    return this.getRuleContext(i, ExpressionContext)
  }
  constructor(ctx: ExpressionContext) {
    super(ctx.parent, ctx.invokingState)
    this.copyFrom(ctx)
  }
  // @Override
  public enterRule(listener: DSLListener): void {
    if (listener.enterAddSubExpr) {
      listener.enterAddSubExpr(this)
    }
  }
  // @Override
  public exitRule(listener: DSLListener): void {
    if (listener.exitAddSubExpr) {
      listener.exitAddSubExpr(this)
    }
  }
  // @Override
  public accept<Result>(visitor: DSLVisitor<Result>): Result {
    if (visitor.visitAddSubExpr) {
      return visitor.visitAddSubExpr(this)
    }
    return visitor.visitChildren(this)
  }
}
export class ComparisonExprContext extends ExpressionContext {
  public expression(): ExpressionContext[]
  public expression(i: number): ExpressionContext
  public expression(i?: number): ExpressionContext | ExpressionContext[] {
    if (i === undefined) {
      return this.getRuleContexts(ExpressionContext)
    }
    return this.getRuleContext(i, ExpressionContext)
  }
  constructor(ctx: ExpressionContext) {
    super(ctx.parent, ctx.invokingState)
    this.copyFrom(ctx)
  }
  // @Override
  public enterRule(listener: DSLListener): void {
    if (listener.enterComparisonExpr) {
      listener.enterComparisonExpr(this)
    }
  }
  // @Override
  public exitRule(listener: DSLListener): void {
    if (listener.exitComparisonExpr) {
      listener.exitComparisonExpr(this)
    }
  }
  // @Override
  public accept<Result>(visitor: DSLVisitor<Result>): Result {
    if (visitor.visitComparisonExpr) {
      return visitor.visitComparisonExpr(this)
    }
    return visitor.visitChildren(this)
  }
}

export class PrimaryContext extends ParserRuleContext {
  public ID(): TerminalNode | undefined { return this.tryGetToken(DSLParser.ID, 0) }
  public NUMBER(): TerminalNode | undefined { return this.tryGetToken(DSLParser.NUMBER, 0) }
  constructor(parent: ParserRuleContext | undefined, invokingState: number) {
    super(parent, invokingState)
  }
  // @Override
  public get ruleIndex(): number { return DSLParser.RULE_primary }
  // @Override
  public enterRule(listener: DSLListener): void {
    if (listener.enterPrimary) {
      listener.enterPrimary(this)
    }
  }
  // @Override
  public exitRule(listener: DSLListener): void {
    if (listener.exitPrimary) {
      listener.exitPrimary(this)
    }
  }
  // @Override
  public accept<Result>(visitor: DSLVisitor<Result>): Result {
    if (visitor.visitPrimary) {
      return visitor.visitPrimary(this)
    }
    return visitor.visitChildren(this)
  }
}


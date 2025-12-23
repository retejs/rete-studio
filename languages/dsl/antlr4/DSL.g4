grammar DSL;

program: statement* EOF;

statement
    : varDeclaration
    | ifStatement
    | expressionStatement
    ;

varDeclaration
    : 'let' ID '=' expression
    ;

ifStatement
    : 'if' '(' expression ')' block elseIfClause* elseClause?
    ;

elseIfClause
    : 'else' 'if' '(' expression ')' block
    ;

elseClause
    : 'else' block
    ;

block
    : '{' statement* '}'
    ;

expressionStatement
    : expression
    ;

expression
    : primary                                                          # PrimaryExpr
    | '(' expression ')'                                               # ParenExpr
    | expression ('*' | '/') expression                                # MulDivExpr
    | expression ('+' | '-') expression                                # AddSubExpr
    | expression ('>' | '<' | '>=' | '<=' | '==' | '!=') expression   # ComparisonExpr
    ;

primary
    : ID
    | NUMBER
    ;

ID     : [a-zA-Z_][a-zA-Z_0-9]* ;
NUMBER : [0-9]+ ('.' [0-9]+)? ;
WS     : [ \t\r\n]+ -> skip ;
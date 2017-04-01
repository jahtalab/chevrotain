const chevrotain = require("chevrotain")
const Lexer = require('coffeescript/lib/coffeescript/lexer').Lexer
const Parser = chevrotain.Parser

lexer = new Lexer

const coffeeNameToTokenName = {}
const tokenVocabulary = {}
const allTokens = []
// a little utility to reduce duplication
const createToken = function createTokenWrapper(options) {
    options.pattern = chevrotain.Lexer.NA
    // usage of the official createToken API.
    let newTokenType = chevrotain.createToken(options)
    allTokens.push(newTokenType)
    tokenVocabulary[options.name] = newTokenType

    let coffeeName = options.coffeeName ? options.coffeeName : options.name
    coffeeNameToTokenName[coffeeName] = options.name

    return newTokenType
}

function convertCoffeeTokensToChevrotain(tokenVector) {
    return tokenVector.map((coffeeToken) => {
        let chevrotainName = coffeeNameToTokenName[coffeeToken[0]]
        let chevrotainTokenClass = tokenVocabulary[chevrotainName]
        let posInfo = coffeeToken[2]
        return {
            image:       coffeeToken[1],
            startLine:   posInfo.first_line,
            endLine:     posInfo.last_line,
            startColumn: posInfo.first_column,
            endColumn:   posInfo.last_column,
            tokenType:   chevrotainTokenClass.tokenType,
        }
    })
}

const TERMINATOR = createToken({name: "TERMINATOR"})
const STATEMENT = createToken({name: "STATEMENT"})
const YIELD = createToken({name: "YIELD"})
const FROM = createToken({name: "FROM"})
const INDENT = createToken({name: "INDENT"})
const OUTDENT = createToken({name: "OUTDENT"})
const IDENTIFIER = createToken({name: "IDENTIFIER"})
const PROPERTY = createToken({name: "PROPERTY"})
const NUMBER = createToken({name: "NUMBER"})
const STRING = createToken({name: "STRING"})
const STRING_START = createToken({name: "STRING_START"})
const STRING_END = createToken({name: "STRING_END"})
const REGEX = createToken({name: "REGEX"})
const REGEX_START = createToken({name: "REGEX_START"})
const REGEX_END = createToken({name: "REGEX_END"})
const UNDEFINED = createToken({name: "UNDEFINED"})
const NULL = createToken({name: "NULL"})
const BOOL = createToken({name: "BOOL"})
const INFINITY = createToken({name: "INFINITY"})
const NAN = createToken({name: "NAN"})
const RETURN = createToken({name: "RETURN"})
const AWAIT = createToken({name: "AWAIT"})
const HERECOMMENT = createToken({name: "HERECOMMENT"})
const PARAM_START = createToken({name: "PARAM_START"})
const PARAM_END = createToken({name: "PARAM_END"})
const LEAN_ARROW = createToken({name: "LEAN_ARROW", coffeeName: "->"})
const FAT_ARROW = createToken({name: "FAT_ARROW", coffeeName: "=>"})
const COMMA = createToken({name: "COMMA", coffeeName: ","})
const SUPER = createToken({name: "SUPER"})
const INDEX_START = createToken({name: "INDEX_START"})
const INDEX_END = createToken({name: "INDEX_END"})
const INDEX_SOAK = createToken({name: "INDEX_SOAK"})
const DOT = createToken({name: "DOT", coffeeName: "."})
const QUESTION_DOT = createToken({name: "QUESTION_DOT", coffeeName: "?."})
const COLON = createToken({name: "COLON", coffeeName: ":"})
const COLON_COLON = createToken({name: "COLON_COLON", coffeeName: "::"})
const QUESTION_COLON = createToken({name: "QUESTION_COLON", coffeeName: "?:"})
const QUESTION_COLON_COLON = createToken({name: "QUESTION_COLON_COLON", coffeeName: "?::"})
const DOT_DOT_DOT = createToken({name: "DOT_DOT_DOT", coffeeName: "..."})
const CLASS = createToken({name: "CLASS"})
const EXTENDS = createToken({name: "EXTENDS"})
const IMPORT = createToken({name: "IMPORT"})
const LEFT_CURLY_BRACKETS = createToken({name: "LEFT_CURLY_BRACKETS", coffeeName: "{"})
const RIGHT_CURLY_BRACKETS = createToken({name: "RIGHT_CURLY_BRACKETS", coffeeName: "}"})
const DEFAULT = createToken({name: "DEFAULT"})
const AS = createToken({name: "AS"})
const IMPORT_ALL = createToken({name: "IMPORT_ALL"})
const EXPORT = createToken({name: "EXPORT"})
const EQUALS = createToken({name: "EQUALS", coffeeName: "="})
const EXPORT_ALL = createToken({name: "EXPORT_ALL"})
const FUNC_EXIST = createToken({name: "FUNC_EXIST"})
const CALL_START = createToken({name: "CALL_START"})
const CALL_END = createToken({name: "CALL_END"})
const THIS = createToken({name: "THIS"})
const AT = createToken({name: "AT", coffeeName: "@"})
const LEFT_SQUARE_BRACKETS = createToken({name: "LEFT_SQUARE_BRACKETS", coffeeName: "["})
const RIGHT_SQUARE_BRACKETS = createToken({name: "RIGHT_SQUARE_BRACKETS", coffeeName: "]"})
const DOT_DOT = createToken({name: "DOT_DOT", coffeeName: ".."})
const TRY = createToken({name: "TRY"})
const CATCH = createToken({name: "CATCH"})
const FINALLY = createToken({name: "FINALLY"})
const THROW = createToken({name: "THROW"})
const LEFT_PARENTHESIS = createToken({name: "LEFT_PARENTHESIS", coffeeName: "("})
const RIGHT_PARENTHESIS = createToken({name: "RIGHT_PARENTHESIS", coffeeName: ")"})
const WHILE = createToken({name: "WHILE"})
const UNTIL = createToken({name: "UNTIL"})
const WHEN = createToken({name: "WHEN"})
const LOOP = createToken({name: "LOOP"})
const FOR = createToken({name: "FOR"})
const BY = createToken({name: "BY"})
const OWN = createToken({name: "OWN"})
const FORIN = createToken({name: "FORIN"})
const FOROF = createToken({name: "FOROF"})
const FORFROM = createToken({name: "FORFROM"})
const SWITCH = createToken({name: "SWITCH"})
const ELSE = createToken({name: "ELSE"})
const LEADING_WHEN = createToken({name: "LEADING_WHEN"})
const IF = createToken({name: "IF"})
const POST_IF = createToken({name: "POST_IF"})
const UNARY = createToken({name: "UNARY"})
const UNARY_MATH = createToken({name: "UNARY_MATH"})
const MINUS = createToken({name: "MINUS", coffeeName: "-"})
const PLUS = createToken({name: "PLUS", coffeeName: "+"})
const MINUS_MINUS = createToken({name: "MINUS_MINUS", coffeeName: "--"})
const PLUS_PLUS = createToken({name: "PLUS_PLUS", coffeeName: "++"})
const QUESTION = createToken({name: "QUESTION", coffeeName: "?"})
const MATH = createToken({name: "MATH"})
const STAR_STAR = createToken({name: "STAR_STAR", coffeeName: "**"})
const SHIFT = createToken({name: "SHIFT"})
const COMPARE = createToken({name: "COMPARE"})
const AMPERSAND = createToken({name: "AMPERSAND", coffeeName: "&"})
const CARET = createToken({name: "CARET", coffeeName: "^"})
const VERTICAL_LINE = createToken({name: "VERTICAL_LINE", coffeeName: "|"})
const AMPERSAND_AMPERSAND = createToken({name: "AMPERSAND_AMPERSAND", coffeeName: "&&"})
const DOUBLE_VERTICAL_LINE = createToken({name: "DOUBLE_VERTICAL_LINE", coffeeName: "||"})
const BIN = createToken({name: "BIN"})
const RELATION = createToken({name: "RELATION"})
const COMPOUND_ASSIGN = createToken({name: "COMPOUND_ASSIGN"})
const JS = createToken({name: "JS"})

var tokens = lexer.tokenize(`
class True extends Token
  @PATTERN: -> /true/
`)

let chevTokens = convertCoffeeTokensToChevrotain(tokens)
var x = 5

class CoffeeScriptParser extends chevrotain.Parser {

    // Unfortunately no support for class fields with initializer in ES2015, only in ES2016...
    // so the parsing rules are defined inside the constructor, as each parsing rule must be initialized by
    // invoking RULE(...)
    // see: https://github.com/jeffmo/es-class-fields-and-static-properties
    constructor(input) {
        super(input, tokenVocabulary)

        const $ = this

        $.RULE("Root", () => {
            $.OR([
                {ALT: () => { $.SUBRULE($.Body)}},
                {ALT: EMPTY_ALT("EMPTY_ALT")}
            ])
        })

        $.RULE("Body", () => {
            $.SUBRULE($.Line)

            $.MANY(() => {
                $.CONSUME(TERMINATOR)
                $.SUBRULE2($.Line)
            })

            $.OPTION(() => {
                $.CONSUME2(TERMINATOR)
            })
        })

        $.RULE("Line", () => {
            $.OR([
                {ALT: () => { $.SUBRULE($.Expression)}},
                // {ALT: () => { $.SUBRULE($.Statement)}},
                // {ALT: () => { $.SUBRULE($.FuncDirective)}}
            ])
        })

        $.RULE("FuncDirective", () => {
        })

        $.RULE("Statement", () => {
        })


        $.RULE("Expression2", () => {
            $.SUBRULE($.PrefixExp)
            $.MANY(() => {
                $.SUBRULE($.Operator)
                $.SUBRULE2($.PrefixExp)
            })
        })

        $.RULE("PrefixExp", () => {
            $.OPTION(() => {
                $.SUBRULE($.PrefixPart)
            })
            $.SUBRULE($.PostfixExp)
        })

        $.RULE("ExpPrefix", () => {
            $.MANY(() => {
                $.OR([
                    {ALT: () => { $.CONSUME(UNARY)}},
                    {ALT: () => { $.CONSUME(UNARY_MATH)}},
                    {ALT: () => { $.CONSUME(PLUS)}},
                    {ALT: () => { $.CONSUME(MINUS)}},
                    {ALT: () => { $.CONSUME(AWAIT)}},
                ])
            })

            $.OR2([
                {ALT: () => { $.CONSUME(MINUS_MINUS)}},
                {ALT: () => { $.CONSUME(PLUS_PLUS)}},
                {ALT: EMPTY_ALT("EMPTY_ALT")}
            ])
        })


        $.RULE("PostfixExp", () => {
            $.SUBRULE($.AtomicExp)
            $.OPTION(() => {
                $.SUBRULE($.PostfixPart)
            })
        })

        $.RULE("PostfixPart", () => {
        })

        $.RULE("atomicExp", () => {
        })


        $.RULE("Expression", () => {
            $.OR([
                {ALT: () => { $.SUBRULE($.Value)}},
                // Inovcation has been extracted into Value (postfix) and SuperCall
                {ALT: () => { $.SUBRULE($.Code)}},
                // {ALT: () => { $.SUBRULE($.Operation)}},
                // TODO: this looks like a suffix to assign, starts with shared prefix from Value (Assignable)
                // {ALT: () => { $.SUBRULE($.Assign)}},
                // {ALT: () => { $.SUBRULE($.If)}},
                // {ALT: () => { $.SUBRULE($.Try)}},
                // {ALT: () => { $.SUBRULE($.While)}},
                // {ALT: () => { $.SUBRULE($.For)}},
                // {ALT: () => { $.SUBRULE($.Switch)}},
                // {ALT: () => { $.SUBRULE($.Class)}},
                // {ALT: () => { $.SUBRULE($.Throw)}},
                // {ALT: () => { $.SUBRULE($.Yield)}}
            ])
        })

        $.RULE("Yield", () => {
        })

        $.RULE("Block", () => {
        })

        $.RULE("Identifier", () => {
            $.CONSUME(IDENTIFIER)
        })

        $.RULE("Property", () => {
            $.CONSUME(PROPERTY)
        })

        $.RULE("AlphaNumeric", () => {
            $.OR([
                {ALT: () => { $.CONSUME(NUMBER)}},
                {ALT: () => { $.SUBRULE($.String)}},
            ])
        })

        $.RULE("String", () => {
            $.OR([
                {ALT: () => { $.CONSUME(STRING)}},
                {
                    ALT: () => {
                        $.CONSUME(STRING_START)
                        $.SUBRULE($.Body)
                        $.CONSUME(STRING_END)
                    }
                }
            ])
        })

        $.RULE("Regex", () => {
            $.OR([
                {ALT: () => { $.CONSUME(REGEX)}},
                {
                    ALT: () => {
                        $.CONSUME(REGEX_START)
                        // TODO: this was originally invocation
                        // TODO: refactor grammar or verify afterwards?
                        $.SUBRULE($.Value)
                        $.CONSUME(REGEX_END)
                    }
                }
            ])
        })

        $.RULE("Literal", () => {
            $.OR([
                {ALT: () => { $.SUBRULE($.AlphaNumeric)}},
                {ALT: () => { $.CONSUME(JS)}},
                {ALT: () => { $.SUBRULE($.Regex)}},
                {ALT: () => { $.CONSUME(UNDEFINED)}},
                {ALT: () => { $.CONSUME(NULL)}},
                {ALT: () => { $.CONSUME(BOOL)}},
                {ALT: () => { $.CONSUME(INFINITY)}},
                {ALT: () => { $.CONSUME(NAN)}}
            ])
        })

        $.RULE("Assign", () => {
        })

        $.RULE("AssignObj", () => {
        })

        $.RULE("SimpleObjAssignable", () => {
        })

        $.RULE("ObjAssignable", () => {
        })

        $.RULE("Return", () => {
        })

        $.RULE("YieldReturn", () => {
        })

        $.RULE("AwaitReturn", () => {
        })

        $.RULE("Comment", () => {
        })

        $.RULE("Code", () => {
            $.OR([
                {
                    ALT: () => {
                        $.CONSUME(PARAM_START)
                        $.SUBRULE($.ParamList)
                        $.CONSUME(PARAM_END)
                        $.SUBRULE($.FuncGlyph)
                        $.SUBRULE($.Block)
                    }
                },
                {
                    ALT: () => {
                        $.SUBRULE2($.FuncGlyph)
                        $.SUBRULE2($.Block)
                    }
                },
            ])
        })

        $.RULE("FuncGlyph", () => {
            $.OR([
                {ALT: () => { $.CONSUME(LEAN_ARROW)}},
                {ALT: () => { $.CONSUME(FAT_ARROW)}},
            ])
        })

        $.RULE("OptComma", () => {
        })

        $.RULE("ParamList", () => {
            $.OPTION(() => {
                $.SUBRULE($.Param)
                $.MANY(() => {
                    $.OR([
                        {
                            ALT: () => {
                                $.SUBRULE($.ParamSeparator)
                                $.SUBRULE2($.Param)
                            }
                        },
                        {
                            ALT: () => {
                                $.SUBRULE($.OptComma)
                                $.CONSUME(INDENT)
                                $.SUBRULE($.ParamList)
                                $.SUBRULE2($.OptComma)
                                $.CONSUME(OUTDENT)
                            }
                        },
                    ])
                })
            })
        })

        $.RULE("Param", () => {
            $.OR([
                {
                    ALT: () => {
                        $.SUBRULE1($.ParamVar)
                        $.CONSUME(DOT_DOT_DOT)
                    }
                },
                {
                    ALT: () => {
                        $.SUBRULE2($.ParamVar)
                        $.CONSUME(EQUALS)
                        $.SUBRULE3($.Expression)
                    }
                },
                {
                    ALT: () => {
                        $.SUBRULE3($.ParamVar)
                    }
                },
                {
                    ALT: () => {
                        $.CONSUME2(DOT_DOT_DOT)
                    }
                }
            ])
        })

        $.RULE("ParamSeparator", () => {
            $.OR([
                {
                    ALT: () => {
                        $.SUBRULE($.OptComma)
                        $.CONSUME(TERMINATOR)
                    }
                },
                {
                    ALT: () => {
                        $.CONSUME(COMMA)
                    }
                },
            ])
        })

        $.RULE("ParamVar", () => {
            $.OR([
                {ALT: () => { $.SUBRULE($.Identifier)}},
                {ALT: () => { $.SUBRULE($.ThisProperty)}},
                {ALT: () => { $.SUBRULE($.Array)}},
                {ALT: () => { $.SUBRULE($.Object)}}
            ])
        })

        $.RULE("Splat", () => {
        })

        $.RULE("SimpleAssignable", () => {
            $.OR([
                // Note that the jison grammar had more options in simpleAssignable
                // these iterations have been moved up to valuePostfix
                // TODO: a complex SimpleAssignable must end with an accessor
                // TODO: this is no longer part of the grammar and thus a validation must be added.
                {ALT: () => { $.SUBRULE($.SuperCall)}},
                {ALT: () => { $.SUBRULE($.Identifier)}},
                {ALT: () => { $.SUBRULE($.ThisProperty)}}
            ])
        })

        $.RULE("Assignable", () => {
            $.OR([
                {ALT: () => { $.SUBRULE($.SimpleAssignable)}},
                // {ALT: () => { $.SUBRULE($.Array)}},
                // {ALT: () => { $.SUBRULE($.Object)}}
            ])
        })

        $.RULE("Value", () => {
            $.SUBRULE($.ValueItem)
            $.MANY(() => {
                $.SUBRULE($.ValuePostfix)
            })
        })

        $.RULE("ValuePostfix", () => {
            $.OR([
                {ALT: () => { $.SUBRULE($.Accessor)}},
                {
                    ALT: () => {
                        $.SUBRULE($.OptFuncExist)
                        $.OR2([
                            {ALT: () => { $.SUBRULE($.Arguments)}},
                            {ALT: () => { $.SUBRULE($.String)}}
                        ])
                    }
                }
            ])
        })

        $.RULE("ValueItem", () => {
            $.OR([
                {ALT: () => { $.SUBRULE($.Assignable)}},
                {ALT: () => { $.SUBRULE($.Literal)}},
                {ALT: () => { $.SUBRULE($.Parenthetical)}},
                {ALT: () => { $.SUBRULE($.Range)}},
                {ALT: () => { $.SUBRULE($.This)}},
                {ALT: () => { $.SUBRULE($.Super)}}
            ])
        })

        $.RULE("Super", () => {
            $.OR([
                {
                    ALT: () => {
                        $.CONSUME(SUPER)
                        $.CONSUME(DOT)
                        $.SUBRULE($.Property)
                    }
                },
                {
                    ALT: () => {
                        $.CONSUME2(SUPER)
                        $.CONSUME(INDEX_START)
                        $.SUBRULE($.Expression)
                        $.CONSUME(INDEX_END)
                    }
                }
            ])
        })

        $.RULE("Accessor", () => {
            $.OR([
                {
                    ALT: () => {
                        $.CONSUME(DOT)
                        $.SUBRULE($.Property)
                    }
                },
                {
                    ALT: () => {
                        $.CONSUME(QUESTION_COLON)
                        $.SUBRULE2($.Property)
                    }
                },
                {
                    ALT: () => {
                        $.CONSUME2(COLON_COLON)
                        $.SUBRULE3($.Property)
                    }
                },
                {
                    ALT: () => {
                        $.CONSUME(QUESTION_COLON_COLON)
                        $.SUBRULE4($.Property)
                    }
                },
                {ALT: () => { $.CONSUME(COLON_COLON)}},
                {ALT: () => { $.SUBRULE($.Index)}}
            ])
        })

        $.RULE("Index", () => {
            $.OR([
                {
                    ALT: () => {
                        $.CONSUME(INDEX_START)
                        $.SUBRULE($.IndexValue)
                        $.CONSUME(INDEX_END)

                    }
                },
                {
                    ALT: () => {
                        $.CONSUME(INDEX_SOAK)
                        // TODO: replace recursion with iteration?
                        $.SUBRULE($.Index)
                    }
                }
            ])
        })

        $.RULE("IndexValue", () => {
            $.OR([
                {ALT: () => { $.SUBRULE($.Expression)}},
                {ALT: () => { $.SUBRULE($.Slice)}}
            ])
        })

        $.RULE("Object", () => {
            $.CONSUME(LEFT_CURLY_BRACKETS)
            $.SUBRULE($.ArgList)
            $.SUBRULE($.OptComma)
            $.CONSUME(RIGHT_CURLY_BRACKETS)
        })

        $.RULE("AssignList", () => {
        })

        $.RULE("Class", () => {
        })

        $.RULE("Import", () => {
        })

        $.RULE("ImportSpecifierList", () => {
        })

        $.RULE("ImportSpecifier", () => {
        })

        $.RULE("ImportDefaultSpecifier", () => {
        })

        $.RULE("ImportNamespaceSpecifier", () => {
        })

        $.RULE("Export", () => {
        })

        $.RULE("ExportSpecifierList", () => {
        })

        $.RULE("ExportSpecifier", () => {
        })

        $.RULE("SuperCall", () => {
            $.CONSUME(SUPER)
            $.SUBRULE($.OptFuncExist)
            $.SUBRULE($.Arguments)
        })

        $.RULE("OptFuncExist", () => {
        })

        $.RULE("Arguments", () => {
            $.CONSUME(CALL_START)
            $.SUBRULE($.ArgList)
            $.SUBRULE($.OptComma)
            $.CONSUME(CALL_END)
        })

        $.RULE("This", () => {
            $.OR([
                {ALT: () => { $.CONSUME(THIS)}},
                {ALT: () => { $.CONSUME(AMPERSAND)}}
            ])
        })

        $.RULE("ThisProperty", () => {
            $.CONSUME(AMPERSAND)
            $.SUBRULE($.Property)
        })

        $.RULE("Array", () => {
            $.CONSUME(LEFT_SQUARE_BRACKETS)
            $.SUBRULE($.ArgList)
            $.SUBRULE($.OptComma)
            $.CONSUME(RIGHT_SQUARE_BRACKETS)
        })

        $.RULE("RangeDots", () => {
        })

        $.RULE("Range", () => {
            $.CONSUME(LEFT_SQUARE_BRACKETS)
            $.SUBRULE($.Expression)
            $.SUBRULE($.RangeDots)
            $.SUBRULE2($.Expression)
            $.CONSUME(RIGHT_SQUARE_BRACKETS)
        })

        $.RULE("Slice", () => {
        })

        $.RULE("ArgList", () => {
        })

        $.RULE("Arg", () => {
        })

        $.RULE("SimpleArgs", () => {
        })

        $.RULE("Try", () => {
        })

        $.RULE("Catch", () => {
        })

        $.RULE("Throw", () => {
        })

        $.RULE("Parenthetical", () => {
            $.CONSUME(LEFT_CURLY_BRACKETS)
            $.OR([
                {ALT: () => { $.SUBRULE($.Body)}},
                {
                    ALT: () => {
                        $.CONSUME(INDENT)
                        $.SUBRULE2($.Body)
                        $.CONSUME(OUTDENT)
                    }
                }
            ])
            $.CONSUME(RIGHT_CURLY_BRACKETS)
        })

        $.RULE("WhileSource", () => {
        })

        $.RULE("While", () => {
        })

        $.RULE("Loop", () => {
        })

        $.RULE("For", () => {
        })

        $.RULE("ForBody", () => {
        })

        $.RULE("ForStart", () => {
        })

        $.RULE("ForValue", () => {
        })

        $.RULE("ForVariables", () => {
        })

        $.RULE("ForSource", () => {
        })

        $.RULE("Switch", () => {
        })

        $.RULE("Whens", () => {
        })

        $.RULE("When", () => {
        })

        $.RULE("IfBlock", () => {
        })

        $.RULE("If", () => {
        })

        $.RULE("Operation", () => {
        })

        Parser.performSelfAnalysis(this)
    }
}

const parserInstance = new CoffeeScriptParser([])
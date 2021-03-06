import {
    forEach,
    isFunction,
    isRegExp,
    isString,
    keys,
    last,
    map
} from "../../src/utils/utils"
import { createToken, extendToken } from "../../src/scan/tokens_public"
import {
    IMultiModeLexerDefinition,
    Lexer,
    LexerDefinitionErrorType
} from "../../src/scan/lexer_public"
import {
    addStartOfInput,
    analyzeTokenClasses,
    disableSticky,
    enableSticky,
    findDuplicatePatterns,
    findEmptyMatchRegExps,
    findEndOfInputAnchor,
    findInvalidGroupType,
    findInvalidPatterns,
    findMissingPatterns,
    findStartOfInputAnchor,
    findUnsupportedFlags,
    SUPPORT_STICKY
} from "../../src/scan/lexer"
import { setEquality } from "../utils/matchers"
import { tokenStructuredMatcher } from "../../src/scan/tokens"

const ORG_SUPPORT_STICKY = SUPPORT_STICKY
function defineLexerSpecs(
    contextName,
    extendToken,
    tokenMatcher,
    skipValidationChecks = false,
    lexerConfig
) {
    const testFull = lexerConfig.positionTracking === "full"
    const testStart = lexerConfig.positionTracking === "onlyStart" || testFull

    function lexerSpecs() {
        const IntegerTok = extendToken("IntegerTok", /[1-9]\d*/)
        const IdentifierTok = extendToken("IdentifierTok", /[A-Za-z_]\w*/)
        const BambaTok = extendToken("BambaTok", /bamba/)

        BambaTok.LONGER_ALT = IdentifierTok

        let testLexer = new Lexer([BambaTok, IntegerTok, IdentifierTok], {
            positionTracking: "onlyOffset"
        })

        describe("The Chevrotain Lexers", () => {
            it("can create a token from a string with priority to the First Token class with the longest match #1", () => {
                // this can match either IdentifierTok or BambaTok but should match BambaTok has its pattern is defined before IdentifierTok
                let input = "bamba"
                let result = testLexer.tokenize(input)
                expect(tokenMatcher(result.tokens[0], BambaTok)).to.be.true
                expect(result.tokens[0].image).to.equal("bamba")
                expect(result.tokens[0].startOffset).to.equal(0)
            })

            it("can create a token from a string with priority to the First Token class with the longest match #2", () => {
                let input = "bambaMIA"
                let result = testLexer.tokenize(input)
                expect(tokenMatcher(result.tokens[0], IdentifierTok)).to.be.true
                expect(result.tokens[0].image).to.equal("bambaMIA")
                expect(result.tokens[0].startOffset).to.equal(0)
            })

            it("can create a token from a string with priority to the First Token class with the longest match - negative", () => {
                const IntegerTok = extendToken("IntegerTok", /[1-9]\d*/)
                const IdentTok = extendToken("IdentifierTok", /[A-Za-z]+/)
                // a bit contrived to test all code branches, the BambaTok is not actually prefix of Identifier tok due to the "_"
                const BambaTok = extendToken("BambaTok", /_bamba/)
                BambaTok.LONGER_ALT = IdentTok

                const myLexer = new Lexer([BambaTok, IntegerTok, IdentTok], {
                    positionTracking: "onlyOffset"
                })
                let input = "_bamba123"
                let result = myLexer.tokenize(input)

                expect(tokenMatcher(result.tokens[0], BambaTok)).to.be.true
                expect(result.tokens[0].image).to.equal("_bamba")
                expect(tokenMatcher(result.tokens[1], IntegerTok)).to.be.true
                expect(result.tokens[1].image).to.equal("123")
            })

            it("can create a token from a string", () => {
                let input = "6666543221231"
                let result = testLexer.tokenize(input)
                expect(tokenMatcher(result.tokens[0], IntegerTok)).to.be.true
                expect(result.tokens[0].image).to.equal("6666543221231")
                expect(result.tokens[0].startOffset).to.equal(0)
            })
        })

        const ValidNaPattern = extendToken("ValidNaPattern", Lexer.NA)

        const ValidNaPattern2 = extendToken("ValidNaPattern2", Lexer.NA)

        // TODO: not sure this API allows invalid stuff
        const InvalidPattern = extendToken("InvalidPattern", 666)
        const MissingPattern = extendToken("MissingPattern", undefined)

        const MultiLinePattern = extendToken("MultiLinePattern", /bamba/m)

        const GlobalPattern = extendToken("GlobalPattern", /bamba/g)

        const CaseInsensitivePattern = extendToken(
            "CaseInsensitivePattern",
            /bamba/i
        )

        const IntegerValid = extendToken("IntegerValid", /0\d*/)

        // oops we did copy paste and forgot to change the pattern (same as Integer)
        const DecimalInvalid = extendToken("DecimalInvalid", /0\d*/)

        const Skipped = extendToken("Skipped")
        Skipped.GROUP = Lexer.SKIPPED

        const Special = extendToken("Special")
        Special.GROUP = "Strange"

        const InvalidGroupNumber = extendToken("InvalidGroupNumber", /\d\d\d/)
        InvalidGroupNumber.GROUP = 666

        if (!skipValidationChecks) {
            describe("The Simple Lexer Validations", () => {
                it("won't detect valid patterns as missing", () => {
                    let result = findMissingPatterns([
                        BambaTok,
                        IntegerTok,
                        IdentifierTok
                    ])
                    expect(result.errors).to.be.empty
                    expect(result.valid).to.deep.equal([
                        BambaTok,
                        IntegerTok,
                        IdentifierTok
                    ])
                })

                it("will detect missing patterns", () => {
                    let tokenClasses = [ValidNaPattern, MissingPattern]
                    let result = findMissingPatterns(tokenClasses)
                    expect(result.errors.length).to.equal(1)
                    expect(result.errors[0].tokenClasses).to.deep.equal([
                        MissingPattern
                    ])
                    expect(result.errors[0].type).to.equal(
                        LexerDefinitionErrorType.MISSING_PATTERN
                    )
                    expect(result.errors[0].message).to.contain(
                        "MissingPattern"
                    )
                    expect(result.valid).to.deep.equal([ValidNaPattern])
                })

                it("won't detect valid patterns as invalid", () => {
                    let result = findInvalidPatterns([
                        BambaTok,
                        IntegerTok,
                        IdentifierTok,
                        ValidNaPattern
                    ])
                    expect(result.errors).to.be.empty
                    expect(result.valid).to.deep.equal([
                        BambaTok,
                        IntegerTok,
                        IdentifierTok,
                        ValidNaPattern
                    ])
                })

                it("will detect invalid patterns as invalid", () => {
                    let tokenClasses = [ValidNaPattern, InvalidPattern]
                    let result = findInvalidPatterns(tokenClasses)
                    expect(result.errors.length).to.equal(1)
                    expect(result.errors[0].tokenClasses).to.deep.equal([
                        InvalidPattern
                    ])
                    expect(result.errors[0].type).to.equal(
                        LexerDefinitionErrorType.INVALID_PATTERN
                    )
                    expect(result.errors[0].message).to.contain(
                        "InvalidPattern"
                    )
                    expect(result.valid).to.deep.equal([ValidNaPattern])
                })

                it("won't detect valid patterns as using unsupported flags", () => {
                    let errors = findUnsupportedFlags([
                        BambaTok,
                        IntegerTok,
                        IdentifierTok,
                        CaseInsensitivePattern
                    ])
                    expect(errors).to.be.empty
                })

                it("will detect patterns using unsupported multiline flag", () => {
                    let tokenClasses = [ValidNaPattern, MultiLinePattern]
                    let errors = findUnsupportedFlags(tokenClasses)
                    expect(errors.length).to.equal(1)
                    expect(errors[0].tokenClasses).to.deep.equal([
                        MultiLinePattern
                    ])
                    expect(errors[0].type).to.equal(
                        LexerDefinitionErrorType.UNSUPPORTED_FLAGS_FOUND
                    )
                    expect(errors[0].message).to.contain("MultiLinePattern")
                })

                it("will detect patterns using unsupported global flag", () => {
                    let tokenClasses = [ValidNaPattern, GlobalPattern]
                    let errors = findUnsupportedFlags(tokenClasses)
                    expect(errors.length).to.equal(1)
                    expect(errors[0].tokenClasses).to.deep.equal([
                        GlobalPattern
                    ])
                    expect(errors[0].type).to.equal(
                        LexerDefinitionErrorType.UNSUPPORTED_FLAGS_FOUND
                    )
                    expect(errors[0].message).to.contain("GlobalPattern")
                })

                it("won't detect valid patterns as duplicates", () => {
                    let errors = findDuplicatePatterns([
                        MultiLinePattern,
                        IntegerValid
                    ])
                    expect(errors).to.be.empty
                })

                it("won't detect NA patterns as duplicates", () => {
                    let errors = findDuplicatePatterns([
                        ValidNaPattern,
                        ValidNaPattern2
                    ])
                    expect(errors).to.be.empty
                })

                it("will detect patterns using unsupported end of input anchor", () => {
                    let InvalidToken = extendToken("InvalidToken", /BAMBA$/)
                    let tokenClasses = [ValidNaPattern, InvalidToken]
                    let errors = findEndOfInputAnchor(tokenClasses)
                    expect(errors.length).to.equal(1)
                    expect(errors[0].tokenClasses).to.deep.equal([InvalidToken])
                    expect(errors[0].type).to.equal(
                        LexerDefinitionErrorType.EOI_ANCHOR_FOUND
                    )
                    expect(errors[0].message).to.contain("InvalidToken")
                })

                it("won't detect valid patterns as using unsupported end of input anchor", () => {
                    let errors = findEndOfInputAnchor([
                        IntegerTok,
                        IntegerValid
                    ])
                    expect(errors).to.be.empty
                })

                it("will detect patterns using unsupported start of input anchor", () => {
                    let InvalidToken = extendToken("InvalidToken", /^BAMBA/)
                    let tokenClasses = [ValidNaPattern, InvalidToken]
                    let errors = findStartOfInputAnchor(tokenClasses)
                    expect(errors.length).to.equal(1)
                    expect(errors[0].tokenClasses).to.deep.equal([InvalidToken])
                    expect(errors[0].type).to.equal(
                        LexerDefinitionErrorType.SOI_ANCHOR_FOUND
                    )
                    expect(errors[0].message).to.contain("InvalidToken")
                })

                it("won't detect negation as using unsupported start of input anchor", () => {
                    let negationPattern = extendToken(
                        "negationPattern",
                        /[^\\]/
                    )
                    let errors = findStartOfInputAnchor([negationPattern])
                    expect(errors).to.be.empty
                })

                it("won't detect valid patterns as using unsupported start of input anchor", () => {
                    let errors = findStartOfInputAnchor([
                        IntegerTok,
                        IntegerValid
                    ])
                    expect(errors).to.be.empty
                })

                it("will detect identical patterns for different classes", () => {
                    let tokenClasses = [DecimalInvalid, IntegerValid]
                    let errors = findDuplicatePatterns(tokenClasses)
                    expect(errors.length).to.equal(1)
                    expect(errors[0].tokenClasses).to.deep.equal([
                        DecimalInvalid,
                        IntegerValid
                    ])
                    expect(errors[0].type).to.equal(
                        LexerDefinitionErrorType.DUPLICATE_PATTERNS_FOUND
                    )
                    expect(errors[0].message).to.contain("IntegerValid")
                    expect(errors[0].message).to.contain("DecimalInvalid")
                })

                it("will detect patterns that can match an empty string", () => {
                    // should use \d+ as * allows zero repetitions
                    const emptyMatch = extendToken("emptyMatch", /\d*/)

                    let tokenClasses = [emptyMatch]
                    let errors = findEmptyMatchRegExps(tokenClasses)
                    expect(errors.length).to.equal(1)
                    expect(errors[0].tokenClasses).to.deep.equal([emptyMatch])
                    expect(errors[0].type).to.equal(
                        LexerDefinitionErrorType.EMPTY_MATCH_PATTERN
                    )
                    expect(errors[0].message).to.contain("emptyMatch")
                    expect(errors[0].message).to.contain(
                        "must not match an empty string"
                    )
                })

                it("won't detect valid groups as unsupported", () => {
                    let errors = findInvalidGroupType([
                        IntegerTok,
                        Skipped,
                        Special
                    ])
                    //noinspection BadExpressionStatementJS
                    expect(errors).to.be.empty
                })

                it("will detect unsupported group types", () => {
                    let tokenClasses = [InvalidGroupNumber]
                    let errors = findInvalidGroupType(tokenClasses)
                    expect(errors.length).to.equal(1)
                    expect(errors[0].tokenClasses).to.deep.equal([
                        InvalidGroupNumber
                    ])
                    expect(errors[0].type).to.equal(
                        LexerDefinitionErrorType.INVALID_GROUP_TYPE_FOUND
                    )
                    expect(errors[0].message).to.contain("InvalidGroupNumber")
                })
            })
        }

        const PatternNoStart = extendToken("PatternNoStart", /bamba/i)

        const Keyword = extendToken("Keyword", Lexer.NA)
        const If = extendToken("If", /if/, Keyword)
        const Else = extendToken("Else", "else", Keyword)
        const Return = extendToken("Return", /return/i, Keyword)
        const Integer = extendToken("Integer", /[1-9]\d*/)

        const Punctuation = extendToken("Punctuation", Lexer.NA)
        const LParen = extendToken("Return", /\(/, Punctuation)
        const RParen = extendToken("Return", /\)/, Punctuation)

        const Whitespace = extendToken("Whitespace", /(\t| )/)
        Whitespace.GROUP = Lexer.SKIPPED

        const NewLine = extendToken("NewLine", /(\n|\r|\r\n)/)
        NewLine.GROUP = Lexer.SKIPPED
        NewLine.LINE_BREAKS = true

        const WhitespaceNotSkipped = extendToken("WhitespaceNotSkipped", /\s+/)
        WhitespaceNotSkipped.LINE_BREAKS = true

        const Comment = extendToken("Comment", /\/\/.+/)
        Comment.GROUP = "comments"

        const WhitespaceOrAmp = extendToken("WhitespaceOrAmp", /\s+|&/)
        WhitespaceOrAmp.LINE_BREAKS = true

        describe("The Simple Lexer transformations", () => {
            it("can transform a pattern to one with startOfInput mark ('^') #1 (NO OP)", () => {
                let orgSource = BambaTok.PATTERN.source
                let transPattern = addStartOfInput(BambaTok.PATTERN)
                expect(transPattern.source).to.equal("^(?:" + orgSource + ")")
                expect(/^\^/.test(transPattern.source)).to.equal(true)
            })

            it("can transform a pattern to one with startOfInput mark ('^') #2", () => {
                let orgSource = PatternNoStart.PATTERN.source
                let transPattern = addStartOfInput(PatternNoStart.PATTERN)
                expect(transPattern.source).to.equal("^(?:" + orgSource + ")")
                expect(/^\^/.test(transPattern.source)).to.equal(true)
            })

            if (!skipValidationChecks) {
                it("can transform/analyze an array of Token Classes into matched/ignored/patternToClass", () => {
                    let tokenClasses = [
                        Keyword,
                        If,
                        Else,
                        Return,
                        Integer,
                        Punctuation,
                        LParen,
                        RParen,
                        Whitespace,
                        NewLine
                    ]
                    let analyzeResult = analyzeTokenClasses(tokenClasses, false)

                    let allPatterns = map(
                        analyzeResult.patternIdxToConfig,
                        currConfig => currConfig.pattern
                    )

                    expect(allPatterns.length).to.equal(8)
                    let allPatternsString = map(allPatterns, pattern => {
                        return isString(pattern) ? pattern : pattern.source
                    })
                    setEquality(allPatternsString, [
                        "^(?:(\\t| ))",
                        "^(?:(\\n|\\r|\\r\\n))",
                        "^(?:[1-9]\\d*)",
                        "(",
                        ")",
                        "^(?:if)",
                        "^(?:else)",
                        "^(?:return)"
                    ])

                    let patternIdxToClass = map(
                        analyzeResult.patternIdxToConfig,
                        currConfig => currConfig.tokenType
                    )
                    expect(keys(patternIdxToClass).length).to.equal(8)
                    expect(patternIdxToClass[0]).to.equal(If.tokenType)
                    expect(patternIdxToClass[1]).to.equal(Else.tokenType)
                    expect(patternIdxToClass[2]).to.equal(Return.tokenType)
                    expect(patternIdxToClass[3]).to.equal(Integer.tokenType)
                    expect(patternIdxToClass[4]).to.equal(LParen.tokenType)
                    expect(patternIdxToClass[5]).to.equal(RParen.tokenType)
                    expect(patternIdxToClass[6]).to.equal(Whitespace.tokenType)
                    expect(patternIdxToClass[7]).to.equal(NewLine.tokenType)
                })
            }

            if (!skipValidationChecks && ORG_SUPPORT_STICKY) {
                it("can transform/analyze an array of Token Classes into matched/ignored/patternToClass - sticky", () => {
                    let tokenClasses = [
                        Keyword,
                        If,
                        Else,
                        Return,
                        Integer,
                        Punctuation,
                        LParen,
                        RParen,
                        Whitespace,
                        NewLine
                    ]
                    // on newer node.js this will run with the 2nd argument as true.
                    let analyzeResult = analyzeTokenClasses(tokenClasses, true)
                    let allPatterns = map(
                        analyzeResult.patternIdxToConfig,
                        currConfig => currConfig.pattern
                    )
                    expect(allPatterns.length).to.equal(8)
                    let allPatternsString = map(allPatterns, pattern => {
                        return isString(pattern) ? pattern : pattern.source
                    })
                    setEquality(allPatternsString, [
                        "(\\t| )",
                        "(\\n|\\r|\\r\\n)",
                        "(",
                        ")",
                        "[1-9]\\d*",
                        "if",
                        "else",
                        "return"
                    ])

                    forEach(allPatterns, currPattern => {
                        if (isRegExp(currPattern)) {
                            expect(currPattern.sticky).to.be.true
                        }
                    })
                    let patternIdxToClass = map(
                        analyzeResult.patternIdxToConfig,
                        currConfig => currConfig.tokenType
                    )
                    expect(keys(patternIdxToClass).length).to.equal(8)
                    expect(patternIdxToClass[0]).to.equal(If.tokenType)
                    expect(patternIdxToClass[1]).to.equal(Else.tokenType)
                    expect(patternIdxToClass[2]).to.equal(Return.tokenType)
                    expect(patternIdxToClass[3]).to.equal(Integer.tokenType)
                    expect(patternIdxToClass[4]).to.equal(LParen.tokenType)
                    expect(patternIdxToClass[5]).to.equal(RParen.tokenType)
                    expect(patternIdxToClass[6]).to.equal(Whitespace.tokenType)
                    expect(patternIdxToClass[7]).to.equal(NewLine.tokenType)
                })
            }

            it("can count the number of line terminators in a string", () => {
                let ltCounter = new Lexer([
                    createToken({
                        name: "lt",
                        pattern: /\s+/,
                        line_breaks: true
                    }),
                    createToken({ name: "num", pattern: /\d+/ })
                ])
                let lastToken = last(ltCounter.tokenize("1\r\n1\r1").tokens)
                expect(lastToken.startLine).to.equal(3)

                let lastToken2 = last(
                    ltCounter.tokenize("\r\r\r1234\r\n1").tokens
                )
                expect(lastToken2.startLine).to.equal(5)
                expect(lastToken2.startColumn).to.equal(1)

                let lastToken3 = last(ltCounter.tokenize("2\r3\n\r4\n5").tokens)
                expect(lastToken3.startLine).to.equal(5)
            })

            it("can count the number of line terminators in a string - string literal patterns", () => {
                let ltCounter = new Lexer([
                    createToken({
                        name: "lt",
                        pattern: "\n",
                        line_breaks: true
                    }),
                    createToken({ name: "num", pattern: /\d+/ })
                ])
                let lastToken = last(ltCounter.tokenize("1\n1\n1").tokens)
                expect(lastToken.startLine).to.equal(3)
            })

            it("Supports custom Line Terminators", () => {
                let WS = createToken({
                    name: "WS",
                    pattern: /\u2028/,
                    line_breaks: true,
                    group: Lexer.SKIPPED
                })
                let ifElseLexer = new Lexer([WS, If, Else], {
                    lineTerminatorsPattern: /\u2028/g
                })

                let input = "if\u2028elseif"

                let lexResult = ifElseLexer.tokenize(input)
                let tokens: any = lexResult.tokens
                expect(tokens[0].image).to.equal("if")
                expect(tokens[0].startLine).to.equal(1)
                expect(tokens[0].startColumn).to.equal(1)
                expect(tokens[1].image).to.equal("else")
                expect(tokens[1].startLine).to.equal(2)
                expect(tokens[1].startColumn).to.equal(1)
                expect(tokens[2].image).to.equal("if")
                expect(tokens[2].startLine).to.equal(2)
                expect(tokens[2].startColumn).to.equal(5)
            })
        })

        describe("The Simple Lexer Full flow", () => {
            it("can run a simpleLexer without optimizing meta chars", () => {
                let Tab = createToken({
                    name: "Tab",
                    pattern: /\t/,
                    group: "spaces"
                })
                let ifElseLexer = new Lexer([Tab, If, Else], {
                    positionTracking: "onlyOffset"
                })

                let input = "if\telse"

                let lexResult = ifElseLexer.tokenize(input)
                let tokens: any = lexResult.tokens
                expect(tokens[0].image).to.equal("if")
                expect(tokens[1].image).to.equal("else")

                let spacesGroups: any = lexResult.groups.spaces
                expect(spacesGroups[0].image).to.equal("\t")
            })

            it("can run a simpleLexer in debug mode", () => {
                let WS = createToken({
                    name: "WS",
                    pattern: /(\t| )/,
                    group: "spaces"
                })
                let ifElseLexer = new Lexer([WS, If, Else], {
                    debug: true,
                    positionTracking: "onlyOffset"
                })

                let input = "if else"

                let lexResult = ifElseLexer.tokenize(input)
                let tokens: any = lexResult.tokens
                expect(tokens[0].tokenClassName).to.equal("If")
                expect(tokens[1].tokenClassName).to.equal("Else")

                let spacesGroups: any = lexResult.groups.spaces
                expect(spacesGroups[0].tokenClassName).to.equal("WS")
            })

            const EndOfInputAnchor = extendToken("EndOfInputAnchor", /BAMBA$/)
            it("can create a simple Lexer from a List of Token Classes", () => {
                let ifElseLexer = new Lexer(
                    [
                        Keyword,
                        If,
                        Else,
                        Return,
                        Integer,
                        Punctuation,
                        LParen,
                        RParen,
                        Whitespace,
                        NewLine
                    ],
                    lexerConfig
                )
                //noinspection BadExpressionStatementJS
                expect(ifElseLexer.lexerDefinitionErrors).to.be.empty

                let input = "if (666) reTurn 1\n" + "\telse return 2"

                let lexResult = ifElseLexer.tokenize(input)
                expect(lexResult.groups).to.be.empty

                expect(lexResult.tokens[0].image).to.equal("if")
                expect(lexResult.tokens[0].startOffset).to.equal(0)
                if (testStart) {
                    expect(lexResult.tokens[0].startLine).to.equal(1)
                    expect(lexResult.tokens[0].startColumn).to.equal(1)
                }
                if (testFull) {
                    expect(lexResult.tokens[0].endOffset).to.equal(1)
                }
                expect(tokenMatcher(lexResult.tokens[0], If)).to.be.true

                expect(lexResult.tokens[1].image).to.equal("(")
                expect(lexResult.tokens[1].startOffset).to.equal(3)
                if (testStart) {
                    expect(lexResult.tokens[1].startLine).to.equal(1)
                    expect(lexResult.tokens[1].startColumn).to.equal(4)
                }
                if (testFull) {
                    expect(lexResult.tokens[1].endOffset).to.equal(3)
                }
                expect(tokenMatcher(lexResult.tokens[1], LParen)).to.be.true

                expect(lexResult.tokens[2].image).to.equal("666")
                expect(lexResult.tokens[2].startOffset).to.equal(4)
                if (testStart) {
                    expect(lexResult.tokens[2].startLine).to.equal(1)
                    expect(lexResult.tokens[2].startColumn).to.equal(5)
                }
                if (testFull) {
                    expect(lexResult.tokens[2].endOffset).to.equal(6)
                }
                expect(tokenMatcher(lexResult.tokens[2], Integer)).to.be.true

                expect(lexResult.tokens[3].image).to.equal(")")
                expect(lexResult.tokens[3].startOffset).to.equal(7)
                if (testStart) {
                    if (testStart) {
                        expect(lexResult.tokens[3].startLine).to.equal(1)
                        expect(lexResult.tokens[3].startColumn).to.equal(8)
                    }
                }
                if (testFull) {
                    expect(lexResult.tokens[3].endOffset).to.equal(7)
                }
                expect(tokenMatcher(lexResult.tokens[3], RParen)).to.be.true

                expect(lexResult.tokens[4].image).to.equal("reTurn")
                expect(lexResult.tokens[4].startOffset).to.equal(9)
                if (testStart) {
                    expect(lexResult.tokens[4].startLine).to.equal(1)
                    expect(lexResult.tokens[4].startColumn).to.equal(10)
                }
                if (testFull) {
                    expect(lexResult.tokens[4].endOffset).to.equal(14)
                }
                expect(tokenMatcher(lexResult.tokens[4], Return)).to.be.true

                expect(lexResult.tokens[5].image).to.equal("1")
                expect(lexResult.tokens[5].startOffset).to.equal(16)
                if (testStart) {
                    expect(lexResult.tokens[5].startLine).to.equal(1)
                    expect(lexResult.tokens[5].startColumn).to.equal(17)
                }
                if (testFull) {
                    expect(lexResult.tokens[5].endOffset).to.equal(16)
                }
                expect(tokenMatcher(lexResult.tokens[5], Integer)).to.be.true

                expect(lexResult.tokens[6].image).to.equal("else")
                expect(lexResult.tokens[6].startOffset).to.equal(19)
                if (testStart) {
                    expect(lexResult.tokens[6].startLine).to.equal(2)
                    expect(lexResult.tokens[6].startColumn).to.equal(2)
                }
                if (testFull) {
                    expect(lexResult.tokens[6].endOffset).to.equal(22)
                }
                expect(tokenMatcher(lexResult.tokens[6], Else)).to.be.true

                expect(lexResult.tokens[7].image).to.equal("return")
                expect(lexResult.tokens[7].startOffset).to.equal(24)
                if (testStart) {
                    expect(lexResult.tokens[7].startLine).to.equal(2)
                    expect(lexResult.tokens[7].startColumn).to.equal(7)
                }
                if (testFull) {
                    expect(lexResult.tokens[7].endOffset).to.equal(29)
                }
                expect(tokenMatcher(lexResult.tokens[7], Return)).to.be.true

                expect(lexResult.tokens[8].image).to.equal("2")
                expect(lexResult.tokens[8].startOffset).to.equal(31)
                if (testStart) {
                    expect(lexResult.tokens[8].startLine).to.equal(2)
                    expect(lexResult.tokens[8].startColumn).to.equal(14)
                }
                if (testFull) {
                    expect(lexResult.tokens[8].endOffset).to.equal(31)
                }
                expect(tokenMatcher(lexResult.tokens[8], Integer)).to.be.true
            })

            // when testing custom patterns the EOI anchor will not exist and thus no error will be thrown
            if (!skipValidationChecks) {
                it("Will throw an error during the creation of a Lexer if the lexer config argument is a boolean", () => {
                    expect(
                        () => new Lexer([], { positionTracking: <any>"oops" })
                    ).to.throw(
                        "Invalid <positionTracking> config option:" + ' "oops"'
                    )
                })

                it("Will throw an error during the creation of a Lexer if the lexer config argument is a boolean", () => {
                    expect(() => new Lexer([], <any>false)).to.throw(
                        "The second argument to the Lexer constructor is now an ILexerConfig"
                    )
                })

                it("Will throw an error during the creation of a Lexer if the Lexer's definition is invalid", () => {
                    expect(
                        () => new Lexer([EndOfInputAnchor, If, Else]),
                        lexerConfig
                    ).to.throw(/Errors detected in definition of Lexer/)
                    expect(
                        () => new Lexer([EndOfInputAnchor, If, Else]),
                        lexerConfig
                    ).to.throw(/EndOfInputAnchor/)
                })

                it("can defer the throwing of errors during the creation of a Lexer if the Lexer's definition is invalid", () => {
                    expect(
                        () =>
                            new Lexer([EndOfInputAnchor, If, Else], {
                                deferDefinitionErrorsHandling: true
                            })
                    ).to.not.throw(/Errors detected in definition of Lexer/)
                    expect(
                        () =>
                            new Lexer([EndOfInputAnchor, If, Else], {
                                deferDefinitionErrorsHandling: true
                            })
                    ).to.not.throw(/EndOfInputAnchor/)

                    let lexerWithErrs = new Lexer(
                        [EndOfInputAnchor, If, Else],
                        { deferDefinitionErrorsHandling: true }
                    )
                    //noinspection BadExpressionStatementJS
                    expect(lexerWithErrs.lexerDefinitionErrors).to.not.be.empty
                    // even when the Error handling is deferred, actual usage of an invalid lexer is not permitted!
                    expect(() => lexerWithErrs.tokenize("else")).to.throw(
                        /Unable to Tokenize because Errors detected in definition of Lexer/
                    )
                    expect(() => lexerWithErrs.tokenize("else")).to.throw(
                        /EndOfInputAnchor/
                    )
                })
            }

            it("can skip invalid character inputs and only report one error per sequence of characters skipped", () => {
                let ifElseLexer = new Lexer(
                    [
                        Keyword,
                        If,
                        Else,
                        Return,
                        Integer,
                        Punctuation,
                        LParen,
                        RParen,
                        Whitespace,
                        NewLine
                    ],
                    lexerConfig
                )

                let input = "if (666) return 1@#$@#$\n" + "\telse return 2"

                let lexResult = ifElseLexer.tokenize(input)
                expect(lexResult.errors.length).to.equal(1)
                expect(lexResult.errors[0].message).to.contain("@")
                expect(lexResult.errors[0].length).to.equal(6)
                if (testStart) {
                    expect(lexResult.errors[0].line).to.equal(1)
                    expect(lexResult.errors[0].column).to.equal(18)
                } else {
                    expect(lexResult.errors[0].line).to.be.undefined
                    expect(lexResult.errors[0].column).to.be.undefined
                }

                expect(lexResult.tokens[0].image).to.equal("if")
                expect(lexResult.tokens[0].startOffset).to.equal(0)
                if (testStart) {
                    expect(lexResult.tokens[0].startLine).to.equal(1)
                    expect(lexResult.tokens[0].startColumn).to.equal(1)
                }
                expect(tokenMatcher(lexResult.tokens[0], If)).to.be.true

                expect(lexResult.tokens[1].image).to.equal("(")
                expect(lexResult.tokens[1].startOffset).to.equal(3)
                if (testStart) {
                    expect(lexResult.tokens[1].startLine).to.equal(1)
                    expect(lexResult.tokens[1].startColumn).to.equal(4)
                }
                expect(tokenMatcher(lexResult.tokens[1], LParen)).to.be.true

                expect(lexResult.tokens[2].image).to.equal("666")
                expect(lexResult.tokens[2].startOffset).to.equal(4)
                if (testStart) {
                    expect(lexResult.tokens[2].startLine).to.equal(1)
                    expect(lexResult.tokens[2].startColumn).to.equal(5)
                }
                expect(tokenMatcher(lexResult.tokens[2], Integer)).to.be.true

                expect(lexResult.tokens[3].image).to.equal(")")
                expect(lexResult.tokens[3].startOffset).to.equal(7)
                if (testStart) {
                    expect(lexResult.tokens[3].startLine).to.equal(1)
                    expect(lexResult.tokens[3].startColumn).to.equal(8)
                }
                expect(tokenMatcher(lexResult.tokens[3], RParen)).to.be.true

                expect(lexResult.tokens[4].image).to.equal("return")
                expect(lexResult.tokens[4].startOffset).to.equal(9)
                if (testStart) {
                    expect(lexResult.tokens[4].startLine).to.equal(1)
                    expect(lexResult.tokens[4].startColumn).to.equal(10)
                }
                expect(tokenMatcher(lexResult.tokens[4], Return)).to.be.true

                expect(lexResult.tokens[5].image).to.equal("1")
                expect(lexResult.tokens[5].startOffset).to.equal(16)
                if (testStart) {
                    expect(lexResult.tokens[5].startLine).to.equal(1)
                    expect(lexResult.tokens[5].startColumn).to.equal(17)
                }
                expect(tokenMatcher(lexResult.tokens[5], Integer)).to.be.true

                expect(lexResult.tokens[6].image).to.equal("else")
                expect(lexResult.tokens[6].startOffset).to.equal(25)
                if (testStart) {
                    expect(lexResult.tokens[6].startLine).to.equal(2)
                    expect(lexResult.tokens[6].startColumn).to.equal(2)
                }
                expect(tokenMatcher(lexResult.tokens[6], Else)).to.be.true

                expect(lexResult.tokens[7].image).to.equal("return")
                expect(lexResult.tokens[7].startOffset).to.equal(30)
                if (testStart) {
                    expect(lexResult.tokens[7].startLine).to.equal(2)
                    expect(lexResult.tokens[7].startColumn).to.equal(7)
                }
                expect(tokenMatcher(lexResult.tokens[7], Return)).to.be.true

                expect(lexResult.tokens[8].image).to.equal("2")
                expect(lexResult.tokens[8].startOffset).to.equal(37)
                if (testStart) {
                    expect(lexResult.tokens[8].startLine).to.equal(2)
                    expect(lexResult.tokens[8].startColumn).to.equal(14)
                }
                expect(tokenMatcher(lexResult.tokens[8], Integer)).to.be.true
            })

            it("won't go into infinite loops when skipping at end of input", () => {
                let ifElseLexer = new Lexer(
                    [
                        Keyword,
                        If,
                        Else,
                        Return,
                        Integer,
                        Punctuation,
                        LParen,
                        RParen,
                        Whitespace,
                        NewLine
                    ],
                    lexerConfig
                )

                let input = "if&&&&&&&&&&&&&&&&&&&&&&&&&&&&"
                let lexResult = ifElseLexer.tokenize(input)
                expect(lexResult.errors.length).to.equal(1)
                expect(lexResult.errors[0].message).to.contain("&")
                if (testStart) {
                    expect(lexResult.errors[0].line).to.equal(1)
                    expect(lexResult.errors[0].column).to.equal(3)
                } else {
                    expect(lexResult.errors[0].line).to.be.undefined
                    expect(lexResult.errors[0].column).to.be.undefined
                }

                expect(lexResult.errors[0].length).to.equal(28)
                expect(lexResult.tokens[0].image).to.equal("if")
                expect(lexResult.tokens[0].startOffset).to.equal(0)
                if (testStart) {
                    expect(lexResult.tokens[0].startLine).to.equal(1)
                    expect(lexResult.tokens[0].startColumn).to.equal(1)
                }
                expect(tokenMatcher(lexResult.tokens[0], If)).to.be.true
            })

            it("can deal with line terminators inside multi-line Tokens", () => {
                let ifElseLexer = new Lexer(
                    [If, Else, WhitespaceNotSkipped],
                    lexerConfig
                )

                let input = "if\r\r\telse\rif\n"
                let lexResult = ifElseLexer.tokenize(input)

                expect(lexResult.tokens[0].image).to.equal("if")
                expect(lexResult.tokens[0].startOffset).to.equal(0)
                if (testStart) {
                    expect(lexResult.tokens[0].startLine).to.equal(1)
                    expect(lexResult.tokens[0].startColumn).to.equal(1)
                }
                if (testFull) {
                    expect(lexResult.tokens[0].endLine).to.equal(1)
                    expect(lexResult.tokens[0].endColumn).to.equal(2)
                }
                expect(tokenMatcher(lexResult.tokens[0], If)).to.be.true

                expect(lexResult.tokens[1].image).to.equal("\r\r\t")
                expect(lexResult.tokens[1].startOffset).to.equal(2)
                if (testStart) {
                    expect(lexResult.tokens[1].startLine).to.equal(1)
                    expect(lexResult.tokens[1].startColumn).to.equal(3)
                }
                if (testFull) {
                    expect(lexResult.tokens[1].endLine).to.equal(3)
                    expect(lexResult.tokens[1].endColumn).to.equal(1)
                }
                expect(tokenMatcher(lexResult.tokens[1], WhitespaceNotSkipped))
                    .to.be.true

                expect(lexResult.tokens[2].image).to.equal("else")
                expect(lexResult.tokens[2].startOffset).to.equal(5)
                if (testStart) {
                    expect(lexResult.tokens[2].startLine).to.equal(3)
                    expect(lexResult.tokens[2].startColumn).to.equal(2)
                }
                if (testFull) {
                    expect(lexResult.tokens[2].endLine).to.equal(3)
                    expect(lexResult.tokens[2].endColumn).to.equal(5)
                }
                expect(tokenMatcher(lexResult.tokens[2], Else)).to.be.true

                expect(lexResult.tokens[3].image).to.equal("\r")
                expect(lexResult.tokens[3].startOffset).to.equal(9)
                if (testStart) {
                    expect(lexResult.tokens[3].startLine).to.equal(3)
                    expect(lexResult.tokens[3].startColumn).to.equal(6)
                }
                if (testFull) {
                    expect(lexResult.tokens[3].endLine).to.equal(3)
                    expect(lexResult.tokens[3].endColumn).to.equal(6)
                }
                expect(tokenMatcher(lexResult.tokens[3], WhitespaceNotSkipped))
                    .to.be.true

                expect(lexResult.tokens[4].image).to.equal("if")
                expect(lexResult.tokens[4].startOffset).to.equal(10)
                if (testStart) {
                    expect(lexResult.tokens[4].startLine).to.equal(4)
                    expect(lexResult.tokens[4].startColumn).to.equal(1)
                }
                if (testFull) {
                    expect(lexResult.tokens[4].endLine).to.equal(4)
                    expect(lexResult.tokens[4].endColumn).to.equal(2)
                }
                expect(tokenMatcher(lexResult.tokens[4], If)).to.be.true

                expect(lexResult.tokens[5].image).to.equal("\n")
                expect(lexResult.tokens[5].startOffset).to.equal(12)
                if (testStart) {
                    expect(lexResult.tokens[5].startLine).to.equal(4)
                    expect(lexResult.tokens[5].startColumn).to.equal(3)
                }
                if (testFull) {
                    expect(lexResult.tokens[5].endLine).to.equal(4)
                    expect(lexResult.tokens[5].endColumn).to.equal(3)
                }
                expect(tokenMatcher(lexResult.tokens[5], WhitespaceNotSkipped))
                    .to.be.true
            })

            it("can deal with Tokens which may or may not be a lineTerminator", () => {
                let ifElseLexer = new Lexer(
                    [If, Else, WhitespaceOrAmp],
                    lexerConfig
                )

                let input = "if\r\r\telse&if"
                let lexResult = ifElseLexer.tokenize(input)

                expect(lexResult.tokens[0].image).to.equal("if")
                expect(lexResult.tokens[0].startOffset).to.equal(0)
                if (testStart) {
                    expect(lexResult.tokens[0].startLine).to.equal(1)
                    expect(lexResult.tokens[0].startColumn).to.equal(1)
                }
                if (testFull) {
                    expect(lexResult.tokens[0].endLine).to.equal(1)
                    expect(lexResult.tokens[0].endColumn).to.equal(2)
                }
                expect(tokenMatcher(lexResult.tokens[0], If)).to.be.true

                expect(lexResult.tokens[1].image).to.equal("\r\r\t")
                expect(lexResult.tokens[1].startOffset).to.equal(2)
                if (testStart) {
                    expect(lexResult.tokens[1].startLine).to.equal(1)
                    expect(lexResult.tokens[1].startColumn).to.equal(3)
                }
                if (testFull) {
                    expect(lexResult.tokens[1].endLine).to.equal(3)
                    expect(lexResult.tokens[1].endColumn).to.equal(1)
                }
                expect(tokenMatcher(lexResult.tokens[1], WhitespaceOrAmp)).to.be
                    .true

                expect(lexResult.tokens[2].image).to.equal("else")
                expect(lexResult.tokens[2].startOffset).to.equal(5)
                if (testStart) {
                    expect(lexResult.tokens[2].startLine).to.equal(3)
                    expect(lexResult.tokens[2].startColumn).to.equal(2)
                }
                if (testFull) {
                    expect(lexResult.tokens[2].endLine).to.equal(3)
                    expect(lexResult.tokens[2].endColumn).to.equal(5)
                }
                expect(tokenMatcher(lexResult.tokens[2], Else)).to.be.true

                expect(lexResult.tokens[3].image).to.equal("&")
                expect(lexResult.tokens[3].startOffset).to.equal(9)
                if (testStart) {
                    expect(lexResult.tokens[3].startLine).to.equal(3)
                    expect(lexResult.tokens[3].startColumn).to.equal(6)
                }
                if (testFull) {
                    expect(lexResult.tokens[3].endLine).to.equal(3)
                    expect(lexResult.tokens[3].endColumn).to.equal(6)
                }
                expect(tokenMatcher(lexResult.tokens[3], WhitespaceOrAmp)).to.be
                    .true

                expect(lexResult.tokens[4].image).to.equal("if")
                expect(lexResult.tokens[4].startOffset).to.equal(10)
                if (testStart) {
                    expect(lexResult.tokens[4].startLine).to.equal(3)
                    expect(lexResult.tokens[4].startColumn).to.equal(7)
                }
                if (testFull) {
                    expect(lexResult.tokens[4].endLine).to.equal(3)
                    expect(lexResult.tokens[4].endColumn).to.equal(8)
                }
                expect(tokenMatcher(lexResult.tokens[4], If)).to.be.true
            })

            it("supports Token groups", () => {
                let ifElseLexer = new Lexer(
                    [If, Else, Comment, NewLine],
                    lexerConfig
                )
                let input = "if//else"
                let lexResult = ifElseLexer.tokenize(input)

                expect(lexResult.tokens[0].image).to.equal("if")
                expect(lexResult.tokens[0].startOffset).to.equal(0)
                if (testStart) {
                    expect(lexResult.tokens[0].startLine).to.equal(1)
                    expect(lexResult.tokens[0].startColumn).to.equal(1)
                }
                if (testFull) {
                    expect(lexResult.tokens[0].endLine).to.equal(1)
                    expect(lexResult.tokens[0].endColumn).to.equal(2)
                }
                expect(tokenMatcher(lexResult.tokens[0], If)).to.be.true

                expect(lexResult.groups).to.have.property("comments")
                // tslint:disable
                expect(lexResult.groups["comments"]).to.have.length(1)
                let comment = lexResult.groups["comments"][0]
                // tslint:enable
                expect(comment.image).to.equal("//else")
                expect(comment.startOffset).to.equal(2)
                if (testStart) {
                    expect(comment.startLine).to.equal(1)
                    expect(comment.startColumn).to.equal(3)
                }
                if (testFull) {
                    expect(comment.endLine).to.equal(1)
                    expect(comment.endColumn).to.equal(8)
                }
                expect(tokenMatcher(comment, Comment)).to.be.true
            })

            it("won't have leftover state when using token groups", () => {
                let ifElseLexer = new Lexer(
                    [If, Else, Comment, NewLine],
                    lexerConfig
                )
                let input = "if//else"
                let lexResult = ifElseLexer.tokenize(input)

                expect(lexResult.groups).to.have.property("comments")
                // tslint:disable
                expect(lexResult.groups["comments"]).to.have.length(1)
                // tslint:enable

                // 2th time
                lexResult = ifElseLexer.tokenize(input)
                expect(lexResult.groups).to.have.property("comments")
                // tslint:disable
                expect(lexResult.groups["comments"]).to.have.length(1)
                // tslint:enable
            })

            context("lexer modes", () => {
                const One = extendToken("One", "1")
                const Two = extendToken("Two", /2/)
                const Three = extendToken("Three", /3/)

                const Alpha = extendToken("Alpha", "A")
                const Beta = extendToken("Beta", /B/)
                const Gamma = extendToken("Gamma", /G/)

                const Hash = extendToken("Hash", /#/)
                const Caret = extendToken("Caret", /\^/)
                const Amp = extendToken("Amp", /&/)

                const NUMBERS = extendToken("NUMBERS", /NUMBERS/)
                NUMBERS.PUSH_MODE = "numbers"

                const LETTERS = extendToken("LETTERS", /LETTERS/)
                LETTERS.PUSH_MODE = "letters"

                const SIGNS = extendToken("SIGNS", /SIGNS/)
                SIGNS.PUSH_MODE = "signs"

                const SIGNS_AND_EXIT_LETTERS = extendToken(
                    "SIGNS_AND_EXIT_LETTERS",
                    /SIGNS_AND_EXIT_LETTERS/
                )
                SIGNS_AND_EXIT_LETTERS.PUSH_MODE = "signs"
                SIGNS_AND_EXIT_LETTERS.POP_MODE = true

                const ExitNumbers = extendToken("ExitNumbers", /EXIT_NUMBERS/)
                ExitNumbers.POP_MODE = true

                const ExitLetters = extendToken("ExitLetters", /EXIT_LETTERS/)
                ExitLetters.POP_MODE = true

                const ExitSigns = extendToken("ExitSigns", /EXIT_SIGNS/)
                ExitSigns.POP_MODE = true

                const Whitespace = extendToken("Whitespace", /(\t| )/)
                Whitespace.GROUP = Lexer.SKIPPED

                let modeLexerDefinition: IMultiModeLexerDefinition = {
                    modes: {
                        numbers: [
                            One,
                            Two,
                            Three,
                            ExitNumbers,
                            LETTERS,
                            Whitespace
                        ],
                        letters: [
                            Alpha,
                            Beta,
                            Gamma,
                            ExitLetters,
                            SIGNS_AND_EXIT_LETTERS,
                            SIGNS,
                            Whitespace
                        ],
                        signs: [
                            Hash,
                            Caret,
                            Amp,
                            ExitSigns,
                            NUMBERS,
                            Whitespace,
                            NewLine
                        ]
                    },
                    defaultMode: "numbers"
                }

                let ModeLexer = new Lexer(modeLexerDefinition, lexerConfig)

                it("supports 'context' lexer modes full flow", () => {
                    let input =
                        "1 LETTERS G A G SIGNS & EXIT_SIGNS B EXIT_LETTERS 3"
                    let lexResult = ModeLexer.tokenize(input)
                    expect(lexResult.errors).to.be.empty

                    let images = map(lexResult.tokens, currTok => currTok.image)
                    expect(images).to.deep.equal([
                        "1",
                        "LETTERS",
                        "G",
                        "A",
                        "G",
                        "SIGNS",
                        "&",
                        "EXIT_SIGNS",
                        "B", // back in letters mode
                        "EXIT_LETTERS",
                        "3" // back in numbers mode
                    ])
                })

                it("allows choosing the initial Mode", () => {
                    let input = "A G SIGNS ^"
                    let lexResult = ModeLexer.tokenize(input, "letters")
                    expect(lexResult.errors).to.be.empty

                    let images = map(lexResult.tokens, currTok => currTok.image)
                    expect(images).to.deep.equal(["A", "G", "SIGNS", "^"])
                })

                it("won't allow lexing tokens that are not in the current mode's set", () => {
                    let input = "1 LETTERS 1A"
                    let lexResult = ModeLexer.tokenize(input)
                    expect(lexResult.errors).to.have.lengthOf(1)
                    expect(lexResult.errors[0].message).to.include("skipped 1")
                    expect(lexResult.errors[0].message).to.include(">1<")

                    let images = map(lexResult.tokens, currTok => currTok.image)

                    expect(images).to.deep.equal([
                        "1",
                        "LETTERS",
                        "A" // the second "1" is missing because its not allowed in the "letters" mode
                    ])
                })

                it("Will create a lexer error and skip the mode popping when there is no lexer mode to pop", () => {
                    let input = "1 EXIT_NUMBERS 2"
                    let lexResult = ModeLexer.tokenize(input)
                    expect(lexResult.errors).to.have.lengthOf(1)
                    expect(lexResult.errors[0].message).to.include(
                        ">EXIT_NUMBERS<"
                    )
                    expect(lexResult.errors[0].message).to.include(
                        "Unable to pop"
                    )
                    if (testStart) {
                        expect(lexResult.errors[0].line).to.equal(1)
                        expect(lexResult.errors[0].column).to.equal(3)
                    } else {
                        expect(lexResult.errors[0].line).to.equal(undefined)
                        expect(lexResult.errors[0].column).to.equal(undefined)
                    }

                    expect(lexResult.errors[0].length).to.equal(12)

                    let images = map(lexResult.tokens, currTok => currTok.image)
                    expect(images).to.deep.equal(["1", "EXIT_NUMBERS", "2"])
                })

                it("Will pop the lexer mode and push a new one if both are defined on the token", () => {
                    let input = "LETTERS SIGNS_AND_EXIT_LETTERS &"
                    let lexResult = ModeLexer.tokenize(input)
                    expect(lexResult.errors).to.be.empty

                    let images = map(lexResult.tokens, currTok => currTok.image)
                    expect(images).to.deep.equal([
                        "LETTERS",
                        "SIGNS_AND_EXIT_LETTERS",
                        "&"
                    ])
                })

                it("Will detect Token definitions with push modes values that does not exist", () => {
                    const One = extendToken("One", /1/)
                    const Two = extendToken("Two", /2/)

                    const Alpha = extendToken("Alpha", /A/)
                    const Beta = extendToken("Beta", /B/)
                    const Gamma = extendToken("Gamma", /G/)

                    const EnterNumbers = extendToken("EnterNumbers", /NUMBERS/)
                    EnterNumbers.PUSH_MODE = "numbers"

                    let lexerDef: IMultiModeLexerDefinition = {
                        modes: {
                            letters: [
                                Alpha,
                                Beta,
                                Gamma,
                                Whitespace,
                                EnterNumbers
                            ],
                            // the numbers mode has a typo! so the PUSH_MODE in the 'EnterNumbers' is invalid
                            nuMbers_TYPO: [One, Two, Whitespace, NewLine]
                        },

                        defaultMode: "letters"
                    }

                    let badLexer = new Lexer(lexerDef, {
                        deferDefinitionErrorsHandling: true
                    })
                    expect(badLexer.lexerDefinitionErrors).to.have.lengthOf(1)
                    expect(
                        badLexer.lexerDefinitionErrors[0].tokenClasses
                    ).to.deep.equal([EnterNumbers])
                    expect(badLexer.lexerDefinitionErrors[0].type).to.equal(
                        LexerDefinitionErrorType.PUSH_MODE_DOES_NOT_EXIST
                    )
                    expect(
                        badLexer.lexerDefinitionErrors[0].message
                    ).to.include("PUSH_MODE")
                    expect(
                        badLexer.lexerDefinitionErrors[0].message
                    ).to.include("EnterNumbers")
                    expect(
                        badLexer.lexerDefinitionErrors[0].message
                    ).to.include("which does not exist")
                })

                it("Will detect a multiMode Lexer definition which is missing the <modes> property", () => {
                    let lexerDef: any = {
                        modes___: {
                            //  typo in 'modes' property name
                        },

                        defaultMode: ""
                    }

                    let badLexer = new Lexer(lexerDef, {
                        deferDefinitionErrorsHandling: true,
                        positionTracking: "onlyOffset"
                    })
                    expect(badLexer.lexerDefinitionErrors).to.have.lengthOf(1)
                    expect(badLexer.lexerDefinitionErrors[0].type).to.equal(
                        LexerDefinitionErrorType.MULTI_MODE_LEXER_WITHOUT_MODES_PROPERTY
                    )
                    expect(
                        badLexer.lexerDefinitionErrors[0].message
                    ).to.include("MultiMode Lexer cannot be initialized")
                    expect(
                        badLexer.lexerDefinitionErrors[0].message
                    ).to.include("without a <modes> property")
                })

                it("Will detect a multiMode Lexer definition which is missing the <defaultMode> property", () => {
                    let lexerDef: any = {
                        modes: {},

                        defaultMode___: "" //  typo in 'defaultMode' property name
                    }

                    let badLexer = new Lexer(lexerDef, {
                        deferDefinitionErrorsHandling: true,
                        positionTracking: "onlyOffset"
                    })
                    expect(badLexer.lexerDefinitionErrors).to.have.lengthOf(1)
                    expect(badLexer.lexerDefinitionErrors[0].type).to.equal(
                        LexerDefinitionErrorType.MULTI_MODE_LEXER_WITHOUT_DEFAULT_MODE
                    )
                    expect(
                        badLexer.lexerDefinitionErrors[0].message
                    ).to.include("MultiMode Lexer cannot be initialized")
                    expect(
                        badLexer.lexerDefinitionErrors[0].message
                    ).to.include("without a <defaultMode> property")
                })

                it(
                    "Will detect a multiMode Lexer definition " +
                        "which has an invalid (missing the value) of the <defaultMode> property",
                    () => {
                        let lexerDef: any = {
                            modes: {
                                bamba: []
                            },

                            defaultMode: "bisli"
                        }
                        let badLexer = new Lexer(lexerDef, {
                            deferDefinitionErrorsHandling: true,
                            positionTracking: "onlyOffset"
                        })
                        expect(badLexer.lexerDefinitionErrors).to.have.lengthOf(
                            1
                        )
                        expect(badLexer.lexerDefinitionErrors[0].type).to.equal(
                            LexerDefinitionErrorType.MULTI_MODE_LEXER_DEFAULT_MODE_VALUE_DOES_NOT_EXIST
                        )
                        expect(
                            badLexer.lexerDefinitionErrors[0].message
                        ).to.include("MultiMode Lexer cannot be initialized")
                        expect(
                            badLexer.lexerDefinitionErrors[0].message
                        ).to.include("which does not exist")
                        expect(
                            badLexer.lexerDefinitionErrors[0].message
                        ).to.include("bisli")
                    }
                )

                it("Will detect a Lexer definition which has undefined Token classes", () => {
                    let lexerDef: any = [
                        Alpha,
                        Beta /* this is undefined */,
                        ,
                        Gamma
                    ]
                    let badLexer = new Lexer(lexerDef, {
                        deferDefinitionErrorsHandling: true,
                        positionTracking: "onlyOffset"
                    })
                    expect(badLexer.lexerDefinitionErrors).to.have.lengthOf(1)
                    expect(badLexer.lexerDefinitionErrors[0].type).to.equal(
                        LexerDefinitionErrorType.LEXER_DEFINITION_CANNOT_CONTAIN_UNDEFINED
                    )
                    expect(
                        badLexer.lexerDefinitionErrors[0].message
                    ).to.include(
                        "A Lexer cannot be initialized using an undefined Token Class"
                    )
                    expect(
                        badLexer.lexerDefinitionErrors[0].message
                    ).to.include("2")
                })

                context("custom pattern", () => {
                    function defineCustomPatternSpec(variant, customPattern) {
                        it(variant, () => {
                            let time = 1

                            function extraContextValidator(
                                text,
                                offset,
                                tokens,
                                groups
                            ) {
                                let result = isFunction(customPattern)
                                    ? customPattern(text, offset)
                                    : customPattern.exec(text, offset)
                                if (result !== null) {
                                    if (time === 1) {
                                        expect(tokens).to.be.empty
                                        time++
                                    } else if (time === 2) {
                                        expect(tokens).to.have.lengthOf(2)
                                        expect(
                                            groups.whitespace
                                        ).to.have.lengthOf(2)
                                        time++
                                    } else {
                                        throw Error(
                                            "Issue with Custom Token pattern context"
                                        )
                                    }
                                }

                                return result
                            }

                            let A = createToken({ name: "A", pattern: "A" })
                            let B = createToken({
                                name: "B",
                                pattern: <any>extraContextValidator
                            })
                            let WS = createToken({
                                name: "WS",
                                pattern: {
                                    exec: (text, offset) =>
                                        /^\s+/.exec(text.substring(offset))
                                },
                                group: "whitespace",
                                line_breaks: true
                            })

                            let lexerDef: any = [WS, A, B]
                            let myLexer = new Lexer(lexerDef, lexerConfig)
                            let lexResult = myLexer.tokenize("B A\n B ")
                            expect(lexResult.tokens).to.have.length(3)
                            expect(tokenMatcher(lexResult.tokens[0], B)).to.be
                                .true
                            expect(tokenMatcher(lexResult.tokens[1], A)).to.be
                                .true
                            expect(tokenMatcher(lexResult.tokens[2], B)).to.be
                                .true

                            let lastToken = lexResult.tokens[2]
                            expect(lastToken.startOffset).to.equal(5)

                            if (testStart) {
                                expect(lastToken.startLine).to.equal(2)
                                expect(lastToken.startColumn).to.equal(2)
                            }

                            if (testFull) {
                                expect(lastToken.endLine).to.equal(2)
                                expect(lastToken.endColumn).to.equal(2)
                                expect(lastToken.endOffset).to.equal(5)
                            }
                        })
                    }

                    defineCustomPatternSpec(
                        "With short function syntax",
                        (text, offset) => /^B/.exec(text.substring(offset))
                    )
                    defineCustomPatternSpec("verbose syntax", {
                        exec: (text, offset) =>
                            /^B/.exec(text.substring(offset))
                    })
                })
            })
        })
    }

    context(contextName, lexerSpecs)

    if (SUPPORT_STICKY === true) {
        context(contextName + " NO STICKY", () => {
            before(disableSticky)

            lexerSpecs()

            after(enableSticky)
        })
    }
}

function wrapWithCustom(baseExtendToken) {
    return function() {
        let newToken = baseExtendToken.apply(null, arguments)

        let pattern = newToken.PATTERN
        if (
            isRegExp(pattern) &&
            !/\\n|\\r|\\s/g.test(pattern.source) &&
            pattern !== Lexer.NA
        ) {
            newToken.PATTERN = function(text, offset) {
                // can't use sticky here because tests on node.js version 4 won't pass.
                let withStart = addStartOfInput(pattern)
                let execResult = withStart.exec(text.substring(offset))
                return execResult
            }
        }
        return newToken
    }
}

defineLexerSpecs(
    "Regular Tokens Mode",
    extendToken,
    tokenStructuredMatcher,
    false,
    { positionTracking: "full" }
)
defineLexerSpecs(
    "Regular Tokens Mode (custom mode)",
    wrapWithCustom(extendToken),
    tokenStructuredMatcher,
    true,
    { positionTracking: "full" }
)

defineLexerSpecs(
    "Regular Tokens Mode - only start",
    extendToken,
    tokenStructuredMatcher,
    false,
    { positionTracking: "onlyStart" }
)
defineLexerSpecs(
    "Regular Tokens Mode (custom mode) - only start",
    wrapWithCustom(extendToken),
    tokenStructuredMatcher,
    true,
    { positionTracking: "onlyStart" }
)

defineLexerSpecs(
    "Regular Tokens Mode - onlyOffset",
    extendToken,
    tokenStructuredMatcher,
    false,
    { positionTracking: "onlyOffset" }
)
defineLexerSpecs(
    "Regular Tokens Mode (custom mode)",
    wrapWithCustom(extendToken),
    tokenStructuredMatcher,
    true,
    { positionTracking: "onlyOffset" }
)

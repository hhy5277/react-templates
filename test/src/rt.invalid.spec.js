'use strict'
const reactTemplates = require('../../src/reactTemplates')
const testUtils = require('./testUtils')
const _ = require('lodash')
const path = require('path')
const RTCodeError = reactTemplates.RTCodeError

const omitStack = err => _.omit(err, 'stack', 'toIssue')

module.exports = {
    runTests(test, basePath) {
        const dataPath = path.resolve(basePath, 'invalid')
        const invalidFiles = [
            // {file: 'sortByDragListItemRowExamples.rt', issue: new RTCodeError('x', 0, 160, 1, 1)}
            {file: 'if-with-scope/invalid-if-scope-1.rt', issue: new RTCodeError("invalid scope mapping used in if part 'this.bar(activeUsers.length)'", 0, 160, 1, 1)},
            {file: 'if-with-scope/invalid-if-scope-2.rt', issue: new RTCodeError("invalid scope mapping used in if part 'this.bar[activeUsers || 0]'", 0, 158, 1, 1)},
            {file: 'if-with-scope/invalid-if-scope-3.rt', issue: new RTCodeError("invalid scope mapping used in if part 'this.foo + activeUsers.length > this.bar'", 0, 172, 1, 1)},
            {file: 'if-with-scope/invalid-if-scope-4.rt', issue: new RTCodeError("invalid scope mapping used in if part 'getCurrentActiveUsers().length'", 0, 170, 1, 1)},
            {file: 'if-with-scope/invalid-if-scope-5.rt', issue: new RTCodeError("invalid scope mapping used in if part 'this.bar({activeUsers})'", 0, 155, 1, 1)},
            {file: 'invalid-scope.rt', issue: new RTCodeError("invalid scope part 'a in a in a'", 0, 35, 1, 1)},
            {file: 'invalid-html.rt', issue: new RTCodeError('Document should have a root element', -1, -1, -1, -1)},
            {file: 'invalid-exp.rt', issue: new RTCodeError("Failed to parse text '\n    {z\n'", 5, 13, 1, 6)},
            {file: 'invalid-lambda.rt', issue: new RTCodeError("when using 'on' events, use lambda '(p1,p2)=>body' notation or 'this.handler'; otherwise use {} to return a callback function. error: [onClick='']", 0, 23, 1, 1)},
            {file: 'invalid-autobind.rt', issue: new RTCodeError("'this.handler' syntax allowed only when the --autobind is on, use {} to return a callback function.", 0, 132, 1, 1)},
            // {file: 'invalid-js.rt', issue: new RTCodeError('Unexpected token ILLEGAL', 0, 32, 1, 1)}, bug interduced due to scope parsing
            {file: 'invalid-single-root.rt', issue: new RTCodeError('Document should have no more than a single root element', 12, 23, 2, 1)},
            {file: 'invalid-repeat-1.rt', issue: new RTCodeError("rt-repeat invalid 'in' expression 'a in b in c'", 9, 44, 2, 4)},
            {file: 'invalid-repeat-2.rt', issue: new RTCodeError("root element may not have a 'rt-repeat' attribute", 0, 39, 1, 1)},
            {file: 'invalid-rt-require-1.rt', issue: new RTCodeError("'rt-require' needs 'dependency' and 'as' attributes", 0, 14, 1, 1)},
            {file: 'invalid-rt-require-2.rt', issue: new RTCodeError("'rt-require' may have no children", 0, 32, 1, 1)},
            // {file: 'invalid-rt-require-duplicate.rt', issue: new RTCodeError("'rt-import' must be a toplevel node", 9, 54, 2, 4), options: {modules: 'amd'}},
            {file: 'invalid-rt-import-1.rt', issue: new RTCodeError("'*' imports must have an 'as' attribute", 0, 36, 1, 1)},
            {file: 'invalid-rt-import-2.rt', issue: new RTCodeError("default imports must have an 'as' attribute", 0, 42, 1, 1)},
            {file: 'invalid-rt-import-3.rt', issue: new RTCodeError("'rt-import' needs 'name' and 'from' attributes", 0, 13, 1, 1)},
            {file: 'invalid-rt-import-4.rt', issue: new RTCodeError("'rt-import' must be a toplevel node", 9, 54, 2, 4)},
            {file: 'invalid-rt-template-1.rt', issue: new RTCodeError("'rt-template' should have a single non-text element as direct child", 9, 88, 2, 4)},
            {file: 'invalid-rt-template-2.rt', issue: new RTCodeError("'rt-template' should have a single non-text element as direct child", 9, 90, 2, 4)},
            {file: 'invalid-brace.rt', issue: new RTCodeError('Unexpected end of input', 128, 163, 5, 11)},
            {file: 'invalid-style-1.rt', issue: new RTCodeError('Unexpected token ILLEGAL', 10, 39, 2, 5)},
            {file: 'invalid-style-2.rt', issue: new RTCodeError('style attribute keys cannot contain { } expressions', 35, 68, 2, 5)},
            {file: 'invalid-virtual-1.rt', issue: new RTCodeError('Document should not have <rt-virtual> as root element', 0, 60, 1, 1)},
            {file: 'invalid-virtual-2.rt', issue: new RTCodeError("<rt-virtual> may not contain attributes other than 'rt-scope', 'rt-if' and 'rt-repeat'", 9, 119, 2, 4)}
        ]

        test('invalid tests', t => {
            t.plan(invalidFiles.length)

            invalidFiles.forEach(testFile => {
                const filename = path.join(dataPath, testFile.file)
                const html = testUtils.readFileNormalized(filename)
                let error = null
                try {
                    reactTemplates.convertTemplateToReact(html)
                } catch (e) {
                    error = e
                }
                t.deepEqual(omitStack(error), omitStack(testFile.issue), 'Expect convertTemplateToReact to throw an error')
            })
        })

        /**
         * @param {ERR} err
         * @return {ERR}
         */
        function normalizeError(err) {
            if (err) {
                err.msg = err.msg.replace(/\r/g, '')
            }
            return err
        }

        test('invalid tests json', t => {
            const cli = require('../../src/cli')
            const context = require('../../src/context')
            t.plan(invalidFiles.length)

            invalidFiles.forEach(check)

            function check(testFile) {
                context.clear()
                const filename = path.join(dataPath, testFile.file)
                const options = {format: 'json', force: true}
                cli.handleSingleFile(_.assign(options, testFile.options), filename)
                t.deepEqual(normalizeError(context.getMessages()[0]), errorEqualMessage(testFile.issue, filename), `Expect cli to produce valid output messages ${testFile.file}`)
            }
        })

        /**
         * @typedef {{index: number, line: number, column: number, msg: string, level: string, file: string}} ERR
         */

        /**
         * @param {RTCodeError} err
         * @param {string} file
         * @return {ERR}
         */
        function errorEqualMessage(err, file) {
            return {
                index: err.index,
                line: err.line,
                column: err.column,
                startOffset: err.startOffset,
                endOffset: err.endOffset,
                msg: err.message,
                level: 'ERROR',
                file
            }
        }
    }
}


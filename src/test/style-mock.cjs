/* CommonJS on purpose: @patternfly's CommonJS builds import their stylesheets
 * from inside a cycle, and a require() of an ES module there is a require(esm)
 * cycle that Node 24 rejects. The default export is the empty object a style
 * import is mocked down to. */
module.exports = {};

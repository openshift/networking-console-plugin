// eslint-disable-next-line @typescript-eslint/no-var-requires, no-undef
const { CustomJSONLexer } = require('./i18n-scripts/lexers');

// eslint-disable-next-line no-undef
module.exports = {
  createOldCatalogs: false,
  defaultNamespace: 'plugin__networking-console-plugin',
  keySeparator: false,
  // see below for more details
  lexers: {
    default: ['JavascriptLexer'],
    handlebars: ['HandlebarsLexer'],

    hbs: ['HandlebarsLexer'],
    htm: ['HTMLLexer'],

    html: ['HTMLLexer'],
    js: ['JavascriptLexer'], // if you're writing jsx inside .js files, change this to JsxLexer
    json: [CustomJSONLexer],
    jsx: ['JsxLexer'],
    mjs: ['JavascriptLexer'],
    ts: ['JavascriptLexer'],

    tsx: ['JsxLexer'],
  },
  locales: ['en', 'es', 'fr', 'ja', 'ko', 'zh'],
  namespaceSeparator: '~',
  reactNamespace: false,
  sort: true,

  useKeysAsDefaultValue: true,
};

'use strict';
// Shared by the tests: loads the workbook's scripts the way Node's require() does.
const lib = require('../tools/lib');

const { CASE, REC, checker } = lib.loadWorkbook();

/** The status ('ok', 'look' or 'note') of one rule in a result. */
function status(result, id) {
  const r = result.rules.find((x) => x.id === id);
  if (!r) { throw new Error('No rule "' + id + '" in exercise ' + result.exercise + '. Rules: ' + result.rules.map((x) => x.id).join(', ')); }
  return r.status;
}
function rule(result, id) { return result.rules.find((x) => x.id === id); }

module.exports = { lib, CASE, REC, C: checker, F: CASE.facts, status, rule };

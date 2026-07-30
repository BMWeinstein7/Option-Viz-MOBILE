'use strict';
// brace-expansion v1/v2 exported the expand function as module.exports.
// v5 (the only line patched for CVE-2026-14257 / CVE-2026-13149) exports a
// named `expand`. This shim restores the legacy call shape so overriding
// vulnerable v1/v2 resolutions does not break consumers like minimatch.
const { expand } = require('brace-expansion-v5');
module.exports = function braceExpansion(str, options) {
  return expand(str, options);
};
module.exports.expand = expand;

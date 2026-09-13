import assert from "node:assert/strict";
import { boligsidenUrl, listingPageSlug } from "./format";

assert.equal(
  listingPageSlug("skovs-hoejrup-vej-4-5270-odense-n-04617556___4_______"),
  "skovs-hoejrup-vej-4-5270-odense-n",
);
assert.equal(
  listingPageSlug("skovs-hoejrup-vej-4-5270-odense-n"),
  "skovs-hoejrup-vej-4-5270-odense-n",
);
assert.equal(
  boligsidenUrl("skovs-hoejrup-vej-4-5270-odense-n-04617556___4_______"),
  "https://www.boligsiden.dk/adresse/skovs-hoejrup-vej-4-5270-odense-n",
);
assert.equal(
  boligsidenUrl("buchwaldsgade-13b-5000-odense-c"),
  "https://www.boligsiden.dk/adresse/buchwaldsgade-13b-5000-odense-c",
);

console.log("format.test.ts ok");

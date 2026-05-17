/**
 * csv-utils.test.js — Tests for csv-utils.js
 *
 * Run with:  node csv-utils.test.js
 *
 * No external test framework is required. Results are printed to stdout.
 * Exit code is 0 on full pass, 1 on any failure.
 */

"use strict";

const fs   = require("fs");
const path = require("path");
const { readCSV, writeCSV } = require("./csv-utils");

// ---------------------------------------------------------------------------
// Minimal test harness
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✓  ${label}`);
    passed++;
  } else {
    console.error(`  ✗  ${label}`);
    failed++;
  }
}

function assertEqual(actual, expected, label) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) {
    console.error(`     actual  : ${JSON.stringify(actual)}`);
    console.error(`     expected: ${JSON.stringify(expected)}`);
  }
  assert(ok, label);
}

function assertThrows(fn, label) {
  try {
    fn();
    assert(false, label);
  } catch {
    assert(true, label);
  }
}

// ---------------------------------------------------------------------------
// Helper: write to a temp file, read it back, then delete it
// ---------------------------------------------------------------------------

const TMP = path.join(__dirname, "__csv_test_tmp__.csv");

function roundTrip(data) {
  writeCSV(TMP, data);
  const result = readCSV(TMP);
  fs.unlinkSync(TMP);
  return result;
}

// ---------------------------------------------------------------------------
// Test suites
// ---------------------------------------------------------------------------

console.log("\n=== 1. Basic write / read ===");

assertEqual(
  roundTrip([["name", "age"], ["Alice", "30"], ["Bob", "25"]]),
  [["name", "age"], ["Alice", "30"], ["Bob", "25"]],
  "simple table round-trips cleanly"
);

assertEqual(
  roundTrip([["hello"]]),
  [["hello"]],
  "single cell"
);

assertEqual(
  roundTrip([["a", "b", "c"]]),
  [["a", "b", "c"]],
  "single row, multiple columns"
);

assertEqual(
  roundTrip([["x"], ["y"], ["z"]]),
  [["x"], ["y"], ["z"]],
  "single column, multiple rows"
);

// ---------------------------------------------------------------------------

console.log("\n=== 2. Edge-case: fields that contain commas ===");

assertEqual(
  roundTrip([["city, state", "zip"], ["Austin, TX", "78701"]]),
  [["city, state", "zip"], ["Austin, TX", "78701"]],
  "commas inside fields are preserved"
);

// ---------------------------------------------------------------------------

console.log("\n=== 3. Edge-case: fields that contain double-quotes ===");

assertEqual(
  roundTrip([['He said "hello"', "normal"]]),
  [['He said "hello"', "normal"]],
  "double-quotes inside fields are preserved"
);

assertEqual(
  roundTrip([['a "quoted, complex" value']]),
  [['a "quoted, complex" value']],
  "field with both quotes and comma round-trips"
);

// ---------------------------------------------------------------------------

console.log("\n=== 4. Edge-case: fields that contain newlines ===");

const multiLine = "line one\nline two";

assertEqual(
  roundTrip([[multiLine, "next col"]]),
  [[multiLine, "next col"]],
  "embedded newline in field is preserved"
);

// ---------------------------------------------------------------------------

console.log("\n=== 5. Edge-case: empty fields ===");

assertEqual(
  roundTrip([["", "b", ""], ["", "", ""]]),
  [["", "b", ""], ["", "", ""]],
  "empty fields round-trip as empty strings"
);

// ---------------------------------------------------------------------------

console.log("\n=== 6. Edge-case: null / undefined cells ===");

const nullData = [[null, undefined, "real"]];
writeCSV(TMP, nullData);
const nullResult = readCSV(TMP);
fs.unlinkSync(TMP);

assertEqual(nullResult, [["", "", "real"]], "null/undefined become empty strings");

// ---------------------------------------------------------------------------

console.log("\n=== 7. Edge-case: numeric values ===");

assertEqual(
  roundTrip([[1, 2.5, -3, 0]]),
  [["1", "2.5", "-3", "0"]],
  "numbers are coerced to strings on write, preserved on read"
);

// ---------------------------------------------------------------------------

console.log("\n=== 8. writeCSV — raw CSV content check ===");

writeCSV(TMP, [["a,b", 'say "hi"', "normal"]]);
const raw = fs.readFileSync(TMP, "utf8");
fs.unlinkSync(TMP);

assert(raw.includes('"a,b"'), "field with comma is quoted in raw file");
assert(raw.includes('"say ""hi"""'), "embedded double-quote is escaped in raw file");
assert(raw.includes("normal"), "plain field has no extra quotes");

// ---------------------------------------------------------------------------

console.log("\n=== 9. readCSV — Windows line endings (CRLF) ===");

const crlf = "col1,col2\r\nval1,val2\r\n";
fs.writeFileSync(TMP, crlf, "utf8");
const crlfResult = readCSV(TMP);
fs.unlinkSync(TMP);

assertEqual(crlfResult, [["col1", "col2"], ["val1", "val2"]], "CRLF line endings parsed correctly");

// ---------------------------------------------------------------------------

console.log("\n=== 10. Input validation ===");

assertThrows(() => writeCSV(TMP, "not an array"), "writeCSV throws on non-array data");
assertThrows(() => writeCSV(TMP, ["not a row"]),   "writeCSV throws when a row is not an array");

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\n${"─".repeat(40)}`);
console.log(`Tests passed: ${passed}`);
console.log(`Tests failed: ${failed}`);
console.log("─".repeat(40) + "\n");

if (failed > 0) process.exit(1);
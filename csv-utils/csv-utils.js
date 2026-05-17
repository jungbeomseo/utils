/**
 * csv.js — Read/write 2-D arrays to/from CSV files.
 * Uses only built-in Node.js modules.
 *
 * Edge cases handled:
 *  - Fields containing commas        → wrapped in double-quotes
 *  - Fields containing double-quotes → inner quotes escaped as ""
 *  - Fields containing newlines      → wrapped in double-quotes
 *  - Empty fields                    → preserved as empty strings
 *  - Quoted fields spanning lines    → reassembled correctly on read
 */

"use strict";

const fs = require("fs");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Escapes a single cell value for CSV output.
 * Wraps the value in double-quotes when it contains a comma, double-quote,
 * or newline character; doubles any embedded double-quotes.
 *
 * @param {*} value  – cell value (will be coerced to string)
 * @returns {string} – safe CSV token
 */
function escapeCell(value) {
  const str = value === null || value === undefined ? "" : String(value);
  const needsQuoting = str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r");
  if (!needsQuoting) return str;
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Parses a full CSV string into a 2-D array of strings.
 * Implements a character-level state machine so it correctly handles:
 *   - quoted fields (including embedded commas / newlines)
 *   - doubled double-quotes inside quoted fields
 *   - both \r\n and \n line endings
 *
 * @param {string} text – raw CSV text
 * @returns {string[][]} – 2-D array of cell values
 */
function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        // Peek ahead: doubled quote → literal double-quote char
        if (text[i + 1] === '"') {
          cell += '"';
          i += 2;
        } else {
          // Closing quote
          inQuotes = false;
          i++;
        }
      } else {
        cell += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ",") {
        row.push(cell);
        cell = "";
        i++;
      } else if (ch === "\r" && text[i + 1] === "\n") {
        // Windows line ending
        row.push(cell);
        rows.push(row);
        row = [];
        cell = "";
        i += 2;
      } else if (ch === "\n") {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = "";
        i++;
      } else {
        cell += ch;
        i++;
      }
    }
  }

  // Flush any remaining cell / row (file may not end with a newline)
  row.push(cell);
  // Avoid pushing a phantom empty row when the file ends with a newline
  if (!(rows.length > 0 && row.length === 1 && row[0] === "")) {
    rows.push(row);
  }

  return rows;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Writes a 2-D array to a CSV file.
 *
 * @param {string}   filePath – destination file path
 * @param {Array[]}  data     – 2-D array (rows × columns)
 * @returns {void}
 */
function writeCSV(filePath, data) {
  if (!Array.isArray(data)) throw new TypeError("data must be an array");

  const lines = data.map((row) => {
    if (!Array.isArray(row)) throw new TypeError("each row must be an array");
    return row.map(escapeCell).join(",");
  });

  fs.writeFileSync(filePath, lines.join("\n"), "utf8");
}

/**
 * Reads a CSV file and returns its contents as a 2-D array of strings.
 *
 * @param {string} filePath – path to the CSV file
 * @returns {string[][]} – 2-D array of cell values
 */
function readCSV(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  return parseCSV(text);
}

module.exports = { readCSV, writeCSV };
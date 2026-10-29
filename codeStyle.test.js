/*
 * Prueft JS-Dateien auf die Projektregeln.
 * Aufruf: node codeStyle.test.js [ordner]
 * Exit-Code 1 bei Verstoessen.
 */
const fs = require("fs");
const path = require("path");

const config = {
  rootDir: process.argv[2] || ".",
  maxFunctionLines: 14,
  maxFileLines: 400,
  blankLinesBetweenFunctions: 1,
  codeExtensions: [".js"],
  ignoredDirs: ["node_modules", ".git"],
};
const camelCase = /^[a-z][a-zA-Z0-9]*$/;
const constantName = /^[A-Z][A-Z0-9_]*$/;
const violations = [];
const maskPattern = /\/\*[\s\S]*?\*\/|\/\/[^\n]*|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\[\s\S]|[^`\\])*`|(?<=[(,=:[!&|?{};]\s*|\breturn\s+)\/(?![/*])(?:\\.|\[(?:\\.|[^\]\\\n])*\]|[^/\\\n[])+\/[a-z]*/g;
const functionPattern = /\bfunction\s*\*?\s*([A-Za-z_$][\w$]*)\s*\(|\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:function\b[^(]*)?\(/g;

/**
 * Collects all files below a directory, ignoring configured folders.
 * @param {string} dir - The directory to scan.
 * @returns {string[]} The file paths.
 */
function collectFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (!entry.isDirectory()) return [fullPath];
    return config.ignoredDirs.includes(entry.name) ? [] : collectFiles(fullPath);
  });
}

/**
 * Stores one rule violation.
 * @param {string} file - The file path.
 * @param {number} line - The line number.
 * @param {string} rule - The name of the violated rule.
 * @param {string} message - The description of the problem.
 * @returns {void}
 */
function report(file, line, rule, message) {
  violations.push(`${file}:${line}  [${rule}]  ${message}`);
}

/**
 * Replaces comments, strings and regex literals with spaces. Line breaks stay.
 * @param {string} source - The file content.
 * @returns {string} The masked content with identical line structure.
 */
function maskSource(source) {
  return source.replace(maskPattern, (match) => match.replace(/[^\n]/g, " "));
}

/**
 * Returns the line number (1-based) of a character position.
 * @param {string} text - The text.
 * @param {number} index - The character position.
 * @returns {number} The line number.
 */
function lineOf(text, index) {
  return text.slice(0, index).split("\n").length;
}

/**
 * Returns the brace nesting depth at a character position.
 * @param {string} masked - The masked source.
 * @param {number} index - The character position.
 * @returns {number} The depth, 0 means top level.
 */
function braceDepthAt(masked, index) {
  const part = masked.slice(0, index);
  return (part.match(/\{/g) || []).length - (part.match(/\}/g) || []).length;
}

/**
 * Finds the closing bracket that belongs to the opening bracket.
 * @param {string} text - The text.
 * @param {number} openIndex - Position of the opening bracket.
 * @param {string} open - The opening bracket character.
 * @param {string} close - The closing bracket character.
 * @returns {number} Position of the closing bracket or -1.
 */
function findClosing(text, openIndex, open, close) {
  let depth = 0;
  for (let i = openIndex; i < text.length; i++) {
    if (text[i] === open) depth++;
    if (text[i] === close) depth--;
    if (depth === 0) return i;
  }
  return -1;
}

/**
 * Finds the end position of a function body.
 * @param {string} masked - The masked source.
 * @param {number} closeParen - Position of the closing parenthesis of the parameters.
 * @param {boolean} isArrow - True if an arrow function is expected.
 * @returns {number} The end position or -1 if this is no function.
 */
function locateEnd(masked, closeParen, isArrow) {
  const rest = masked.slice(closeParen + 1);
  const arrow = /^\s*=>\s*/.exec(rest);
  if (isArrow && !arrow) return -1;
  const offset = closeParen + 1 + (arrow ? arrow[0].length : rest.indexOf("{"));
  if (masked[offset] === "{") return findClosing(masked, offset, "{", "}");
  const lineEnd = masked.indexOf("\n", offset);
  return lineEnd === -1 ? masked.length : lineEnd;
}

/**
 * Builds the function info for one regex match.
 * @param {string} masked - The masked source.
 * @param {RegExpMatchArray} match - A match of the function pattern.
 * @returns {Object|null} The function info or null if it is no function.
 */
function buildFunction(masked, match) {
  const open = match.index + match[0].length - 1;
  const close = findClosing(masked, open, "(", ")");
  const end = locateEnd(masked, close, !/function/.test(match[0]));
  if (close === -1 || end === -1) return null;
  return {
    name: match[1] || match[2],
    declared: Boolean(match[1]),
    start: match.index,
    end,
    params: masked.slice(open + 1, close),
  };
}

/**
 * Finds all named functions (declarations and const/let/var assignments).
 * @param {string} masked - The masked source.
 * @returns {Object[]} The function infos.
 */
function findFunctions(masked) {
  return [...masked.matchAll(functionPattern)]
    .map((match) => buildFunction(masked, match))
    .filter(Boolean);
}

/**
 * Adds line numbers and nesting depth to a function info.
 * @param {Object} fn - The function info.
 * @param {string} masked - The masked source.
 * @returns {Object} The extended function info.
 */
function addLines(fn, masked) {
  return {
    ...fn,
    startLine: lineOf(masked, fn.start),
    endLine: lineOf(masked, fn.end),
    depth: braceDepthAt(masked, fn.start),
  };
}

/**
 * Reports names that are not camelCase or start with an uppercase letter.
 * @param {string} file - The file path.
 * @param {number} line - The line number.
 * @param {string} name - The variable or function name.
 * @returns {void}
 */
function checkIdentifier(file, line, name) {
  if (/^[A-Z]/.test(name)) return report(file, line, "lowerCaseStart", `"${name}" starts uppercase`);
  if (!camelCase.test(name)) report(file, line, "camelCase", `"${name}" is not camelCase`);
}

/**
 * Checks the lines of code of a file (without blank lines and comments).
 * @param {string} file - The file path.
 * @param {string} source - The file content.
 * @returns {void}
 */
function checkFileLength(file, source) {
  const loc = source
    .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, " "))
    .split("\n")
    .filter((line) => line.trim() !== "" && !line.trim().startsWith("//")).length;
  if (loc > config.maxFileLines) {
    report(file, 1, "fileLength", `${loc} LOC (max ${config.maxFileLines})`);
  }
}

/**
 * Checks the names of all variables declared with const, let or var.
 * UPPER_CASE constants are allowed.
 * @param {string} file - The file path.
 * @param {string} masked - The masked source.
 * @returns {void}
 */
function checkVariableNames(file, masked) {
  const pattern = /\b(?:const|let|var)\s+([^=;\n]+?)\s*(?:=|;|\bof\b|\bin\b|\n)/g;
  for (const match of masked.matchAll(pattern)) {
    const names = match[1].match(/[A-Za-z_$][\w$]*/g) || [];
    const line = lineOf(masked, match.index);
    names
      .filter((name) => !constantName.test(name))
      .forEach((name) => checkIdentifier(file, line, name));
  }
}

/**
 * Extracts the names of the simple parameters (destructuring is ignored).
 * @param {string} params - The text between the parentheses.
 * @returns {string[]} The parameter names.
 */
function extractParamNames(params) {
  return params
    .replace(/\{[^}]*\}|\[[^\]]*\]/g, "")
    .replace(/=[^,]*/g, "")
    .split(",")
    .map((part) => (/^\s*(?:\.\.\.)?([A-Za-z_$][\w$]*)/.exec(part) || [])[1])
    .filter(Boolean);
}

/**
 * Finds the first line (1-based) of the JSDoc block directly above a function.
 * @param {string[]} lines - All lines of the file.
 * @param {number} startLine - The line of the function (1-based).
 * @returns {number} The line of the opening JSDoc or -1.
 */
function findDocStart(lines, startLine) {
  let index = startLine - 2;
  if (index < 0 || !lines[index].trim().endsWith("*/")) return -1;
  while (index > 0 && !lines[index].trim().startsWith("/*")) index--;
  return lines[index].trim().startsWith("/**") ? index + 1 : -1;
}

/**
 * Lists what is missing in a JSDoc block: description, @param, @returns.
 * @param {string} doc - The JSDoc text.
 * @param {string} params - The parameter text of the function.
 * @returns {string[]} The problems, empty if the block is complete.
 */
function findDocProblems(doc, params) {
  const problems = [];
  const description = doc.split("@")[0].replace(/\/\*\*|\*\/|^\s*\*/gm, "").trim();
  if (!description) problems.push("description missing");
  extractParamNames(params).forEach((name) => {
    const tag = new RegExp(`@param\\s+(?:\\{[^}]*\\}\\s+)?\\[?${name}\\b`);
    if (!tag.test(doc)) problems.push(`@param ${name} missing`);
  });
  if (!/@returns?\b/.test(doc)) problems.push("@returns missing");
  return problems;
}

/**
 * Checks the JSDoc block of a function.
 * @param {string} file - The file path.
 * @param {string[]} lines - All lines of the file.
 * @param {Object} fn - The function info.
 * @returns {void}
 */
function checkJsDoc(file, lines, fn) {
  const docStart = findDocStart(lines, fn.startLine);
  if (docStart === -1) return report(file, fn.startLine, "jsdoc", `${fn.name}: JSDoc block missing`);
  const doc = lines.slice(docStart - 1, fn.startLine - 1).join("\n");
  findDocProblems(doc, fn.params).forEach((problem) => {
    report(file, fn.startLine, "jsdoc", `${fn.name}: ${problem}`);
  });
}

/**
 * Checks length, name and documentation of one function.
 * @param {string} file - The file path.
 * @param {string[]} lines - All lines of the file.
 * @param {Object} fn - The function info.
 * @returns {void}
 */
function checkFunction(file, lines, fn) {
  const length = fn.endLine - fn.startLine + 1;
  if (length > config.maxFunctionLines) {
    report(file, fn.startLine, "functionLength", `${fn.name} has ${length} lines (max ${config.maxFunctionLines})`);
  }
  if (fn.declared) checkIdentifier(file, fn.startLine, fn.name);
  checkJsDoc(file, lines, fn);
}

/**
 * Checks the blank lines between neighbouring top level functions.
 * @param {string} file - The file path.
 * @param {string[]} lines - All lines of the file.
 * @param {Object[]} topLevel - The top level functions in file order.
 * @returns {void}
 */
function checkSpacing(file, lines, topLevel) {
  for (let i = 1; i < topLevel.length; i++) {
    const previous = topLevel[i - 1];
    const next = topLevel[i];
    const docStart = findDocStart(lines, next.startLine);
    const from = docStart > 0 ? docStart : next.startLine;
    const gap = lines.slice(previous.endLine, from - 1);
    const onlyBlank = gap.every((line) => line.trim() === "");
    if (onlyBlank && gap.length !== config.blankLinesBetweenFunctions) {
      report(file, next.startLine, "spacing", `${next.name}: ${gap.length} blank lines before it (need ${config.blankLinesBetweenFunctions})`);
    }
  }
}

/**
 * Runs all checks for one file.
 * @param {string} file - The file path.
 * @returns {void}
 */
function checkFile(file) {
  if (!config.codeExtensions.includes(path.extname(file))) return;
  const source = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  const masked = maskSource(source);
  const lines = source.split("\n");
  const functions = findFunctions(masked).map((fn) => addLines(fn, masked));
  checkFileLength(file, source);
  checkVariableNames(file, masked);
  functions.forEach((fn) => checkFunction(file, lines, fn));
  checkSpacing(file, lines, functions.filter((fn) => fn.depth === 0));
}

/**
 * Runs the check for the whole project and prints the result.
 * @returns {void}
 */
function main() {
  collectFiles(config.rootDir).forEach((file) => checkFile(file));
  if (violations.length === 0) return console.log("Alle Pruefungen bestanden.");
  console.log(violations.join("\n"));
  console.log(`\n${violations.length} Verstoesse gefunden.`);
  process.exitCode = 1;
}

main();

let {concat, length, map, range, repeat, splitEvery, sum, unnest} = require("ramda")
let {maxOpenCells} = require("./rules")
let {shuffle} = require("./helpers")
let {Board} = require("./types")

let makeLetterBoard = (rowsM, colsN) => {
  let total = rowsM * colsN
  if (total % maxOpenCells) {
    throw Error(`rowsM * colsN must be divisible on ${maxOpenCells}, got ${rowsM} * ${colsN} = ${total}`)
  }
  let partialLetters = map((x) => String.fromCharCode(65 + x), range(0, total / maxOpenCells)) // (97 + x) for lowercase
  let fullLetters = unnest(repeat(partialLetters, maxOpenCells))
  let letters = shuffle(fullLetters)
  let cells = map((l) => [l, 0], letters)
  return Board(rowsM, colsN)(splitEvery(colsN, cells))
}

exports.makeLetterBoard = makeLetterBoard
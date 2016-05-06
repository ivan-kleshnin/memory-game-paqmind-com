let {concat, length, map, range, repeat, splitEvery, sum, unnest} = require("ramda")
let {MAX_OPEN_CELLS} = require("./constants")
let {shuffle} = require("./helpers")
let {Board} = require("./types")

let makeLetterBoard = (rowsM, colsN) => {
  let total = rowsM * colsN
  if (total % MAX_OPEN_CELLS) {
    throw Error(`rowsM * colsN must be divisible on ${MAX_OPEN_CELLS}, got ${rowsM} * ${colsN} = ${total}`)
  }
  let partialLetters = map((x) => String.fromCharCode(65 + x), range(0, total / MAX_OPEN_CELLS)) // (97 + x) for lowercase
  let fullLetters = unnest(repeat(partialLetters, MAX_OPEN_CELLS))
  let letters = shuffle(fullLetters)
  let cells = map((l) => [l, 0], letters)
  return Board(rowsM, colsN)(splitEvery(colsN, cells))
}

exports.makeLetterBoard = makeLetterBoard

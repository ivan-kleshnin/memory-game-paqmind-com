let {concat, length, map, range, repeat, splitEvery, sum, unnest} = require("ramda")
let {maxOpenCells} = require("./rules")
let {shuffle} = require("./helpers")
let {board} = require("./types")

let randomLetterBoard = (m, n) => {
  let total = m * n
  if (total % maxOpenCells) {
    throw Error(`m * n must be divisible on ${maxOpenCells}, got ${m} * ${n} = ${total}`)
  }
  let partialLetters = map((x) => String.fromCharCode(65 + x), range(0, total / maxOpenCells)) // (97 + x) for lowercase
  let fullLetters = unnest(repeat(partialLetters, maxOpenCells))
  let letters = shuffle(fullLetters)
  let cells = map((l) => [l, 0], letters)
  return board(m, n)(splitEvery(n, cells))
}

exports.randomLetterBoard = randomLetterBoard

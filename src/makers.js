let {concat, length, map, range, repeat, splitEvery, sum, unnest} = require("ramda")
let {MAX_OPEN_CELLS} = require("./constants")
let {shuffle} = require("./helpers")
let {board} = require("./types")

let sameLetterBoard = (m, n, l) => {
  let total = m * n
  if (total % MAX_OPEN_CELLS) {
    throw Error(`m * n must be divisible on ${MAX_OPEN_CELLS}, got ${m} * ${n} = ${total}`)
  }
  let cells = repeat([l, 0], total)
  return board(m, n)(splitEvery(n, cells))
}

let randomLetterBoard = (m, n) => {
  let total = m * n
  if (total % MAX_OPEN_CELLS) {
    throw Error(`m * n must be divisible on ${MAX_OPEN_CELLS}, got ${m} * ${n} = ${total}`)
  }
  let partialLetters = map((x) => String.fromCharCode(65 + x), range(0, total / MAX_OPEN_CELLS)) // (97 + x) for lowercase
  let fullLetters = unnest(repeat(partialLetters, MAX_OPEN_CELLS))
  let letters = shuffle(fullLetters)
  let cells = map((l) => [l, 0], letters)
  return board(m, n)(splitEvery(n, cells))
}

exports.sameLetterBoard = sameLetterBoard
exports.randomLetterBoard = randomLetterBoard

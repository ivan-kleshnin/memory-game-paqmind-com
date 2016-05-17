let {concat, length, map, range, repeat, splitEvery, sum, unnest} = require("ramda")
let {shuffle} = require("./helpers/common")
let {board} = require("./types")


let makeEmptyBoard = (m, n) => {
  let total = m * n
  if (total % 2) {
    throw Error(`m * n must be divisible on 2, got ${m} * ${n} = ${total}`)
  }
  let Board = board(m, n)
  return Board(repeat(repeat(["?", "empty"], n), m))
}

let makeTestBoard = (m, n, l) => {
  let total = m * n
  if (total % 2) {
    throw Error(`m * n must be divisible on 2, got ${m} * ${n} = ${total}`)
  }
  let Board = board(m, n)
  return Board(repeat(repeat([l, "closed"], n), m))
}

let makeRandomBoard = (m, n) => {
  let total = m * n
  if (total % 2) {
    throw Error(`m * n must be divisible on 2, got ${m} * ${n} = ${total}`)
  }
  let Board = board(m, n)
  let partialLetters = map((x) => String.fromCharCode(65 + x), range(0, total / 2)) // (97 + x) for lowercase
  let fullLetters = unnest(repeat(partialLetters, 2))
  let letters = shuffle(fullLetters)
  let cells = map((l) => [l, "closed"], letters)
  return Board(splitEvery(n, cells))
}


exports.makeEmptyBoard = makeEmptyBoard
exports.makeTestBoard = makeTestBoard
exports.makeRandomBoard = makeRandomBoard

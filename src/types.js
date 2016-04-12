let {curry, map, repeat} = require("ramda")
let T = require("tcomb")

let Matrix = curry((a, mrows, ncols) => {
  return T.tuple(repeat(T.tuple(repeat(a, ncols)), mrows), "Matrix")
})

let CellState = T.subtype(T.Number, (x) => {
  // 0: closed
  // 1: opened
  // 2: done
  return x == 0 || x == 1 || x == 2
}, "CellState")

let Cell = T.tuple([T.String, CellState])

let Board = Matrix(Cell) // no extendable subtyping for now in Tcomb :(

exports.Matrix = Matrix
exports.CellState = CellState
exports.Cell = Cell
exports.Board = Board

let T = require("tcomb")

// Nat, Type -> Type
let vect = (n, a, name) => {
  let Vect = T.refinement(T.list(a), (x) => {
    return x.length == n
  }, name || `Vect(${n})`)
  Vect.meta.size = n
  return Vect
}

// Nat, Nat, Type, String? -> Type
let matrix = (m, n, a, name) => {
  let Matrix = vect(m, vect(n, a), name || `Matrix(${m}, ${n})`)
  Matrix.meta.size = [m, n]
  return Matrix
}

let CellState = T.refinement(T.Number, (x) => {
  // 0: closed, 1: opened, 2: done
  return x == 0 || x == 1 || x == 2
}, "CellState")

let Cell = T.tuple([T.String, CellState])

// Nat, Nat -> Type
let board = (m, n) => {
  return matrix(m, n, Cell)
}

exports.matrix = matrix
exports.CellState = CellState
exports.Cell = Cell
exports.board = board

let R = require("ramda")
let T = require("tcomb")

let Type = T.irreducible("Type", T.isType)

let MaybeString = T.maybe(T.String, "MaybeString")

let NatNumber = T.refinement(T.Number, (x) => {
  return !(x % 1)
})

// NatNumber, Type, MaybeString -> Type
let vect = /*T
  .func([NatNumber, Type, MaybeString], Type)
  .of(*/(n, a, name) => {
    let Vect = T.refinement(T.list(a), (x) => {
      return x.length == n
    }, name || `Vect(${n})`)
    Vect.meta.size = n
    return Vect
  }/*)*/

// NatNumber, NatNumber, Type, MaybeString -> Type
let matrix = /*T
  .func([NatNumber, NatNumber, Type, MaybeString], Type)
  .of(*/(m, n, a, name) => {
    let Matrix = vect(m, vect(n, a), name || `Matrix(${m}, ${n})`)
    Matrix.meta.size = [m, n]
    return Matrix
  }/*)*/

let CellPayload = T.refinement(T.String, R.T, "CellPayload")

let CellState = T.refinement(NatNumber, (x) => {
  // 0: closed, 1: opened, 2: done
  return x == 0 || x == 1 || x == 2
}, "CellState")

let Cell = T.tuple([CellPayload, CellState], "Cell")

// NatNumber, NatNumber, MaybeString -> Type
let board = /*T
  .func([NatNumber, NatNumber, MaybeString], Type)
  .of(*/(m, n, name) => {
    return matrix(m, n, Cell, name || `Board(${m}, ${n})`)
  }/*)*/

exports.Type = Type
exports.MaybeString = MaybeString
exports.NatNumber = NatNumber
exports.vect = vect
exports.matrix = matrix
exports.CellPayload = CellPayload
exports.CellState = CellState
exports.Cell = Cell
exports.board = board

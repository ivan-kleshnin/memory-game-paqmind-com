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

let CardPayload = T.refinement(T.String, R.T, "CardPayload")

let CardState = T.enums.of(["empty", "closed", "opened", "done"], "CardState")

let Card = T.tuple([CardPayload, CardState], "Card")

// NatNumber, NatNumber, MaybeString -> Type
let board = /*T
  .func([NatNumber, NatNumber, MaybeString], Type)
  .of(*/(m, n, name) => {
    return matrix(m, n, Card, name || `Board(${m}, ${n})`)
  }/*)*/

let GameResult = T.enums.of([false, "win", "defeat"], "GameResult")

let gameState = (m, n) => {
  return T.struct({
    started: T.Bool,
    ended: GameResult,
    paused: T.Bool,
    // locked: T.Bool,
    timeout: NatNumber,
    board: board(m, n),
  }, "Game")
}

let AppState = T.struct({
  records: T.list(T.Any),
}, "App")


exports.Type = Type
exports.MaybeString = MaybeString
exports.NatNumber = NatNumber
exports.vect = vect
exports.matrix = matrix
exports.CardPayload = CardPayload
exports.CardState = CardState
exports.Card = Card
exports.board = board
exports.gameState = gameState
exports.AppState = AppState

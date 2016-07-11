let {all, chain, curry, equals, head, length, map, sum, tail} = require("ramda")

// BOARD ===========================================================================================

let allEqual = (xs) => all(equals(head(xs)), tail(xs))

let total = (board) => sum(map(length, board))

let keepState = curry((state, board) => chain(chain((c) => c[1] == state ? c[0] : []), board))

let closeOpened = (board) => {
  return map(map((c) => c[1] == "opened" ? [c[0], "closed"] : c), board)
}

let doneOpened = (board) => {
  return map(map((c) => c[1] == "opened" ? [c[0], "done"] : c), board)
}

// GAME ============================================================================================
// Game -> Boolean
let inGame = (game) => game.started && !game.ended

// Game -> Boolean
let shouldCloseCards = (game) => {
  if (inGame(game)) {
    let opened = keepState("opened", game.board)
    return opened.length >= 2 && !allEqual(opened)
  } else {
    return false
  }
}

// Game -> Boolean
let shouldDoneCards = (game) => {
  if (inGame(game)) {
    let opened = keepState("opened", game.board)
    return opened.length >= 2 && allEqual(opened)
  } else {
    return false
  }
}

// Game -> Boolean
let shouldLockBoard = (game) => {
  if (inGame(game)) {
    let opened = keepState("opened", game.board)
    return opened.length >= 2
  } else {
    return false
  }
}

// Game -> Boolean
let shouldWinGame = (game) => {
  if (inGame(game)) {
    let opened = keepState("done", game.board)
    return opened.length == total(game.board)
  } else {
    return false
  }
}

// Game -> Boolean
let shouldLoseGame = (game) => {
  if (inGame(game)) {
    return game.timeout <= 0
  } else {
    return false
  }
}

// GAME + FLAGS ====================================================================================
// Game, Flags -> Boolean
let allowStartGame = (game, flags) => !game.started || game.ended

// Game, Flags -> Boolean
let allowExitGame = (game, flags) => game.started

// Game, Flags -> Boolean
let allowPauseGame = (game, flags) => inGame(game) && !game.paused

// Game, Flags -> Boolean
let allowResumeGame = (game, flags) => inGame(game) && game.paused

// Game, Flags -> Boolean
let allowOpenCard = (game, flags) => inGame(game) && !game.paused && !flags.lockBoard

// Game, Flags -> Boolean
let allowTick = (game, flags) => inGame(game) && !game.paused

//==================================================================================================

exports.allEqual = allEqual
exports.total = total
exports.keepState = keepState
exports.closeOpened = closeOpened
exports.doneOpened = doneOpened

exports.shouldCloseCards = shouldCloseCards
exports.shouldDoneCards = shouldDoneCards
exports.shouldLockBoard = shouldLockBoard
exports.shouldWinGame = shouldWinGame
exports.shouldLoseGame = shouldLoseGame

exports.allowStartGame = allowStartGame
exports.allowExitGame = allowExitGame
exports.allowPauseGame = allowPauseGame
exports.allowResumeGame = allowResumeGame
exports.allowOpenCard = allowOpenCard
exports.allowTick = allowTick

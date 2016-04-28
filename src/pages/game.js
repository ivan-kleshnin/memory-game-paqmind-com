let R = require("ramda")
let {addIndex, all, always, compose, equals, chain, curry, identity, head, length, map, sum, tail} = require("ramda")
let {decode} = require("ent")
let {Observable: $} = require("rx")
let {a, br, div, h1, h3, p, span} = require("@cycle/dom")
let {derive, overState, rejectBy, setState, store, toOverState, toState, view} = require("../rx.utils")
let {BOARD_SIZE, MAX_OPEN_CELLS} = require("../constants")
let {randomLetterBoard} = require("../makers")
let seeds = require("../seeds/game")
let menu = require("../chunks/menu")

let mapi = addIndex(map)

let chaini = addIndex(chain)

let payloadLens = curry((i, j) => compose(R.lensIndex(i), R.lensIndex(j), R.lensIndex(0)))

let stateLens = curry((i, j) => compose(R.lensIndex(i), R.lensIndex(j), R.lensIndex(1)))

let keepState = curry((state, board) => chain(chain((c) => c[1] == state ? c[0] : []), board))

let allEqual = (xs) => all(equals(head(xs)), tail(xs))

let total = (board) => sum(map(length, board))

let aboutToClose = (board) => {
  let opened = keepState(1, board)
  if (opened.length >= MAX_OPEN_CELLS) {
    return !allEqual(opened)
  } else {
    return false
  }
}

let aboutToDone = (board) => {
  let opened = keepState(1, board)
  if (opened.length >= MAX_OPEN_CELLS) {
    return allEqual(opened)
  } else {
    return false
  }
}

let aboutToLock = (board) => {
  let opened = keepState(1, board)
  return opened.length >= MAX_OPEN_CELLS
}

let aboutToWin = (board) => {
  let opened = keepState(2, board)
  return opened.length == total(board)
}

let closeOpened = (board) => {
  return map(map((c) => c[1] == 1 ? [c[0], 0] : c), board)
}

let doneOpened = (board) => {
  return map(map((c) => c[1] == 1 ? [c[0], 2] : c), board)
}

// Cell -> VNode
let renderCell = curry((i, j, cell) => {
  let attrs = {attributes: {"data-row": i, "data-col": j}}
  if (cell[1] == 2) {
    return span(".cell.done.fa.fa-square", attrs)
  } else if (cell[1] == 1) {
    return span(".cell.opened.fa.fa-square", attrs, span(".payload", cell[0]))
  } else {
    return span(".cell.closed.fa.fa-square", attrs)
  }
})

// [[Cell]] -> VNode
let renderBoard = (board) => {
  let rowsM = board.length
  let colsN = board[0] ? board[0].length : 0
  return div(`.board.rows-${rowsM}.cols-${colsN}`,
    chaini((r, i) => mapi((c, j) => renderCell(i, j, c), r), board)
  )
}

// () -> VNode
let renderWinScreen = (navi) => {
  return div([
    h3("You win!"),
    p(a(".restart", {href: "#restart"}, "Try again"))
  ])
}

// {Observable *} -> {Observable *}
module.exports = function (src) {
  let clickFrom = (s) => src.DOM.select(s).events("click").pluck("target").share()

  // DERIVED STATE
  let board = src.state2::view("board")

  let derived = {
    isLocked: derive(aboutToLock, board),
    isAboutToClose: derive(aboutToClose, board),
    isAboutToDone: derive(aboutToDone, board),
    isWin: derive(aboutToWin, board),
  }

  // INTENTS
  let intents = {
    openCard: clickFrom(".cell.closed").pluck("dataset"),

    restartGame: clickFrom(".restart"),
  }

  // ACTIONS
  let actions = {
    openCard: intents.openCard
      ::rejectBy(derived.isLocked)
      ::rejectBy(derived.isWin)
      .share(),
  }

  // STATE 2
  let state2 = store(seeds, $.merge(
    derived.isAboutToClose.filter(identity)::overState("board", closeOpened).delay(1000),
    derived.isAboutToDone.filter(identity)::overState("board", doneOpened).delay(1000),

    actions.openCard::toOverState("board", (cell) => (state) => {
      let ls = stateLens(Number(cell.row), Number(cell.col))
      return R.set(ls, 1, state)
    }),

    intents.restartGame::setState("board", randomLetterBoard(...BOARD_SIZE))
  ))

  // DOM
  let DOM = $
    .combineLatest(src.navi, state2, derived.isWin).debounce(1)
    .map(([navi, state, isWin]) => {
      return div([
        h1("Game"),
        menu({navi}),
        br(),
        (isWin ?
          renderWinScreen() :
          renderBoard(state.board)
        )
      ])
    })

  // SINKS
  return {DOM, state2}
}

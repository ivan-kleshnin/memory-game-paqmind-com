let R = require("ramda")
let {addIndex, all, chain, compose, curry, equals, head, identity, length, map, merge, sum, tail, update} = require("ramda")
// let Class = require("classnames")
let {Observable} = require("rx")
let Cycle = require("@cycle/core")
let {a, div, makeDOMDriver, h1, span} = require("@cycle/dom")
let {filterBy, overState, setState, store, swapState, view} = require("./rx.utils.js")
let {maxOpenCells} = require("./rules")
let seeds = require("./seeds")
require("./styles/index.less")

let mapi = addIndex(map)

let payloadLens = curry((i, j) => compose(R.lensIndex(i), R.lensIndex(j), R.lensIndex(0)))

let stateLens = curry((i, j) => compose(R.lensIndex(i), R.lensIndex(j), R.lensIndex(1)))

let keepState = curry((state, board) => chain(chain((c) => c[1] == state ? c[0] : []), board))

let allEqual = (xs) => all(equals(head(xs)), tail(xs))

let total = (board) => sum(map(length, board))

let aboutToClose = (board) => {
  let opened = keepState(1, board)
  if (opened.length >= maxOpenCells) {
    return !allEqual(opened)
  } else {
    return false
  }
}

let aboutToDone = (board) => {
  let opened = keepState(1, board)
  if (opened.length >= maxOpenCells) {
    return allEqual(opened)
  } else {
    return false
  }
}

let aboutToLock = (board) => {
  let opened = keepState(1, board)
  return opened.length >= maxOpenCells
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

// renderCell :: Cell -> String
let renderCell = curry((i, j, cell) => {
  let attrs = {attributes: {"data-row": i, "data-col": j}}
  if (cell[1] == 2) {
    return span(".cell.done", attrs)
  } else if (cell[1] == 1) {
    return span(".cell.opened", attrs, span(".payload", cell[0]))
  } else {
    return span(".cell.closed", attrs)
  }
})

// renderBoard :: [[Cell]] -> String
let renderBoard = (board) => {
  let rowsM = board.length
  let colsN = board[0] ? board[0].length : 0
  return div(`.board.rows-${rowsM}.cols-${colsN}`,
    mapi((r, i) => mapi((c, j) => renderCell(i, j, c), r), board)
  )
}

// main :: {Observable *} -> {Observable *}
let main = (src) => {
  let clickFrom = (s) => src.DOM.select(s).events("click").map((e) => e.target).share()

  // DERIVED STATE
  let board = src.state::view("board")
  let derived = {
    isLocked: board.map(aboutToLock).shareReplay(1),
    isAboutToClose: board.map(aboutToClose).shareReplay(1),
    isAboutToDone: board.map(aboutToDone).shareReplay(1),
    isWin: board.map(aboutToWin).shareReplay(1),
  }

  // INTENTS
  let intents = {
    open: clickFrom(".cell.closed")
      .map((t) => t.dataset)
      ::filterBy(derived.isLocked)
      ::filterBy(derived.isWin)
      .share(),
  }

  // UPDATE
  let update = Observable.merge(
    derived.isAboutToClose.filter(identity)::swapState("board", closeOpened).delay(1000),
    derived.isAboutToDone.filter(identity)::swapState("board", doneOpened).delay(1000),

    intents.open::overState("board", (cell) => (state) => {
      let ls = stateLens(Number(cell.row), Number(cell.col))
      return R.set(ls, 1, state)
    }).share()
  )

  // STATE
  let state = store(seeds, update)

  // CYCLE
  return {
    state,

    DOM: state.zip(derived.isWin, (state, isWin) => {
      if (isWin) {
        return h1("You win!")
      }  else {
        return div(renderBoard(state.board))
      }
    })
  }
}

Cycle.run(main, {
  state: identity,

  DOM: makeDOMDriver("#app"),
})
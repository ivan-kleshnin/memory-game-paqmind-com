let {decode} = require("ent")
let R = require("ramda")
let {addIndex, all, chain, compose, curry, equals, head, identity, length, map, merge, sum, tail, update} = require("ramda")
// let Class = require("classnames")
let {Observable} = require("rx")
let Cycle = require("@cycle/core")
let {a, div, makeDOMDriver, h1, h2, p, span} = require("@cycle/dom")
let {overState, rejectBy, setState, store, swapState, view} = require("./rx.utils.js")
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
  let cellAttrs = {attributes: {"data-row": i, "data-col": j}}
  if (cell[1] == 0) {
    // closed
    return span(".cell", cellAttrs,
      span(".card.flipper", {attributes: {"data-state": 0}}, [
        span(".front", "?"),
        span(".back", cell[0]),
      ])
    )
  } else if (cell[1] == 1) {
    // opened
    return span(".cell", cellAttrs,
      span(".card.flipper.flipped", {attributes: {"data-state": 1}}, [
        span(".front", "?"),
        span(".back", cell[0]),
      ])
    )
  } else {
    // done
    return span(".cell", cellAttrs,
      span(".card.flipper.hidden", {attributes: {"data-state": 2}}, [
        span(".front", "?"),
        span(".back", cell[0]),
      ])
    )
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
  let clickFrom = (s) => src.DOM.select(s).events("click").map((e) => e.currentTarget).share()

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
    open: clickFrom(".card[data-state='0']")
      .map((node) => node.parentNode)
      .map((t) => t.dataset)
      ::rejectBy(derived.isLocked)
      ::rejectBy(derived.isWin)
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
      let header = div("#header", [
        h1("Memory Game"),
        div({innerHTML: '<a href="https://github.com/Paqmind/memory-game" class="github-corner"><svg width="80" height="80" viewBox="0 0 250 250" style="fill:#151513; color:#fff; position: absolute; top: 0; border: 0; right: 0;"><path d="M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z"></path><path d="M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2" fill="currentColor" style="transform-origin: 130px 106px;" class="octo-arm"></path><path d="M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z" fill="currentColor" class="octo-body"></path></svg></a><style>.github-corner:hover .octo-arm{animation:octocat-wave 560ms ease-in-out}@keyframes octocat-wave{0%,100%{transform:rotate(0)}20%,60%{transform:rotate(-25deg)}40%,80%{transform:rotate(10deg)}}@media (max-width:500px){.github-corner:hover .octo-arm{animation:none}.github-corner .octo-arm{animation:octocat-wave 560ms ease-in-out}}</style>'})
      ])
      let footer = div("#footer", [
        p(".copyright", [decode("&copy;"), " Paqmind team, 2016"]),
      ])

      let content = null;
      if (isWin) {
        content = div("#content", h2("You win!"))
      } else {
        content = div("#content", renderBoard(state.board))
      }
      return div("#wrapper", [header, content, footer]);
    })
  }
}

Cycle.run(main, {
  state: identity,

  DOM: makeDOMDriver("#app"),
})

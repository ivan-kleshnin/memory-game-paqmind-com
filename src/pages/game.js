let R = require("ramda")
let {addIndex, all, compose, equals, chain, curry, identity, is, head, length, map, sum, tail} = require("ramda")
let {decode} = require("ent")
let {Observable: $} = require("rx")
let storage = require("store")
let {a, div, h1, h2, p, span} = require("@cycle/dom")
let {always} = require("../helpers")
let {derive, overState, pluck, rejectBy, setState, store, toOverState, toState, view} = require("../rx.utils")
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

// renderCell :: Cell -> String
let renderCell = curry((i, j, cell) => {
  let cellAttrs = {dataset: {row: i, col: j}}
  if (cell[1] == 0) {
    // closed
    return span(".cell", cellAttrs,
      span(".card.flipper", {dataset: {state: 0}}, [
        span(".front", "?"),
        span(".back", cell[0]),
      ])
    )
  } else if (cell[1] == 1) {
    // opened
    return span(".cell", cellAttrs,
      span(".card.flipper.flipped", {dataset: {state: 1}}, [
        span(".front", "?"),
        span(".back", cell[0]),
      ])
    )
  } else {
    // done
    return span(".cell", cellAttrs,
      span(".card.flipper.hidden", {dataset: {state: 2}}, [
        span(".front", "?"),
        span(".back", cell[0]),
      ])
    )
  }
})

// [[Cell]] -> VNode
let renderBoard = (board) => {
  let rowsM = board.length
  let colsN = board[0] ? board[0].length : 0
  return div("#content", [
    div(`.board.rows-${rowsM}.cols-${colsN}`,
      chaini((r, i) => mapi((c, j) => renderCell(i, j, c), r), board)
    ),
    div(".menu.center.bordered", [
      div(".item", a(".restart", {href: "#restart"}, "Restart")),
    ])
  ])
}

// () -> VNode
let renderWinScreen = (navi) => {
  return div("#content", [
    h2(".text.center", "You win!"),
    div(".menu.center.bordered", [
      div(".item", a(".restart", {href: "#restart"}, "Restart")),
    ])
  ])
}

// {Observable *} -> {Observable *}
module.exports = (src) => {
  let clickFrom = (s) => src.DOM.select(s).events("click").pluck("currentTarget").share()

  // DERIVED STATE
  let board = src.state2::view("board")

  let derived = {
    isLocked: derive(aboutToLock, board).combineLatest(src.state2::view("lockedForAnimation"), (x, y) => x || y),
    isAboutToClose: derive(aboutToClose, board),
    isAboutToDone: derive(aboutToDone, board),
    isWin: derive(aboutToWin, board),
  }

  // INTENTS
  let intents = {
    openCard: clickFrom(".card[data-state='0']")
      ::pluck("parentNode.dataset"),

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

    // Restart game: close cards, then change content, with a time to end animations
    intents.restartGame::setState("lockedForAnimation", true),
    intents.restartGame.delay(1000)::setState("lockedForAnimation", false),

    intents.restartGame::overState("board", closeOpened),
    intents.restartGame.delay(1000)::overState("board", (_) => randomLetterBoard(...BOARD_SIZE)),

    src.state2Storage::toState("")
  ))

  // DOM
  let DOM = $
    .combineLatest(src.navi, state2, derived.isWin).debounce(1)
    .map(([navi, state, isWin]) => {
      let header = div("#header", [
        h1("Memory Game"),
        menu({navi}),
        div({innerHTML: '<a href="https://github.com/Paqmind/memory-game" class="github-corner"><svg width="80" height="80" viewBox="0 0 250 250" style="fill:#151513; color:#fff; position: absolute; top: 0; border: 0; right: 0;"><path d="M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z"></path><path d="M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2" fill="currentColor" style="transform-origin: 130px 106px;" class="octo-arm"></path><path d="M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z" fill="currentColor" class="octo-body"></path></svg></a><style>.github-corner:hover .octo-arm{animation:octocat-wave 560ms ease-in-out}@keyframes octocat-wave{0%,100%{transform:rotate(0)}20%,60%{transform:rotate(-25deg)}40%,80%{transform:rotate(10deg)}}@media (max-width:500px){.github-corner:hover .octo-arm{animation:none}.github-corner .octo-arm{animation:octocat-wave 560ms ease-in-out}}</style>'})
      ])

      let footer = div("#footer", [
        p(".copyright", [decode("&copy;"), " Paqmind team, 2016"]),
      ])

      let content = isWin ?
        renderWinScreen() :
        renderBoard(state.board)

      return div("#wrapper", [header, content, footer])
    })

  // SINKS
  return {DOM, state2}
}

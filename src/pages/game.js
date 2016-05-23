let R = require("ramda")
let {assoc, compose, curry, identity} = require("ramda")
let {Observable: $} = require("rx")
let {atTrue, derive, filterBy, overState, pluck, render, setState, store, toOverState} = require("rx-utils")
let gameHelpers = require("../helpers/game")
let {gameState} = require("../types")
let {openDelayMs, presets} = require("../constants")
let {makeEmptyBoard, makeRandomBoard} = require("../makers")
let gameView = require("../views/game")

let stateLens = curry((i, j) => compose(R.lensIndex(i), R.lensIndex(j), R.lensIndex(1)))

let preset = presets.medium

let GameState = gameState(...preset.boardSize)

let emptyState = () => GameState({
  started: false,
  ended: false,
  paused: false,
  timeout: preset.timeout,
  board: makeEmptyBoard(...preset.boardSize),
})

let initState = () => GameState({
  started: true,
  ended: false,
  paused: false,
  timeout: preset.timeout,
  board: makeRandomBoard(...preset.boardSize),
})

let makeDerived = (state2) => {
  return {
    flags: derive((game) => {
      return {
        closeCards: gameHelpers.shouldCloseCards(game),
        doneCards: gameHelpers.shouldDoneCards(game),
        lockBoard: gameHelpers.shouldLockBoard(game),
        winGame: gameHelpers.shouldWinGame(game),
        loseGame: gameHelpers.shouldLoseGame(game),
      }
    }, state2)
  }
}

let makeIntents = (DOM) => {
  let clickFrom = (s) => DOM.select(s).events("click").pluck("currentTarget").share()

  return {
    startGame: clickFrom(".start"),
    exitGame: clickFrom(".exit"),
    pauseGame: clickFrom(".pause"),
    resumeGame: clickFrom(".resume"),
    openCard: clickFrom(".card[data-state='closed']"),
  }
}

let makeActions = ({state2, derived, intents}) => {
  return {
    startGame: intents.startGame
      ::filterBy(state2.combineLatest(derived.flags, gameHelpers.allowStartGame))
      .share(),

    exitGame: intents.exitGame
      ::filterBy(state2.combineLatest(derived.flags, gameHelpers.allowExitGame))
      .share(),

    pauseGame: intents.pauseGame
      ::filterBy(state2.combineLatest(derived.flags, gameHelpers.allowPauseGame))
      .share(),

    resumeGame: intents.resumeGame
      ::filterBy(state2.combineLatest(derived.flags, gameHelpers.allowResumeGame))
      .share(),

    openCard: intents.openCard
      ::filterBy(state2.combineLatest(derived.flags, gameHelpers.allowOpenCard))
      ::pluck("parentNode.dataset")
      .share(),

    tick: $.interval(1000)
      ::filterBy(state2.combineLatest(derived.flags, gameHelpers.allowTick))
      .share(),
  }
}

let makeUpdate2 = ({update2, derived, actions}) => {
  return $.merge(
    // Start / exit game
    actions.startGame::overState("", (_) => initState()),
    actions.exitGame::overState("", (_) => emptyState()),

    // Pause / resume game
    actions.pauseGame::setState("paused", true),
    actions.resumeGame::setState("paused", false),

    // Open card
    actions.openCard::toOverState("board", (cell) => (state) => {
      let ls = stateLens(Number(cell.row), Number(cell.col))
      return R.set(ls, "opened", state)
    }),

    // Close / done cards
    derived.flags::atTrue("closeCards")::overState("board", gameHelpers.closeOpened).delay(openDelayMs),
    derived.flags::atTrue("doneCards")::overState("board", gameHelpers.doneOpened),

    // Ticker
    actions.tick::overState("timeout", (t) => t > 0 ? t - 1 : t),

    // Auto win / lose
    derived.flags::atTrue("winGame")::setState("ended", "win"),
    derived.flags::atTrue("loseGame")::setState("ended", "defeat")
  )
}

module.exports = (src) => {
  let derived = makeDerived(src.state2)

  let intents = makeIntents(src.DOM)

  let actions = makeActions({state2: src.state2, derived, intents})

  let update2 = makeUpdate2({derived, intents, actions})

  let state2 = store(emptyState(), update2).map((x) => GameState(x))

  return {
    title: $.of("Game | Memory Game"),

    DOM: render(gameView, [src.navi, state2, derived.flags]),

    state2,
  }
}

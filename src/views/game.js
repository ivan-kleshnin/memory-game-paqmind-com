let {curry} = require("ramda")
let {decode} = require("ent")
let {a, div, em, h1, h2, p, small, span} = require("@cycle/dom")
let {chaini, mapi} = require("../helpers/common")
let {header, footer, menu} = require("./common")
let gameHelpers = require("../helpers/game")


// Game -> VNode
let screen = (game) => {
  return div("#content", [
    status(game),
    canvas(game),
    buttons(game),
  ])
}

// Game -> VNode
let status = (game) => {
  // TODO refactor (?)
  return div(".menu.center", [
    game.started ?
      div(".item", small(em(a(`Time left: ${game.timeout} s`)))) :
      div(".item", small(em("Are you ready?"))),

    game.paused ?
      div(".item", small(a(`Paused`))) :
      null,
  ])
}

// Game -> VNode
let canvas = (game) => {
  if (game.ended) {
    return game.ended == "win" ?
      h2(".text.center.win-title", "You win!") :
      h2(".text.center.win-title", "You lose!")
  } else {
    return boardView(game.board)
  }
}

// Game -> VNode
let buttons = (game) => {
  return div(".menu.center.bordered", [
    gameHelpers.allowStartGame(game) ?
      div(".item", a(".start", "New Game")) :
      null,

    gameHelpers.allowExitGame(game) ?
      div(".item", a(".exit", "Exit")) :
      null,

    gameHelpers.allowPauseGame(game) ?
      div(".item", a(".pause", "Pause")) :
      null,

    gameHelpers.allowResumeGame(game) ?
      div(".item", a(".resume", "Resume")) :
      null,
  ])
}

// Board -> VNode
let boardView = (board) => {
  let rowsM = board.length
  let colsN = board[0] ? board[0].length : 0
  return div(`.board.rows-${rowsM}.cols-${colsN}`,
    chaini((r, i) => mapi((c, j) => cellView(i, j, c), r), board)
  )
}

// Number -> Number -> Card -> VNode
let cellView = curry((i, j, card) => {
  return span(".cell", {dataset: {row: i, col: j}},
    cardView(card)
  )
})

// Card -> VNode
let cardView = (card) => {
  let [payload, state] = card
  if (state == "empty") {
    return span(".card", {dataset: {state: "empty"}}, [
      span(".front"),
      span(".back"),
    ])
  } else if (state == "closed") {
    return span(".card", {dataset: {state: "closed"}}, [
      span(".front", "?"),
      span(".back", payload),
    ])
  } else if (state == "opened") {
    return span(".card.flipped", {dataset: {state: "opened"}}, [
      span(".front", "?"),
      span(".back", payload),
    ])
  } else if (state == "done") {
    return span(".card.flipped.hidden", {dataset: {state: "done"}}, [
      span(".front", "?"),
      span(".back", payload),
    ])
  }
}


module.exports = (navi, game, flags) => {
  return div("#wrapper", [
    header(navi),
    screen(game),
    footer(),
  ])
}

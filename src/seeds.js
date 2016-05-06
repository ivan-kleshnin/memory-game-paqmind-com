let {BOARD_SIZE} = require("./constants")
let {makeLetterBoard} = require("./makers")

let seeds = {
  board: makeLetterBoard(...BOARD_SIZE),
}

module.exports = seeds

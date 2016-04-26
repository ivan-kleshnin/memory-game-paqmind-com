let {boardSize} = require("../rules")
let {makeLetterBoard} = require("../makers")

let seeds = {
  board: makeLetterBoard(...boardSize),
}

module.exports = seeds

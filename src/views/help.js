let {div, h1, p} = require("@cycle/dom")
let {menu} = require("./common")

module.exports = (navi) => {
  return div([
    h1("Memory Game"),
    menu(navi),
    p(["[Not found]"])
  ])
}

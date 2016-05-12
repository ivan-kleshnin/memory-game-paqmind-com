let {Observable: $} = require("rx")
let {div, h1, p} = require("@cycle/dom")
let menu = require("../chunks/menu")

module.exports = function (src) {
  // DOM
  let DOM = src.navi.map((navi) => {
    return div([
      h1("Memory Game"),
      menu({navi}),
      p(["[Not found]"])
    ])
  })

  // TITLE
  let title = $.of("Not found | Memory Game")

  return {DOM, title}
}

 let {div} = require("@cycle/dom")

module.exports = function ({navi}) {
  let {aa} = navi
  return div([
    div(aa({href: "/"}, "Game")),
    div(aa({href: "/help"}, "Help")),
    div(aa({href: "/records"}, "Records")),
  ])
}

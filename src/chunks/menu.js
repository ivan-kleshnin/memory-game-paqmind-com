let {div} = require("@cycle/dom")

module.exports = function ({navi}) {
  let {aa} = navi
  return div(".menu.center.bottom-bordered", [
    div(".item", aa({href: "/"}, "Game")),
    div(".item", aa({href: "/records"}, "Records")),
    div(".item", aa({href: "/help"}, "Help")),
  ])
}

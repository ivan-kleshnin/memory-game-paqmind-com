let {Observable: $} = require("rx")
let {render} = require("rx-utils")
let view = require("../views/not-found")

module.exports = (src) => {
  return {
    title: $.of("Not found | Memory Game"),

    DOM: render(view, [src.navi]),
  }
}

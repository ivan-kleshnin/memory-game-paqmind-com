let {Observable: $} = require("rx")
let storage = require("store")

let makeURLDriver = function () {
  return function (url) {
    url.subscribe((url) => {
      window.history.pushState(null, "", url) // no associated state, no title
    })
  }
}

let makeLogDriver = function () {
  return function (message) {
    message.subscribe((msg) => {
      console.log(msg)
    })
  }
}

let makeLocalStorageDriver = function (key) {
  return function (state) {
    let unload = $.fromEvent(window, "unload")
    state.sample(unload).subscribe((state) => {
      storage.set(key, state)
    })
    return state
  }
}

exports.makeURLDriver = makeURLDriver
exports.makeLogDriver = makeLogDriver
exports.makeLocalStorageDriver = makeLocalStorageDriver

let {isNil, propEq} = require("ramda")
let {always} = require("./helpers")
let {Observable: $, ReplaySubject} = require("rx")
let storage = require("store")

let makeURLDriver = () => {
  return (url) => {
    url.subscribe((url) => {
      window.history.pushState(null, "", url) // no associated state, no title
    })
  }
}

let makeDocumentTitleDriver = () => {
  return (title) => {
    title.subscribe((title) => {
      document.title = title
    })
  }
}

let makeLogDriver = () => {
  return (message) => {
    message.subscribe((message) => {
      console.log(message)
    })
  }
}

let makeLocalStorageDriver = () => {
  return (sink) => {
    sink.subscribe((data) => {
      if (isNil(data)) {
        storage.clear()
      } else {
        let {key, value} = data
        storage.set(key, value)
      }
    })

    return {
      get: (key) => {
        return sink
          .filter(propEq("key", key))
          .pluck("value")
          .startWith(storage.get(key))
      }
    }
  }
}

exports.makeURLDriver = makeURLDriver
exports.makeDocumentTitleDriver = makeDocumentTitleDriver
exports.makeLogDriver = makeLogDriver
exports.makeLocalStorageDriver = makeLocalStorageDriver

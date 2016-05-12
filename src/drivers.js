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
        console.log("driver writing", "'" + key + "'", JSON.stringify(value))
        storage.set(key, value)
      }
    })

    return {
      get: (key) => {
        console.log("calling get with key '" + key + "'")
        return sink
          .filter(propEq("key", key))
          .pluck("value")
          .startWith(storage.get(key))
          .tap((data) => {
            console.log("driver reading", "'" + key + "'", JSON.stringify(data))
          })
      }
    }
  }
}

exports.makeURLDriver = makeURLDriver
exports.makeLogDriver = makeLogDriver
exports.makeLocalStorageDriver = makeLocalStorageDriver

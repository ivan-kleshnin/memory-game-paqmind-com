let R = require("ramda")
let {assoc, curry, identity, is, keys, map, not, range, reduce, repeat, split, values} = require("ramda")
let {Observable: $} = require("rx")
let {always, appendSliding, fst, snd, lens} = require("./helpers/common") // flattenObject, unflattenObject

// s -> (s -> s) -> s
let scanFn = curry((state, updateFn) => {
  if (!is(Function, updateFn) || updateFn.length != 1) {
    throw Error("updateFn must be a function with arity 1, got " + updateFn)
  } else {
    return updateFn(state)
  }
})

// (Observable a ->) String -> Observable b
let pluck = function (path) {
  let ls = lens(path)
  return this.map((v) => R.view(ls, v)).share()
}

// (Observable a ->) [String] -> Observable b
let pluckN = function (paths) {
  let lss = map(lens, paths)
  return this.map((v) => map((ls) => R.view(ls, v), lss)).share()
}

// TODO memoize `view` and `viewN` ?!

// (Observable a ->) String -> Observable b
let view = function (path) {
  let ls = lens(path)
  return this
    .map((v) => R.view(ls, v))
    .distinctUntilChanged()
    .shareReplay(1)
}

// (Observable a ->) [String] -> Observable b
let viewN = function (paths) {
  let lss = map(lens, paths)
  return this
    .map((v) => map((ls) => R.view(ls, v), lss))
    .distinctUntilChanged()
    .shareReplay(1)
}

// (* -> b) -> [Observable *] -> Observable b
let deriveN = curry((deriveFn, os) => {
  return $.combineLatest(...os, deriveFn).distinctUntilChanged().shareReplay(1)
})

// (a -> b) -> Observable a -> Observable b
let derive = curry((deriveFn, os) => {
  return deriveN(deriveFn, [os])
})

// (...* -> VNode) -> [Observable *] -> Observable VNode
let render = curry((viewFn, os) => {
  return $
    .combineLatest(...os)
    .debounce(1)
    .map((args) => viewFn(...args))
})

// s -> Observable (s -> s) -> Observable s
let store = curry((seed, update) => {
  return update
    .startWith(seed)
    .scan(scanFn)
    .distinctUntilChanged()
    .shareReplay(1)
})

let history = function (n) {
  if (n <= 0) {
    throw Error("n must be an unsigned integer, got "+ String(n))
  }
  let put = appendSliding(n)
  return this.scan((stateHistory, newState) => {
    return put(newState, stateHistory)
  }, repeat(null, n - 1))
}

// Apply fn to upstream value, apply resulting function to state fragment
// (Observable uv ->) String, (uv -> (sv -> sv)) -> Observable fn
let toOverState = function (path, fn) {
  let ls = lens(path)
  return this.map((v) => (s) => R.over(ls, fn(v), s))
}

// Apply fn to upstream value, replace state fragment with resulting value
// (Observable uv ->) String, (uv -> sv) -> Observable fn
let toSetState = function (path, fn) {
  let ls = lens(path)
  return this.map((v) => (s) => R.set(ls, fn(v), s))
}

// Apply fn to state fragment
// (Observable uv ->) String, (sv -> sv) -> Observable fn
let overState = function (path, fn) {
  return this::toOverState(path, always(fn))
}

// Replace state fragment with v
// (Observable uv ->) String, sv -> Observable fn
let setState = function (path, v) {
  return this::toSetState(path, always(v))
}

// Replace state fragment with upstream value
// (Observable v ->) String -> Observable fn
let toState = function (path) {
  return this::toSetState(path, identity)
}

// (Observable a ->) Observable Boolean -> Observable a
let filterBy = function (o) {
  return this.withLatestFrom(o).filter(snd).map(fst)
}

// (Observable a ->) Observable Boolean -> Observable a
let rejectBy = function (o) {
  return this::filterBy(o.map(not))
}

// (Observable a ->) String -> v -> Observable b
let at = function (path, filterFn) {
  return this.sample(this::pluck(path).filter(filterFn))
}

// (Observable a ->) String -> Observable b
let atTrue = function (path) {
  return this::at(path, identity)
}

// (Observable a ->) String -> Observable b
let atFalse = function (path) {
  return this::at(path, not(identity))
}

exports.scanFn = scanFn

exports.pluck = pluck
exports.pluckN = pluckN
exports.view = view
exports.viewN = viewN
exports.derive = derive
exports.deriveN = deriveN
exports.render = render

exports.store = store
exports.history = history

exports.toOverState = toOverState
exports.toSetState = toSetState
exports.overState = overState
exports.setState = setState
exports.toState = toState

exports.filterBy = filterBy
exports.rejectBy = rejectBy

exports.at = at
exports.atTrue = atTrue
exports.atFalse = atFalse

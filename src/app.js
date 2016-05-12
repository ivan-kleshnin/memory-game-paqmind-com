require("babel-polyfill")
let {identity, merge, prop} = require("ramda")
let Url = require("url")
let Class = require("classnames")
let {Observable: $, ReplaySubject} = require("rx")
let storage = require("store")
let Cycle = require("@cycle/core")
let {a, makeDOMDriver} = require("@cycle/dom")
let {fst, snd} = require("./helpers")
let {history, pluck, store, toState, view} = require("./rx.utils.js")
let {makeURLDriver, makeLogDriver, makeLocalStorageDriver} = require("./drivers")
let {isActiveUrl, isActiveRoute} = require("./routes")
let seeds = require("./seeds/app")
require("./styles/index.less")

// storage.clear()

// Set env variable, to use in the template later
if (process.env.NODE_ENV == "development") {
  window.env = "development"
} else if (process.env.NODE_ENV == "production") {
  window.env = "production"
}

let windowLoad = $.fromEvent(window, "load")
let windowUnload = $.fromEvent(window, "unload")

let makeStateKey = () => {
  return "state"
}

let makeState2Key = (navi) => {
  return "state2 | " + navi.route + " | " + JSON.stringify(navi.params)
}

let makePage = (pageHistory) => {
  return pageHistory
    .map(snd)
    .pluck("sinks")
    .shareReplay(1)
}

let makePageLeave = (pageHistory) => {
  return $.merge(
      pageHistory.map(fst).filter(identity),
      pageHistory.map(snd).sample(windowUnload)
    )
    .pluck("navi")
    .map(({route, params}) => ({route, params}))
    .share(1)
}

let makePageEnter = (pageHistory) => {
  return pageHistory
    .map(snd)
    .pluck("navi")
    .map(({route, params}) => ({route, params}))
    .share(1)
}

// main :: {Observable *} -> {Observable *}
let main = function (src) {
  // CURRENT PAGE
  let pageHistory = src.navi
    .sample(src.navi::view("route")) // remount only when page *type* changes...
    .scan((prevPage, navi) => {
      // Unsubscribe previous page (if there was)
      if (prevPage && prevPage.subscriptions) {
        prevPage.subscriptions.forEach((s) => s.dispose())
      }

      // Make disposable sinks
      let sinkProxies = {
        state2: new ReplaySubject(1),
        redirect: new ReplaySubject(1),
        update: new ReplaySubject(1),
        DOM: new ReplaySubject(1),
        log: new ReplaySubject(1),
        title: new ReplaySubject(1),
      }

      // Run page
      let sinks = merge({
        state2: $.empty(),   // nested state loop
        redirect: $.empty(), // affects navi
        update: $.empty(),   // affects state
        DOM: $.empty(),      // affects DOM
        log: $.empty(),      // affects log
        title: $.empty(),    // affects title
      }, navi.page(merge(src, {state2: sinkProxies.state2})))

      // Subscribe current page
      let subscriptions = [
        sinks.state2.subscribe(sinkProxies.state2.asObserver()),
        sinks.redirect.subscribe(sinkProxies.redirect.asObserver()),
        sinks.update.subscribe(sinkProxies.update.asObserver()),
        sinks.DOM.subscribe(sinkProxies.DOM.asObserver()),
        sinks.log.subscribe(sinkProxies.log.asObserver()),
        sinks.title.subscribe(sinkProxies.title.asObserver()),
      ]

      return {navi, sinks: sinkProxies, subscriptions}
    }, {})
    ::history(2)
    .shareReplay(1)

  let page = makePage(pageHistory)
  let pageLeave = makePageLeave(pageHistory)
  let pageEnter = makePageEnter(pageHistory)

  pageLeave.subscribe((d) => {
    console.log("pageLeave:", JSON.stringify(d))
  })
  pageEnter.subscribe((d) => {
    console.log("pageEnter:", JSON.stringify(d))
  })

  // INTENTS
  let intents = {
    redirect: src.DOM.select("a:not([rel=external])")
      .events("click")
      .filter((event) => !(/:\/\//.test(event.target.getAttribute("href")))) // drop links with protocols (as external)
      .do((event) => event.preventDefault())
      ::pluck("target.href")             // pick normalized property
      .map((url) => Url.parse(url).path) // keep pathname + querystring only
      .share(),
  }

  // NAVI
  let navi = $.merge(intents.redirect, page.flatMapLatest(prop("redirect")))
    .startWith(window.location.pathname)
    .distinctUntilChanged()
    .map((url) => {
      let [route, params, page] = window.doroute(url)

      let aa = (...args) => {
        let vnode = a(...args)
        let {href, className} = vnode.properties
        vnode.properties.className = Class(className, {active: isActiveUrl(url, href)}) // TODO or rather `isActiveRoute`?
        return vnode
      }

      return {
        url,                                 // :: String
        route,                               // :: String
        params,                              // :: {*}
        page,                                // :: {Observable *} -> {Observable *}
        isActiveUrl: isActiveUrl(url),       // :: String -> Boolean
        isActiveRoute: isActiveRoute(route), // :: String -> Boolean
        aa,
      }
    })
    .distinctUntilChanged().shareReplay(1)
    .delay(1) // shift to the next tick (navi <- routing: immediate)

  // UPDATE
  let update = $.merge(
    // Updates from page
    page.flatMapLatest(prop("update")),

    // Load state from localStorage
    windowLoad
      .withLatestFrom(src.localStorage.get(makeStateKey(), (_, s) => s))
      .filter(identity)
      ::toState("")
  )

  // UPDATE2
  let storageGet = src.localStorage.get
  let update2 = $.merge(
    // Load state2 from localStorage
    pageEnter
      .flatMapLatest((d) => src.localStorage.get(makeState2Key(d)))
      .filter(identity)
      ::toState("")
  ).delay(1)

  // STATE
  let state = store(seeds, update)

  // STATE2
  let state2 = page.flatMapLatest(prop("state2"))

  // LOCAL STORAGE
  let localStorage = $.merge(
    // Save state to localStorage
    pageLeave.withLatestFrom(state , (_, s) => ({key: makeStateKey(), value: s})),

    // Save state2 to localStorage
    pageLeave.withLatestFrom(state2, (d, s2) => ({key: makeState2Key(d), value: s2}))
  )

  // SINKS
  return {
    navi: navi,

    state: state,

    state2: state2,

    update2: update2,

    DOM: page.flatMapLatest(prop("DOM")),

    URL: navi::view("url"),

    log: page.flatMapLatest(prop("log")),

    localStorage: localStorage,
  }
}

Cycle.run(main, {
  navi: identity,

  state: identity,

  state2: identity,

  update2: identity,

  DOM: makeDOMDriver("#app"),

  URL: makeURLDriver(),

  log: makeLogDriver(),

  localStorage: makeLocalStorageDriver(),
})

require("babel-polyfill")
let {identity, merge, prop} = require("ramda")
let Url = require("url")
let Class = require("classnames")
let {Observable: $, ReplaySubject} = require("rx")
let storage = require("store")
let Cycle = require("@cycle/core")
let {a, makeDOMDriver} = require("@cycle/dom")
let {fst, snd} = require("./helpers/common")
let {history, view, pluck, store, toState} = require("./rx.utils.js")
let {makeURLDriver, makeDocumentTitleDriver, makeLogDriver, makeLocalStorageDriver} = require("./drivers")
let {AppState} = require("./types")
let {isActiveUrl, isActiveRoute} = require("./routes")
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
    .share()
}

let makePageEnter = (pageHistory) => {
  return pageHistory
    .map(snd)
    .pluck("navi")
    .map(({route, params}) => ({route, params}))
    .share()
}

let main = (src) => {
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
        redirect: new ReplaySubject(1),
        update: new ReplaySubject(1),
        DOM: new ReplaySubject(1),
        log: new ReplaySubject(1),
        title: new ReplaySubject(1),
        state2: new ReplaySubject(1),
      }

      // Run page
      let sinks = merge({
        redirect: $.empty(), // affects navi
        update: $.empty(),   // affects state
        DOM: $.empty(),      // affects DOM
        log: $.empty(),      // affects log
        title: $.empty(),    // affects title
        state2: $.empty(),   // nested state loop
      }, navi.page(merge(src, {state2: sinkProxies.state2})))

      // Subscribe current page
      let subscriptions = [
        sinks.redirect.subscribe(sinkProxies.redirect.asObserver()),
        sinks.update.subscribe(sinkProxies.update.asObserver()),
        sinks.DOM.subscribe(sinkProxies.DOM.asObserver()),
        sinks.log.subscribe(sinkProxies.log.asObserver()),
        sinks.title.subscribe(sinkProxies.title.asObserver()),
        sinks.state2.subscribe(sinkProxies.state2.asObserver()),
      ]

      return {navi, sinks: sinkProxies, subscriptions}
    }, {})
    ::history(2)
    .shareReplay(1)

  let page = makePage(pageHistory)
  let pageLeave = makePageLeave(pageHistory)
  let pageEnter = makePageEnter(pageHistory)

  // INTENTS
  let intents = {
    redirect: src.DOM.select("a:not([rel=external])")
      .events("click")
      .filter((event) => event.target.getAttribute("href"))                  // ignore links with no href
      .filter((event) => !(/:\/\//.test(event.target.getAttribute("href")))) // ignore links with protocols (as external)
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

  // UPDATE2
  let update2 = $.merge(
    // Load state2 from localStorage
    pageEnter
      .flatMapLatest((d) => src.localStorage.get(makeState2Key(d)))
      .filter(identity)
      ::toState("")
  ).delay(1)

  // STATE
  let state = store({}, $.empty()).map((s) => AppState(s))

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

    update2: $.empty(),

    DOM: page.flatMapLatest(prop("DOM")),

    URL: navi::view("url"),

    title: page.flatMapLatest(prop("title")),

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

  title: makeDocumentTitleDriver(),

  log: makeLogDriver(),

  localStorage: makeLocalStorageDriver(),
})

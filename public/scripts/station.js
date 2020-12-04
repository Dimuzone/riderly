// imports (for standardjs)
const {
  firebase, db, timediff, L: Leaflet,
  getrts, getstns, fmtstn, patch,
  main, header, div, section,
  h1, h2, h3, span, a, strong, button
} = window
const auth = firebase.auth()

// HTML refs
const $main = document.querySelector('main')

// define classes for info report display
const levels = {
  flags: ['-good', '-okay', '-bad'],
  seating: ['Empty', 'Seating only', 'Full'],
  timing: ['On time', 'Late', 'Very late'],
  masking: ['Complete', 'Partial', 'Few']
}

// state defs
const state = {
  routes: JSON.parse(window.localStorage.routes || '[]'),
  recents: JSON.parse(window.localStorage.recents || '[]'),
  reports: JSON.parse(window.sessionStorage.reports || '[]'),
  reportLastUpdate: JSON.parse(window.sessionStorage.reportLastUpdate || 0),
  messages: JSON.parse(window.sessionStorage.messages || '[]'),
  messageLastUpdate: JSON.parse(window.sessionStorage.messageLastUpdate || 0),
  user: JSON.parse(window.sessionStorage.user || null),
  search: JSON.parse(window.sessionStorage.search || null),
  station: null,
  route: null,
  path: null,
  map: {
    leaflet: null,
    marker: null
  },
  init: false
}

// init()
// page logic entry point
// resolves data based on hash
;(async function init () {
  // extract data from hash
  const [rtid, stnid] = window.location.hash.slice(1).split('/')

  // resolve all routes from cache, or db if nonexistent
  state.routes = await getrts()
  const route = state.routes.find(rt => rt.id === rtid)
  if (!route) {
    return patch($main, 'not found')
  }

  // resolve each station id inside the route path
  route.path = await getstns(route.path)

  // break early if route isn't found in db
  const station = route.path.find(stn => stn.id === +stnid)
  if (!station) {
    return patch($main, 'not found')
  }

  // this route and station exists. we can get data from it
  state.route = route
  state.station = station

  // response optimization:
  // use cached user if existent,
  // otherwise wait for confirmation of logged in user
  if (state.user) {
    mount(state.user)
  } else {
    auth.onAuthStateChanged(mount)
  }
})()

// mount(user)
// resolves user into page state,
// performs first render,
// and appends listeners
async function mount (user) {
  // we only want to perform this procedure once
  if (state.init) return
  state.init = true

  const station = state.station

  // if a user we haven't cached yet is logged in,
  // get their data from the db and cache
  // (technically not necessary for the chat page,
  // but if we're going to cache user data for
  // faster page loads it should be valid across
  // all pages)
  if (user && !state.user) {
    // get all the user's data from db
    const userdoc = await db.collection('users').doc(user.uid).get()
    const userdata = userdoc.data()

    // normalize user metadata
    userdata.uid = user.uid
    userdata.id = userdata.email
    delete userdata.email

    // cache user
    window.sessionStorage.user = JSON.stringify(userdata)

    // reflect user data on page
    state.user = userdata
  } else if (!user) {
    // assign a random token to this user from localstorage
    let token = window.localStorage.token
    if (!token) {
      token = Math.random().toString().slice(2)
      window.localStorage.token = token
    }
    state.user = {
      userid: token,
      username: 'guest',
      saves: []
    }
  }

  // initial render of the selected station
  visit(station, state)

  // listen for reports
  db.collection('reports')
    .orderBy('timestamp', 'desc')
    .where('timestamp', '>', state.reportLastUpdate)
    .onSnapshot(col => {
      const news = []
      for (const doc of col.docs) {
        // flatten report data structure
        const rep = { ...doc.data(), id: doc.id }
        const cached = state.reports.find(cached => cached.id === rep.id)
        if (!cached) {
          // we don't have this report cached; add it
          news.push(rep)
        }
      }

      // cache and update html if we found a new report
      if (news.length) {
        const reports = [...state.reports, ...news]
        reports.sort((a, b) => b.timestamp - a.timestamp)
        window.sessionStorage.reports = JSON.stringify(reports)
        window.sessionStorage.reportLastUpdate = Date.now()
        update({ reports, reportLastUpdate: Date.now() })
      }
    })

  // listen for messages
  db.collection('messages')
    .orderBy('timestamp', 'desc')
    .where('timestamp', '>', state.messageLastUpdate)
    .onSnapshot(col => {
      const news = []
      for (const doc of col.docs) {
        // flatten message data structure
        const msg = { ...doc.data(), id: doc.id }
        const cached = state.messages.find(cached => cached.id === msg.id)
        if (!cached) {
          // we don't have this message cached; add it
          news.push(msg)
        }
      }

      // cache and update html if we found a new message
      if (news.length) {
        const messages = [...state.messages, ...news]
        messages.sort((a, b) => b.timestamp - a.timestamp)
        window.sessionStorage.messages = JSON.stringify(messages)
        window.sessionStorage.messageLastUpdate = Date.now()
        update({ messages, messageLastUpdate: Date.now() })
      }
    })
}

// visit(station, state)
// adds station page to recently visited stations,
// updates maps, and readds markers
function visit (station, state) {
  const { recents, route, map } = state
  state.station = station

  // use formatted station name for everything
  const stnfmt = fmtstn(station.name)
  station.name = stnfmt[0]
  station.subname = stnfmt[1]

  // add this page to recently visited station
  const id = route.id + '/' + station.id
  if (recents.includes(id)) {
    recents.splice(recents.indexOf(id), 1)
  }
  recents.push(id)
  window.localStorage.recents = JSON.stringify(recents)

  // rerender page
  update({ station, route })

  // init map if it doesn't exist
  if (!map.leaflet) map.leaflet = Leaflet.mount('map')
  else map.leaflet.setView([0, 0], 13)
  map.leaflet.setView([station.lat, station.long], 13)

  // route line
  if (map.line) map.line.remove()
  map.line = Leaflet.polyline(route.path.map(station => [station.lat, station.long]), {
    color: 'rgba(0, 0, 255, 0.5)'
  }).addTo(map.leaflet)

  // station marker
  if (map.marker) map.marker.remove()
  map.marker = Leaflet.marker([station.lat, station.long])
    .addTo(map.leaflet)
    .bindTooltip('<strong>' + station.name + '</strong>')
    .openTooltip()
}

// update(data)
// updates page state with a partial state patch,
// then updates the page html structure
function update (data) {
  Object.assign(state, data)
  patch($main, StationPage(state))
}

// StationPage(state) -> vnode
// component defining the HTML structure for the station page
const StationPage = (state) => {
  const { station, route, user, search } = state

  // get all messages on this route
  const messages = state.messages
    .filter(msg => msg.route === route.id)
    .sort((a, b) => b.timestamp - a.timestamp)

  // get all reports for this station
  const report = state.reports
    .filter(rpt => +rpt.station === station.id && rpt.route === route.id)
    .sort((a, b) => b.timestamp - a.timestamp)[0]

  const id = route.id + '/' + station.id

  return main({ class: `page -station -${station.id}` }, [
    header({ class: 'header -color -primary' }, [
      user && div({ class: 'star' }, [
        span({
          class: 'icon -star material-icons',
          onclick: _ => update(toggleSave(state, id))
        }, user.saves.includes(id) ? 'star' : 'star_outline')
      ]),
      div({ class: 'header-text' }, [
        div({ class: 'title-row' }, [
          h1({ class: 'title -small' }, station.name),
          button({ class: 'back', onclick: _ => window.history.back() }, [
            span({ class: 'icon -back material-icons' }, 'keyboard_arrow_left'),
            search ? route.number + route.pattern : 'Home'
          ])
        ]),
        // display subtitle differently
        // depending on whether or not search query exists
        h2({ class: 'subtitle' }, [
          search && `${station.id} · `,
          `${station.subname}`,
          ...(search
            ? []
            : [' (', a({ href: 'route.html#' + route.id }, route.number + route.pattern), ')']
          )
        ])
      ])
    ]),
    Minimap(station, route),
    div({ id: 'map', key: 'map' }),
    section({ class: 'section -info' }, [
      h3({ class: 'section-header section-title' }, 'Transit Information'),
      div({ class: 'section-content infos' }, [
        Info(report, 'seating'),
        Info(report, 'timing'),
        Info(report, 'masking')
      ]),
      a({ class: 'button -action -report', href: `report.html#${id}` }, [
        span({ class: 'icon -edit material-icons-outlined' },
          'edit'),
        'Report changes'
      ])
    ]),
    section({ class: 'section -messages' }, [
      h3({ class: 'section-header section-title' }, 'Recent Messages'),
      messages.length
        ? div({ class: 'section-content messages' }, messages.slice(0, 3).map(Message))
        : span({ class: 'section-content section-notice' }, 'Be the first to say something.'),
      a({ class: 'button -action -chat', href: `chat.html#${id}` }, [
        span({ class: 'icon -talk material-icons-outlined' },
          'question_answer'),
        'Chat on Route ' + route.number + route.pattern
      ])
    ])
  ])
}

// Info(report, category) -> vnode
// component defining the HTML structure for an info category
const Info = (report, category) => {
  // get value for this category (e.g. Empty, Seating only, Full)
  const value = levels[category][report ? report[category] : 0]

  // get class flag (e.g. -good, -okay, -bad)
  const flag = (report ? ' ' + levels.flags[report[category]] : '')

  // get name and icon
  // TODO: define this as a constant outside of the render function
  const { name, icon } = {
    seating: { name: 'Seat availability', icon: 'airline_seat_recline_normal' },
    timing: { name: 'Timing', icon: 'schedule' },
    masking: { name: 'Mask usage', icon: 'masks' }
  }[category]

  return div({ class: 'info' }, [
    span({ class: `icon -metric -${category} material-icons` }, icon),
    div({ class: 'info-box' }, [
      div({ class: 'info-meta' }, [
        span({ class: 'info-name' }, name),
        span({ class: 'info-value' + flag }, value)
      ]),
      span({ class: 'icon material-icons-outlined' }, 'info')
    ])
  ])
}

// Message(message) -> vnode
// component defining the HTML structure for the recent message section
const Message = (message) => {
  const { timestamp, route: routeid, username, content } = message
  const route = state.routes.find(rt => rt.id === routeid)
  const now = Date.now()
  const ago = timediff(timestamp, now)
  return a({ class: 'option -message', href: 'chat.html#' + routeid }, [
    div({ class: 'option-lhs' }, [
      span({ class: 'icon -message material-icons-outlined' },
        'sms'),
      div({ class: 'option-meta' }, [
        div({ class: 'option-name' }, `"${content}"`),
        div({ class: 'option-data' },
          ['from ', strong(username), ' on ', strong(route.number + route.pattern)])
      ])
    ]),
    div({ class: 'option-rhs' }, [
      span({ class: 'option-time' }, ago),
      span({ class: 'icon -arrow material-icons' },
        'keyboard_arrow_right')
    ])
  ])
}

// Minimap(station, route) -> vnode
// component defining the HTML structure for the minimap
const Minimap = (station, route) => {
  // determine order in which stations should be displayed in the minimap
  const order = getStopOrder(station, route)
  const [leftstop, centerstop, rightstop] = order
  const [leftname, centername, rightname] = order.map(stop => fmtstn(stop.name)[0])

  // convenience booleans for conditional rendering on selected stops
  const left = leftstop.id === station.id
  const center = centerstop.id === station.id
  const right = rightstop.id === station.id

  // switch the view to the provided station
  const switchstop = station => {
    window.history.replaceState(null, '', `/station.html#${route.id}/${station.id}`)
    visit(station, state)
  }

  // convenience methods for switching stops
  const switchleft = _ => switchstop(leftstop)
  const switchcenter = _ => switchstop(centerstop)
  const switchright = _ => switchstop(rightstop)

  return div({ class: 'station-map' }, [
    center
      // display center station as selected
      ? div({ class: 'station-labels -above' }, [
          span({ class: 'station-label -center -select' }, [
            span({ class: 'icon -arrow -left material-icons', onclick: switchleft },
              'arrow_left'),
            centername,
            span({ class: 'icon -arrow -right material-icons', onclick: switchright },
              'arrow_right')
          ])
        ])
      : div({ class: 'station-labels -above' }, [
        left
          // display left station as selected with right arrow
          ? span({ class: 'station-label -left -select' }, [
              leftname,
              span({ class: 'icon -arrow -right material-icons', onclick: switchcenter },
                'arrow_right')
            ])
          // left station is not selected so make it clickable
          : button({ class: 'station-label -left', onclick: switchleft },
            leftname),
        right
          // display right station as selected with left arrow
          ? span({ class: 'station-label -right -select' }, [
              span({ class: 'icon -arrow -left material-icons', onclick: switchcenter },
                'arrow_left'),
              rightname
            ])
          // right station is not selected so make it clickable
          : button({ class: 'station-label -right', onclick: switchright },
            rightname)
      ]),
    div({ class: 'station-circles' }, [
      left
        ? div({ class: 'station-circle -left -select' })
        : button({ class: 'station-circle -left', onclick: switchleft }),
      center
        ? div({ class: 'station-circle -center -select' })
        : button({ class: 'station-circle -center', onclick: switchcenter }),
      right
        ? div({ class: 'station-circle -right -select' })
        : button({ class: 'station-circle -right', onclick: switchright })
    ]),
    center
      // display left and right labels below circles if center is selected
      ? div({ class: 'station-labels -below' }, [
          button({ class: 'station-label -left', onclick: switchleft },
            leftname),
          button({ class: 'station-label -right', onclick: switchright },
            rightname)
        ])
      // display center label below circles if left or right is selected
      : div({ class: 'station-labels -below' }, [
        button({ class: 'station-label -center', onclick: switchcenter },
          centername)
      ])
  ])
}

// getStopOrder(stop, route) -> [left, center, right]
// determines the order of station labels in the minimap
const getStopOrder = (stop, route) => {
  const index = route.path.indexOf(stop)
  const prev = route.path[index - 1]
  const next = route.path[index + 1]
  if (prev && next) {
    return [prev, stop, next]
  } else if (!prev) {
    const nxnx = route.path[index + 2]
    return [stop, next, nxnx]
  } else if (!next) {
    const pvpv = route.path[index - 2]
    return [pvpv, prev, stop]
  }
}

// toggleSave(state, id) -> patch
// saves or unsaves a station with a route/station id
const toggleSave = (state, id) => {
  const user = state.user
  const saves = user.saves

  // add station if it's not saved, or remove it if it is
  if (!saves.includes(id)) {
    saves.push(id)
  } else {
    saves.splice(saves.indexOf(id), 1)
  }

  // cache saved stations
  user.saves = saves
  window.sessionStorage.user = JSON.stringify(user)

  // update the user saves in database with the local user save
  db.collection('users').doc(user.uid).update({ saves })

  // return data patch for state updating
  return { saves }
}

const {
  firebase, db, timediff, L: Leaflet,
  getrts, getstns, fmtstn, patch,
  main, header, div, section,
  h1, h2, h3, span, a, strong, button
} = window

const auth = firebase.auth()
const $main = document.querySelector('main')

const state = {
  routes: JSON.parse(window.localStorage.routes || '[]'),
  recents: JSON.parse(window.localStorage.recents || '[]'),
  reports: JSON.parse(window.sessionStorage.reports || '[]'),
  messages: JSON.parse(window.sessionStorage.messages || '[]'),
  users: JSON.parse(window.sessionStorage.users || '[]'),
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

const levels = {
  flags: ['-good', '-okay', '-bad'],
  seating: ['Empty', 'Seating only', 'Full'],
  timing: ['On time', 'Late', 'Very late'],
  masking: ['Complete', 'Partial', 'Few']
}

;(async function init () {
  const [rtid, stnid] = window.location.hash.slice(1).split('+')

  state.routes = await getrts()
  const route = state.routes.find(rt => rt.id === rtid)
  if (!route) {
    return patch($main, 'not found')
  }

  route.path = await getstns(route.path)
  const station = route.path.find(stn => stn.id === +stnid)
  if (!station) {
    return patch($main, 'not found')
  }

  state.route = route
  state.station = station
  if (state.user) {
    mount(state.user)
  } else {
    auth.onAuthStateChanged(mount)
  }
})()

async function mount (user) {
  // we only want to perform this procedure once
  if (state.init) return
  state.init = true

  const { station, users } = state

  // if a user we haven't cached yet is logged in
  if (user && !state.user) {
    const userdata = (await db.collection('users').doc(user.uid).get()).data()
    userdata.uid = user.uid
    userdata.id = userdata.email
    delete userdata.email
    users.push(userdata)
    window.sessionStorage.user = JSON.stringify(userdata)
    window.sessionStorage.users = JSON.stringify(users)
    state.user = userdata
  } else if (!user) {
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

  visit(state, station)

  // listen for reports
  db.collection('reports')
    .orderBy('timestamp', 'desc')
    .onSnapshot(col => {
      const news = []
      for (const doc of col.docs) {
        const rep = { ...doc.data(), id: doc.id }
        if (!state.reports.find(cached => cached.id === rep.id)) {
          news.push(rep)
        }
      }
      const reports = [...state.reports, ...news]
      if (news.length) {
        window.sessionStorage.reports = JSON.stringify(reports)
      }
      update({ reports })
    })

  // listen for messages
  db.collection('messages')
    .orderBy('timestamp', 'desc')
    .onSnapshot(col => {
      const news = []
      for (const doc of col.docs) {
        const msg = { ...doc.data(), id: doc.id }
        if (!state.messages.find(cached => cached.id === msg.id)) {
          news.push(msg)
        }
      }
      const messages = [...state.messages, ...news]
      if (news.length) {
        window.sessionStorage.messages = JSON.stringify(messages)
      }
      update({ messages })
    })
}

function visit (state, station) {
  const { recents, route, map } = state
  state.station = station

  const stnfmt = fmtstn(station.name)
  station.name = stnfmt[0]
  station.subname = stnfmt[1]

  const id = route.id + '/' + station.id
  if (recents.includes(id)) {
    recents.splice(recents.indexOf(id), 1)
  }
  recents.push(id)
  window.localStorage.recents = JSON.stringify(recents)

  update({ station, route })

  if (!map.leaflet) map.leaflet = Leaflet.mount('map')
  map.leaflet.setView([0, 0], 13)
  map.leaflet.setView([station.lat, station.lon], 13)

  // route line
  Leaflet.polyline(route.path.map(station => [station.lat, station.lon]), {
    color: 'rgba(0, 0, 255, 0.5)'
  }).addTo(map.leaflet)

  // station marker
  if (map.marker) map.marker.remove()
  map.marker = Leaflet.marker([station.lat, station.lon])
    .addTo(map.leaflet)
    .bindTooltip('<strong>' + station.name + '</strong>')
    .openTooltip()
}

function update (data) {
  Object.assign(state, data)
  patch($main, StationPage(state))
}

const StationPage = (state) => {
  const { station, route, user, search } = state

  const messages = state.messages
    .filter(msg => msg.route === route.id)
    .sort(byTime)

  const report = state.reports
    .filter(rpt => +rpt.station === station.id && rpt.route === route.id)
    .sort(byTime)[0]

  const id = route.id + '/' + station.id

  return main({ class: `page -station -${station.id}` }, [
    header({ class: 'header -color -primary' }, [
      user && div({ class: 'star' }, [
        span({
          class: 'icon -star material-icons',
          onclick: _ => update(toggleSave(state, id))
        }, [
          user.saves.includes(id) ? 'star' : 'star_outline'
        ])
      ]),
      div({ class: 'header-text' }, [
        div({ class: 'title-row' }, [
          h1({ class: 'title -small' }, station.name),
          button({ class: 'back', onclick: _ => window.history.back() }, [
            span({ class: 'icon -back material-icons' }, 'keyboard_arrow_left'),
            search ? route.id : 'Home'
          ])
        ]),
        h2({ class: 'subtitle' }, `${station.id} · ${station.subname}`)
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
      a({ class: 'button -action -report', href: `report.html#${route.id}+${station.id}` }, [
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
      a({ class: 'button -action -chat', href: `chat.html#${route.id}+${station.id}` }, [
        span({ class: 'icon -talk material-icons-outlined' },
          'question_answer'),
        `Chat on Route ${route.id}`
      ])
    ])
  ])
}

const Info = (report, category) => {
  const value = levels[category][report ? report[category] : 0]
  const flag = (report ? ' ' + levels.flags[report[category]] : '')
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

const Message = (message) => {
  const { timestamp, route: routeid, username, content } = message
  const now = Date.now()
  const ago = timediff(timestamp, now)
  return a({ class: 'option -message', href: 'chat.html#' + routeid }, [
    div({ class: 'option-lhs' }, [
      span({ class: 'icon -message material-icons-outlined' },
        'sms'),
      div({ class: 'option-meta' }, [
        div({ class: 'option-name' }, `"${content}"`),
        div({ class: 'option-data' },
          ['from ', strong(username), ' on ', strong(routeid)])
      ])
    ]),
    div({ class: 'option-rhs' }, [
      span({ class: 'option-time' }, ago),
      span({ class: 'icon -arrow material-icons' },
        'keyboard_arrow_right')
    ])
  ])
}

const Minimap = (station, route) => {
  const order = getStopOrder(station, route)
  const [leftstop, centerstop, rightstop] = order
  const [leftname, centername, rightname] = order.map(stop => fmtstn(stop.name)[0])
  const left = leftstop.id === station.id
  const center = centerstop.id === station.id
  const right = rightstop.id === station.id

  const switchstop = station => {
    window.location.assign(`/station.html#${route.id}+${station.id}`)
    visit(state, station)
  }

  const switchleft = _ =>
    switchstop(leftstop)

  const switchcenter = _ =>
    switchstop(centerstop)

  const switchright = _ =>
    switchstop(rightstop)

  return div({ class: 'station-map' }, [
    center
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
          ? span({ class: 'station-label -left -select' }, [
              leftname,
              span({ class: 'icon -arrow -right material-icons', onclick: switchright },
                'arrow_right')
            ])
          : button({ class: 'station-label -left', onclick: switchleft },
            leftname),
        right
          ? span({ class: 'station-label -right -select' }, [
              span({ class: 'icon -arrow -left material-icons', onclick: switchleft },
                'arrow_left'),
              rightname
            ])
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
      ? div({ class: 'station-labels -below' }, [
          button({ class: 'station-label -left', onclick: switchleft },
            leftname),
          button({ class: 'station-label -right', onclick: switchright },
            rightname)
        ])
      : div({ class: 'station-labels -below' }, [
        button({ class: 'station-label -center', onclick: switchcenter },
          centername)
      ])
  ])
}

const toggleSave = (state, id) => {
  const user = state.user
  const saves = user.saves
  if (!saves.includes(id)) {
    saves.push(id)
  } else {
    saves.splice(saves.indexOf(id), 1)
  }
  user.saves = saves
  window.sessionStorage.user = JSON.stringify(user)
  window.sessionStorage.users = JSON.stringify(state.users)
  db.collection('users').doc(user.uid).update({ saves })
  console.log(saves)
  return { saves }
}

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

const byTime = (a, b) =>
  b.timestamp - a.timestamp

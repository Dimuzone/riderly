const {
  db, timediff, fmtstn, L: Leaflet, getstns, patch,
  main, header, div, section,
  h1, h2, h3, span, a, strong, button
} = window

const $main = document.querySelector('main')

const state = {
  routes: JSON.parse(window.localStorage.routes || '[]'),
  reports: JSON.parse(window.localStorage.reports || '[]'),
  messages: JSON.parse(window.localStorage.messages || '[]'),
  station: null,
  path: null
}

const levels = {
  flags: ['-good', '-okay', '-bad'],
  seating: ['Empty', 'Seating only', 'Full'],
  timing: ['On time', 'Late', 'Very late'],
  masking: ['Complete', 'Partial', 'Few']
}

;(async function init () {
  const [rtid, stnid] = window.location.hash.slice(1).split('/')
  const route = state.routes.find(rt => rt.id === rtid)
  if (!route) {
    return patch($main, 'not found')
  }

  route.path = await getstns(route.path)
  const station = route.path.find(stn => stn.id === +stnid)
  if (!station) {
    return patch($main, 'not found')
  }

  console.log(stnid, rtid)
  console.log(station, route)

  const stnfmt = fmtstn(station.name)
  station.name = stnfmt[0]
  station.subname = stnfmt[1]

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
        window.localStorage.reports = JSON.stringify(reports)
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
        window.localStorage.messages = JSON.stringify(messages)
      }
      update({ messages })
    })

  update({ route, station })

  const map = Leaflet.mount('map')
  map.setView([station.lat, station.lon], 13)

  // route line
  Leaflet.polyline(route.path.map(station => [station.lat, station.lon]), {
    color: 'rgba(0, 0, 255, 0.5)'
  }).addTo(map)

  // station marker
  Leaflet.marker([station.lat, station.lon])
    .addTo(map)
    .bindTooltip('<strong>' + station.name + '</strong>')
    .openTooltip()
})()

function update (data) {
  Object.assign(state, data)
  patch($main, StationPage(state))
}

const StationPage = (state) => {
  const { station, route } = state

  const messages = state.messages
    .filter(msg => msg.route === route.id)
    .sort(byTime)

  const report = state.reports
    .filter(rpt => +rpt.station === station.id && rpt.route === route.id)
    .sort(byTime)[0]

  return main({ class: `page -station -${station.id}` }, [
    header({ class: 'header -color -primary' }, [
      div({ class: 'header-text' }, [
        div({ class: 'title-row' }, [
          h1({ class: 'title' }, station.name),
          button({ class: 'back', onclick: _ => window.history.back() }, [
            span({ class: 'icon -back material-icons' }, 'keyboard_arrow_left'),
            route.id
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
      a({ class: 'button -action -report', href: `report.html#${route.id}/${station.id}` }, [
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
      a({ class: 'button -action -chat', href: 'route.html#' + route.id }, [
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
  const [leftstop, centerstop, rightstop] = getStopOrder(station, route)
  const [leftname, centername, rightname] = route.path.map(stop => fmtstn(stop.name)[0])
  const left = leftstop.id === station.id
  const center = centerstop.id === station.id
  const right = rightstop.id === station.id
  const switchstop = _ => _
  return div({ class: 'station-map' }, [
    center
      ? div({ class: 'station-labels -above' }, [
          span({ class: 'station-label -center -select' }, centername)
        ])
      : div({ class: 'station-labels -above' }, [
        left
          ? span({ class: 'station-label -left -select' }, leftname)
          : span({ class: 'station-label -left', onclick: _ => switchstop(leftstop) },
            leftname),
        right
          ? span({ class: 'station-label -right -select' }, rightname)
          : span({ class: 'station-label -right', onclick: _ => switchstop(rightstop) },
            rightname)
      ]),
    div({ class: 'station-circles' }, [
      left
        ? div({ class: 'station-circle -left -select' })
        : div({ class: 'station-circle -left', onclick: _ => switchstop(leftstop) }),
      center
        ? div({ class: 'station-circle -center -select' })
        : div({ class: 'station-circle -center', onclick: _ => switchstop(centerstop) }),
      right
        ? div({ class: 'station-circle -right -select' })
        : div({ class: 'station-circle -right', onclick: _ => switchstop(rightstop) })
    ]),
    center
      ? div({ class: 'station-labels -below' }, [
          span({ class: 'station-label -left', onclick: _ => switchstop(leftstop) },
            leftname),
          span({ class: 'station-label -right', onclick: _ => switchstop(rightstop) },
            rightname)
        ])
      : div({ class: 'station-labels -below' }, [
        span({ class: 'station-label -center', onclick: _ => switchstop(centerstop) },
          centername)
      ])
  ])
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

// const station = cache.stationId
// const route = cache.route
// const stationName = cache.stationName
// const previous = sessionStorage.getItem('before')
// const thisStation = station + '-' + route + '-' + stationName + '-' + previous + '-' + after

// // Save stations button
// firebase.auth().onAuthStateChanged(user => {
//   console.log(user.email)

//   // user log in
//   db.collection('users').doc(user.uid).get().then(users => {
//     star.style.display = 'inherit'
//     const saves = users.data().saves.slice()
//     if (saves.includes(thisStation)) {
//       star.innerText = 'star'
//     }
//   })
// })

// star.onclick = function onClick () {
//   if (star.innerText === 'star_border') {
//     saveStation(station)
//     star.innerText = 'star'
//   } else if (star.innerText === 'star') {
//     removeStation(station)
//     star.innerText = 'star_border'
//   }
// }

// function saveStation (station) {
//   firebase.auth().onAuthStateChanged(user => {
//     const id = user.uid
//     db.collection('users').doc(id).get().then(user => {
//       const saves = user.data().saves.slice()
//       saves.push(thisStation)
//       db.collection('users').doc(id).update({ saves })
//     })
//   })
// }

// function removeStation (station) {
//   firebase.auth().onAuthStateChanged(user => {
//     const id = user.uid
//     db.collection('users').doc(id).get().then(user => {
//       const saves = user.data().saves.slice()
//       if (saves.includes(thisStation)) {
//         saves.splice(saves.indexOf(thisStation), 1)
//       }
//       db.collection('users').doc(id).update({ saves })
//     })
//   })
// }

// // display recent message
// const messages = []
// const stationMessageWrap = document.getElementById('recentmsg')
// db.collection('messages').where('route', '==', cache.route).orderBy('timestamp', 'desc').limit(3)
//   .get().then(col => {
//     col.forEach(doc => messages.push(doc.data()))
//     console.log(messages)
//     console.log(stationMessageWrap)
//     patch(stationMessageWrap, div({ id: 'recentmsg' }, messages.map(renderRecentMsg)))
//   })

// function renderRecentMsg (recentmsg) {
//   const now = Date.now()
//   const ago = timediff(recentmsg.timestamp, now)
//   return div({ class: 'option' }, [
//     div({ class: 'option-data' }, [p({ class: 'option-text' }, [recentmsg.route]),
//       div({ class: 'option-subtext' }, [recentmsg.username + ': ' + recentmsg.content])
//     ]),
//     div({ class: 'timewrap' }, [span({ class: 'time' }, ago),
//       span({ class: 'option-icon material-icons' }, 'chevron_right')])
//   ])
// }

// // local storage for recent stations
// if (localStorage.getItem('recents') == null) {
//   localStorage.setItem('recents', thisStation)
// } else {
//   const recent = localStorage.getItem('recents').split(',')
//   if (!recent.includes(thisStation)) {
//     recent.push(thisStation)
//     localStorage.setItem('recents', recent)
//   }
//   console.log(localStorage.getItem('recents'))
// }

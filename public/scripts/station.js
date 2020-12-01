const {
  firebase, db, timediff, fmtstn, L, getstns, patch,
  main, header, div, section, h1, h2, h3, p, span, button
} = window

const $main = document.querySelector('main')

const state = {
  routes: JSON.parse(window.localStorage.routes || '[]'),
  reports: JSON.parse(window.localStorage.reports || '[]'),
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
  const [stnid, rtid] = window.location.hash.slice(1).split('/')
  const route = state.routes.find(rt => rt.id === rtid)
  if (!route) {
    return patch(document.body, 'not found')
  }

  const path = await getstns(route.path)
  const station = path.find(stn => stn.id === +stnid)
  if (!station) {
    return patch(document.body, 'not found')
  }

  console.log(stnid, rtid)
  console.log(station, route)

  const stnfmt = fmtstn(station.name)
  station.name = stnfmt[0]
  station.subname = stnfmt[1]

  db.collection('reports')
    .orderBy('timestamp', 'desc')
    .onSnapshot(col => {
      const reports = []
      for (const doc of col.docs) {
        const rep = { ...doc.data(), id: doc.id }
        if (!state.reports.find(cached => cached.id === rep.id)) {
          reports.push(rep)
        }
      }
      update({ reports: [...state.reports, reports] })
    })

  update({ route, station, path })

  const leaflet = L.map('map', { zoomSnap: 0.25, zoomDelta: 0.5 })

  L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1Ijoic2VtaWJyYW4iLCJhIjoiY2tpMnc2cTMxMWl2czJ5cGRpYWR4YWExNyJ9.cNgXsMZb5K-7DKOr6jw8ag', {
    id: 'mapbox/streets-v11',
    attribution: 'Data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>' +
    ', Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    tileSize: 512,
    zoomOffset: -1
  }).addTo(leaflet)

  leaflet.setView([station.lat, station.lon], 13)

  L.polyline(path.map(station => [station.lat, station.lon]), {
    color: 'rgba(0, 0, 255, 0.5)'
  }).addTo(leaflet)

  L.marker([station.lat, station.lon])
    .addTo(leaflet)
    .bindTooltip('<strong>' + station.name + '</strong>')
    .openTooltip()
})()

function update (data) {
  Object.assign(state, data)
  patch($main, StationPage(state))
}

const StationPage = (state) => {
  const { station, path, route, reports } = state

  const report = reports
    .filter(rpt => rpt.station === station.id && rpt.route === route.id)
    .sort(byTime)[0]

  return main({ class: `page -station -${station.id}` }, [
    header({ class: 'header -color -primary' }, [
      div({ class: 'header-text' }, [
        div({ class: 'title-row' }, [
          h1({ class: 'title' }, station.name),
          button({ class: 'back', onclick: window.history.back }, [
            span({ class: 'icon -back material-icons' }, 'keyboard_arrow_left'),
            'Home'
          ])
        ]),
        h2({ class: 'subtitle' }, `${station.id} · ${station.subname}`)
      ])
    ]),
    Minimap(station, getStopOrder(station, path)),
    div({ id: 'map', key: 'map' }),
    Infos(report)
  ])
}

const Infos = (report) =>
  section({ class: 'section -info' }, [
    h3({ class: 'section-header section-title' }, 'Transit Information'),
    div({ class: 'section-content infos' }, [
      Info(report, 'seating'),
      Info(report, 'timing'),
      Info(report, 'masking')
    ])
  ])

const Info = (report, category) => {
  const value = levels[category][report ? report[category] : 0]
  const flag = (report ? ' ' + levels.flags[report[category]] : '')
  const { name, icon } = {
    seating: { name: 'Seat availability', icon: 'airline_seat_recline_normal' },
    timing: { name: 'Timing', icon: 'schedule' },
    masking: { name: 'Mask usage', icon: 'masks' }
  }[category]
  return div({ class: 'info' }, [
    span({ class: `icon -metric -${category} material-icons` + flag }, icon),
    div({ class: 'info-box' }, [
      div({ class: 'info-meta' }, [
        span({ class: 'info-name' }, name),
        span({ class: 'info-value' }, value)
      ]),
      span({ class: 'icon material-icons-outlined' }, 'info')
    ])
  ])
}

const Minimap = (station, order) => {
  const [leftstop, centerstop, rightstop] = order
  const [leftname, centername, rightname] = order.map(stop => fmtstn(stop.name)[0])
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
        : div({ class: 'station-circle -right', onclick: _ => switchstop(rightstop) }),
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

const getStopOrder = (stop, path) => {
  const index = path.indexOf(path.find(id => id === stop.id))
  const prev = path[index - 1]
  const next = path[index + 1]
  if (prev && next) {
    return [prev, stop, next]
  } else if (!prev) {
    const nxnx = path[index + 2]
    return [stop, next, nxnx]
  } else if (!next) {
    const pvpv = path[index - 2]
    return [pvpv, prev, stop]
  }
}

const byTime = (a, b) =>
  b.timestamp - a.timestamp

// const cache = {
//   stationId: +sessionStorage.getItem('stationId'),
//   stationName: sessionStorage.getItem('stationName'),
//   stationEnd: sessionStorage.getItem('stationEnd'),
//   route: sessionStorage.getItem('route'),
//   before: sessionStorage.getItem('before'),
//   after: sessionStorage.getItem('after')
// }

// sessionStorage.removeItem('stationEnd')

// let name = cache.stationName
// let before = cache.before
// let after = cache.after

// if (cache.stationEnd === 'first') {
//   before = cache.stationName
//   name = cache.after
//   after = cache.before
//   document.querySelector('.station.-current').classList.remove('-select')
//   document.querySelector('.station.-before').classList.add('-select')
// } else if (cache.stationEnd === 'last') {
//   before = cache.after
//   name = cache.before
//   after = cache.stationName
//   document.querySelector('.station.-current').classList.remove('-select')
//   document.querySelector('.station.-after').classList.add('-select')
// }

// before = normstn(before)[0]
// name = normstn(name)[0]
// after = normstn(after)[0]

// const join = document.getElementById('join')
// join.innerText = 'Join chat for Route ' + cache.route
// join.onclick = _ => {
//   window.location.href = 'chat.html'
// }

// document.getElementById('name').innerText = normstn(cache.stationName)[0]
// document.getElementById('routeAndId').innerText = cache.route + ' - #' + cache.stationId
// document.getElementById('routeId').innerText = cache.route
// document.getElementById('currentName').innerText = name
// document.getElementById('before').innerText = before
// document.getElementById('after').innerText = after

// // Display recent report
// const seating = ['Empty', 'Seating only', 'Full']
// const timing = ['On time', 'Late', 'Very Late']
// const mask = ['Complete', 'Partial', 'Few']
// const colors = ['-green', '-yellow', '-red']

// db.collection('reports')
//   .where('station', '==', cache.stationId)
//   .where('route', '==', cache.route)
//   .orderBy('timestamp', 'desc').limit(1)
//   .get()
//   .then(col => {
//     const reports = []
//     col.forEach(doc => reports.push(doc.data()))
//     const report = reports[0]
//     if (report) {
//       const seatingStatus = document.getElementsByClassName('-seating')[0]
//       seatingStatus.innerText = seating[report.seating]
//       seatingStatus.classList.add(colors[report.seating])

//       const timingStatus = document.getElementsByClassName('-timing')[0]
//       timingStatus.innerText = timing[report.timing]
//       timingStatus.classList.add(colors[report.timing])

//       const maskStatus = document.getElementsByClassName('-mask')[0]
//       maskStatus.innerText = mask[report.masks]
//       maskStatus.classList.add(colors[report.masks])
//     }
//   })

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

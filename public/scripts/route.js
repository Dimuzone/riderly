const {
  fmtstn, normname, getstns, L: Leaflet,
  patch, main, header, div, h1, h2, span, a, button, input
} = window

const $main = document.querySelector('main')
const state = {
  stations: JSON.parse(window.localStorage.stations || '[]'),
  routes: JSON.parse(window.localStorage.routes || '[]'),
  search: JSON.parse(window.sessionStorage.search || '{}'),
  filter: JSON.parse(window.sessionStorage.filter || '{}'),
  path: null
}

;(async function init () {
  const rtid = window.location.hash.slice(1)
  const route = state.routes.find(rt => rt.id === rtid)
  if (!route) {
    return patch($main, 'not found')
  }

  route.path = await getstns(route.path)
  console.log(...route.path)

  update({ route })

  const startstn = route.path[0]
  const startpos = [startstn.lat, startstn.lon]
  const endstn = route.path[route.path.length - 1]
  const endpos = [endstn.lat, endstn.lon]

  // mount map
  const map = Leaflet.mount('map')

  // route line
  const line = Leaflet.polyline(route.path.map(station => [station.lat, station.lon]), {
    color: 'rgba(0, 0, 255, 0.5)'
  }).addTo(map)

  // adjust zoom
  map.fitBounds(line.getBounds())
  setTimeout(_ => map.zoomOut(0.5), 300)

  // start marker
  Leaflet.marker(startpos)
    .addTo(map)
    .bindTooltip('<strong>' + fmtstn(startstn.name)[0] + '</strong>')
    .openTooltip()

  // end marker
  Leaflet.marker(endpos)
    .addTo(map)
    .bindTooltip('<strong>' + fmtstn(endstn.name)[0] + '</strong>')
    .openTooltip()
})()

function update (data) {
  Object.assign(state, data)
  patch($main, RoutePage(state))
}

const RoutePage = (state) => {
  const { route, search, filter } = state
  const stations = route.path
  return main({ class: `page -route -${route.id}` }, [
    header({ class: 'header -color -primary' }, [
      div({ class: 'header-text' }, [
        div({ class: 'title-row' }, [
          h1({ class: 'title -small' }, `${route.id} ${normname(route.name)}`),
          button({ class: 'back', onclick: window.history.back }, [
            span({ class: 'icon -back material-icons' },
              'keyboard_arrow_left'),
            search.query ? 'Search' : 'Home'
          ])
        ]),
        h2({ class: 'subtitle' }, `Route ${route.id}`)
      ])
    ]),
    div({ id: 'map', key: 'map' }),
    !stations.length
      ? null
      : div({ class: 'section -stops' }, [
        div({ class: 'section-header' }, [
          h2({ class: 'section-title' }, 'Route Overview'),
          span({ class: 'section-subtitle' },
            filter.query
              ? `${filter.results.length} stops for "${filter.query}"`
              : `${stations.length} stops`)
        ]),
        div({ class: 'section-content' }, [
          div({ class: 'search search-bar' }, [
            span({ class: 'icon -search material-icons' },
              'search'),
            input({
              id: 'filter',
              class: 'search-input',
              placeholder: 'Filter stations',
              autocomplete: 'off',
              oninput: evt => evt
            }),
            filter.query
              ? span({ class: 'icon -close material-icons', onclick: evt => evt },
                  'close')
              : null
          ]),
          div({ class: 'stations' },
            (filter.query ? filter.results : stations).map(stn => Station(stn, route)))
        ])
      ])
  ])
}

const Station = (station, route) => {
  const [name, subname] = fmtstn(station.name)
  const desc = `${station.id} · ${subname}`
  const href = `/station.html#${route.id}/${station.id}`
  return a({ class: 'station -' + station.id, href }, [
    div({ class: 'station-lhs' }, [
      div({ class: 'station-meta' }, [
        span({ class: 'station-name' }, name),
        span({ class: 'station-desc' }, desc)
      ])
    ]),
    span({ class: 'stop-rhs material-icons' },
      'keyboard_arrow_right')
  ])
}

// // Setting variables for elements to be changed later
// const search = document.getElementById('search-bar')
// const stationWrap = document.getElementById('stations')
// const routeName = document.getElementById('route')
// const directionStart = document.getElementById('starting')
// const directionEnd = document.getElementById('ending')

// // Set an initial route for the first route the user chose
// let initialRoute = {
//   id: routeid,
//   name: route.name,
//   path: route.path,
//   stations: null
// }

// // Set the current route to be the initial route
// const currentRoute = initialRoute

// // The main function for rendering the page with stations
// ;(async function main () {
//   routeName.innerText = 'Route ' + initialRoute.id
//   initialRoute = await getRoute(initialRoute)
//   render(initialRoute.stations)
//   search.oninput = _ => {
//     const stations = initialRoute.stations.filter(station =>
//       station.id.toString().includes(search.value) ||
//       station.name.toLowerCase().includes(search.value.toLowerCase())
//     )
//     render(stations)
//   }
// })()

// // get the route information from the database
// async function getRoute (route) {
//   route.stations = []
//   const missing = []
//   for (const id of route.path) {
//     const station = stations.find(station => +station.id === id)
//     if (station) {
//       route.stations.push(station)
//     } else {
//       missing.push(id)
//     }
//   }
//   if (missing.length) {
//     const gets = []
//     for (let i = 0; i < missing.length; i += 10) {
//       const chunk = missing.slice(i, i + 10)
//       const promise = db.collection('stations').where('id', 'in', chunk).get()
//       console.log('queueing get for', chunk)
//       gets.push(promise)
//     }
//     const cols = await Promise.all(gets)
//     for (const col of cols) {
//       for (const doc of col.docs) {
//         const station = doc.data()
//         console.log('got', station)
//         route.stations.push(station)
//         stations.push(station)
//       }
//     }
//   }
//   route.stations.sort((a, b) => route.path.indexOf(a.id) - route.path.indexOf(b.id))
//   window.localStorage.stations = JSON.stringify(stations)
//   return route
// }

// // Calling the render station function to re-arrange the page.
// function render (stations) {
//   patch(stationWrap, div({ id: 'stations' }, stations.map(renderStation)))
// }

// // Changing the html with the data gotten
// function renderStation (station) {
//   const startIndex = currentRoute.stations[0].name
//   const ending = currentRoute.name
//   const [start] = startIndex.split(' @ ')
//   const [ubc] = start.split(' Exchange')

//   directionStart.innerText = (start.startsWith('UBC') ? ubc : start)
//   directionEnd.innerText = ending

//   function onclick () {
//     const index = currentRoute.path.indexOf(station.id)
//     let before = currentRoute.stations[index - 1]
//     let after = currentRoute.stations[index + 1]

//     if (!before) {
//       before = currentRoute.stations[index + 2]
//       window.sessionStorage.setItem('stationEnd', 'first')
//     } else if (!after) {
//       after = currentRoute.stations[index - 2]
//       window.sessionStorage.setItem('stationEnd', 'last')
//     }

//     window.sessionStorage.setItem('after', after.name)
//     window.sessionStorage.setItem('before', before.name)
//     window.sessionStorage.setItem('stationId', station.id)
//     window.sessionStorage.setItem('stationName', station.name)
//     window.sessionStorage.setItem('route', currentRoute.id)
//     window.location.href = 'station.html'
//   }

//   const [on, at] = normstn(station.name)
//   const text = on
//   const subtext = station.id + ' · ' + at

//   return div({ class: 'option', onclick: onclick }, [
//     div({ class: 'option-data' }, [
//       p({ class: 'option-text' }, text),
//       div({ class: 'option-subtext' }, subtext)
//     ]),
//     span({ class: 'option-icon material-icons' }, 'chevron_right')
//   ])
// }

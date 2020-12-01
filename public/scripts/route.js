const { db, normstn, patch, div, p, span } = window

const stations = JSON.parse(window.localStorage.stations || '[]')
const routes = JSON.parse(window.localStorage.routes || '[]')
const routeid = window.sessionStorage.getItem('route')
const route = routes.find(route => route.id === routeid)

// Setting variables for elements to be changed later
const search = document.getElementById('search-bar')
const stationWrap = document.getElementById('stations')
const routeName = document.getElementById('route')
const directionStart = document.getElementById('starting')
const directionEnd = document.getElementById('ending')

// Set an initial route for the first route the user chose
let initialRoute = {
  id: routeid,
  name: route.name,
  path: route.path,
  stations: null
}

// Set the current route to be the initial route
const currentRoute = initialRoute

// The main function for rendering the page with stations
;(async function main () {
  routeName.innerText = 'Route ' + initialRoute.id
  initialRoute = await getRoute(initialRoute)
  render(initialRoute.stations)
  search.oninput = _ => {
    const stations = initialRoute.stations.filter(station =>
      station.id.toString().includes(search.value) ||
      station.name.toLowerCase().includes(search.value.toLowerCase())
    )
    render(stations)
  }
})()

// get the route information from the database
async function getRoute (route) {
  route.stations = []
  const missing = []
  for (const id of route.path) {
    const station = stations.find(station => +station.id === id)
    if (station) {
      route.stations.push(station)
    } else {
      missing.push(id)
    }
  }
  if (missing.length) {
    const gets = []
    for (let i = 0; i < missing.length; i += 10) {
      const chunk = missing.slice(i, i + 10)
      const promise = db.collection('stations').where('id', 'in', chunk).get()
      console.log('queueing get for', chunk)
      gets.push(promise)
    }
    const cols = await Promise.all(gets)
    for (const col of cols) {
      for (const doc of col.docs) {
        const station = doc.data()
        console.log('got', station)
        route.stations.push(station)
        stations.push(station)
      }
    }
  }
  route.stations.sort((a, b) => route.path.indexOf(a.id) - route.path.indexOf(b.id))
  window.localStorage.stations = JSON.stringify(stations)
  return route
}

// Calling the render station function to re-arrange the page.
function render (stations) {
  patch(stationWrap, div({ id: 'stations' }, stations.map(renderStation)))
}

// Changing the html with the data gotten
function renderStation (station) {
  const startIndex = currentRoute.stations[0].name
  const ending = currentRoute.name
  const [start] = startIndex.split(' @ ')
  const [ubc] = start.split(' Exchange')

  directionStart.innerText = (start.startsWith('UBC') ? ubc : start)
  directionEnd.innerText = ending

  function onclick () {
    const index = currentRoute.path.indexOf(station.id)
    let before = currentRoute.stations[index - 1]
    let after = currentRoute.stations[index + 1]

    if (!before) {
      before = currentRoute.stations[index + 2]
      window.sessionStorage.setItem('stationEnd', 'first')
    } else if (!after) {
      after = currentRoute.stations[index - 2]
      window.sessionStorage.setItem('stationEnd', 'last')
    }

    window.sessionStorage.setItem('after', after.name)
    window.sessionStorage.setItem('before', before.name)
    window.sessionStorage.setItem('stationId', station.id)
    window.sessionStorage.setItem('stationName', station.name)
    window.sessionStorage.setItem('route', currentRoute.id)
    window.location.href = 'station.html'
  }

  const [on, at] = normstn(station.name)
  const text = on
  const subtext = station.id + ' · ' + at

  return div({ class: 'option', onclick: onclick }, [
    div({ class: 'option-data' }, [
      p({ class: 'option-text' }, text),
      div({ class: 'option-subtext' }, subtext)
    ]),
    span({ class: 'option-icon material-icons' }, 'chevron_right')
  ])
}

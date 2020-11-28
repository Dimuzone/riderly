const { db, patch, div, p, span } = window

// Setting variables for elements to be changed later
const search = document.getElementById('search-bar')
const stationWrap = document.getElementById('stations')
const swapClick = document.getElementById('swap')
const routeName = document.getElementById('route')
const directionStart = document.getElementById('starting')
const directionEnd = document.getElementById('ending')

// Set an initial route for the first route the user chose
let initialRoute = {
  id: window.sessionStorage.getItem('route'),
  name: window.sessionStorage.getItem('endingStation'),
  path: window.sessionStorage.getItem('stations_Id').split(',').map(Number),
  stations: null
}

// For storing the reverse option of the route
let reverseRoute = {
  id: null,
  name: null,
  path: null,
  stations: null
}

// Set the current route to be the initial route
let currentRoute = initialRoute

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
  swapClick.onclick = onSwap
})()

// get the route information from the database
async function getRoute (route) {
  const stations = []
  if (!route.path) {
    const path = await db.collection('routes').doc(route.id).get()
    route.path = path.data().path
    route.name = path.data().name
  }
  const gets = []
  for (let i = 0; i < route.path.length; i += 10) {
    const chunk = route.path.slice(i, i + 10)
    const promise = db.collection('stations').where('id', 'in', chunk).get()
    gets.push(promise)
  }
  const cols = await Promise.all(gets)
  for (const col of cols) {
    for (const doc of col.docs) {
      stations.push(doc.data())
    }
  }
  stations.sort((a, b) => route.path.indexOf(a.id) - route.path.indexOf(b.id))
  route.stations = stations
  return route
}

// The function for when the user clicks the swap button
async function onSwap () {
  if (currentRoute === initialRoute) {
    if (reverseRoute.stations == null) {
      const char = initialRoute.id[initialRoute.id.length - 1]
      const newRoute = initialRoute.id.slice(0, -1) + swapChar(char)
      reverseRoute.id = newRoute
      reverseRoute = await getRoute(reverseRoute)
    }
    currentRoute = reverseRoute
  } else {
    currentRoute = initialRoute
  }
  routeName.innerText = 'Route ' + currentRoute.id
  render(currentRoute.stations)
}

// Calling the render station function to re-arrange the page.
function render (stations) {
  patch(stationWrap, div({ id: 'stations' }, stations.map(renderStation)))
}

// Function used for swapping West with East and North with South
function swapChar (char) {
  switch (char) {
    case 'W' : return 'E'
    case 'E' : return 'W'
    case 'S' : return 'N'
    case 'N' : return 'S'
  }
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
    const before = currentRoute.stations[index - 1].name
    const after = currentRoute.stations[index + 1].name

    window.sessionStorage.setItem('after', after)
    window.sessionStorage.setItem('before', before)
    window.sessionStorage.setItem('stationId', station.id)
    window.sessionStorage.setItem('stationName', station.name)
    window.sessionStorage.setItem('route', currentRoute.id)
    window.location.href = 'station.html'
  }

  const [on, at] = station.name.split(' @ ')
  const text = at.startsWith('Bay') ? on : at
  const subtext = station.id + ' · ' + (at.startsWith('Bay') ? at : on)

  return div({ class: 'option', onclick: onclick }, [
    div({ class: 'option-data' }, [
      p({ class: 'option-text' }, text),
      div({ class: 'option-subtext' }, subtext)
    ]),
    span({ class: 'option-icon material-icons' }, 'chevron_right')
  ])
}

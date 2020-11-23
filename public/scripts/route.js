
const search = document.getElementById("search-bar")
const stationWrap = document.getElementById("stations")
const swapClick = document.getElementById("swap")
const routeName = document.getElementById("route")
//let stationId = StationArray.split(",").map(Number)
let stationsArray = []



let initialRoute = {

  id: sessionStorage.getItem("route"),
  path: sessionStorage.getItem("stationId").split(",").map(Number),
  stations: null

}

let reverseRoute = {

  id: null,
  path: null,
  stations: null  

}

let swapped = false

async function getRoute(route) {

  if(route.path == null) {

    let path = await db.collection("routes").doc(route.id).get()
    route.path = path.data().path

  }

  for (let i = 0; i < route.path.length; i += 10) {

    let chunk = route.path.slice(i, i + 10)
    let col = await db.collection("stations").where("id", "in", chunk).get()
    col.forEach(doc => stationsArray.push(doc.data()))
    
  }

  route.stations = stationsArray

  stationsArray.sort((a, b) => route.path.indexOf(a.id) - route.path.indexOf(b.id))

  return route

}

getRoute({ id: "49E" })

let stationData = []

main()

async function main() {
  
  initialRoute = await getRoute(initialRoute)

  render(initialRoute.stations)

  search.oninput = _ => {
    let stations = initialRoute.stations.filter(station =>
      station.id.toString().includes(search.value)
      || station.name.toLowerCase().includes(search.value.toLowerCase())
    )

    render(stations)

  }

  swapClick.onclick = function () {

    onSwap()

    // char = route[route.length - 1]
    
    // let newRoute =  route.slice(0, -1) + swapChar(char)
  
    // route = newRoute
  
    // document.getElementById("route").innerText = "Route " + route
  
  }

}

async function onSwap() {

  swapped = !swapped

  if (swapped == true) {

    if (reverseRoute.stations == null) {

      char = initialRoute.id[initialRoute.id.length -1]

      let newRoute = initialRoute.id.slice(0, -1) + swapChar(char)

      reverseRoute.id = newRoute

      reverseRoute = await getRoute(reverseRoute)

    }

    routeName.innerText = "Route " + reverseRoute.id

    reverseRoute.stations.map(renderStation)

  } else if (swapped == false) {

    routeName.innerText = "Route " + initialRoute.id

    initialRoute.stations.map(renderStation)

  }

}

function render(stations) {
  patch(stationWrap, div({ id: "stations" }, stations.map(renderStation)))
}

function swapChar(char) {
  switch(char) {
    case "W" : return "E"
    case "E" : return "W"
    case "S" : return "N"
    case "N" : return "S"
  } 
}

routeName.innerText = "Route " + initialRoute.id

function renderStation(station) {

  function onclick() {

    let index = path.indexOf(station.id)
    let before = stationData[index - 1].name
    let after = stationData[index + 1].name

    sessionStorage.setItem("after", after)
    sessionStorage.setItem("before", before)
    sessionStorage.setItem("stationId", station.id)
    sessionStorage.setItem("stationName", station.name)
    sessionStorage.setItem("route", route)
    location.href = "station.html"

  }

  let [on, at] = station.name.split(" @ ")
  let text = at.startsWith("Bay") ? on : at
  let subtext = station.id + " · " + (at.startsWith("Bay") ? at : on)

    return div({ class: "option", onclick: onclick }, [
      div({ class: "option-data"}, [
      p({ class: "option-text" }, text),
      div({ class: "option-subtext"},  subtext),
      ]),
      span({ class: "option-icon material-icons"}, "chevron_right")
    ])
  }

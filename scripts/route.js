
const search = document.getElementById("search-bar")
const stationWrap = document.getElementById("stations")
let route = sessionStorage.getItem("route")
let path = sessionStorage.getItem("stationId").split(",").map(Number)
//let stationId = StationArray.split(",").map(Number)
console.log(path)

let stationData = []

main()

async function main() {
  

  for (let i = 0; i < path.length; i += 10) {

    let chunk = path.slice(i, i + 10)
    console.log(chunk.length)
    let col = await db.collection("stations").where("id", "in", chunk).get()
    col.forEach(doc => stationData.push(doc.data()))

  }

  stationData.sort((a, b) => path.indexOf(a.id) - path.indexOf(b.id))

  render(stationData)

  search.oninput = _ => {
    let stations = stationData.filter(station =>
      station.id.toString().includes(search.value)
      || station.name.toLowerCase().includes(search.value.toLowerCase())
    )
    render(stations)
  }

}

function render(stations) {
  patch(stationWrap, div({ id: "stations" }, stations.map(renderStation)))
}
document.getElementById("route").innerText = "Route " + route

document.getElementById("swap").onclick = function () {
  char = route[route.length - 1]
  
  let newRoute =  route.slice(0, -1) + swapChar(char)

  route = newRoute

  document.getElementById("route").innerText = "Route " + route

}

function swapChar(char) {
  switch(char) {
    case "W" : return "E"
    case "E" : return "W"
    case "S" : return "N"
    case "N" : return "S"
  } 
}

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

window.L.mount = function mount (elid) {
  const L = window.L
  const token = 'pk.eyJ1Ijoic2VtaWJyYW4iLCJhIjoiY2tpMnc2cTMxMWl2czJ5cGRpYWR4YWExNyJ9.cNgXsMZb5K-7DKOr6jw8ag'
  const leaflet = L.map(elid, { zoomSnap: 0.25, zoomDelta: 0.5 })
  L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=' + token, {
    id: 'mapbox/streets-v11',
    attribution: 'Data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>' +
    ', Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    tileSize: 512,
    zoomOffset: -1
  }).addTo(leaflet)
  return leaflet
}

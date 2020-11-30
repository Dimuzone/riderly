// The Route ID ex. 49W
const routeId = window.sessionStorage.getItem('route')

// The station ID ex. 34654
const stationId = parseInt(window.sessionStorage.getItem('stationId'))

// Report status
const seat = ['empty', 'standonly', 'full']
const time = ['ontime', 'late', 'verylate']
const mask = ['complete', 'partial', 'few']

const form = document.querySelector('.report-form')

// set page title
document.getElementById('name').innerText = routeId + '-' + stationId

// Reporting
form.onsubmit = event => {
  const formdata = new window.FormData(event.target)
  const seatStatus = formdata.get('seating')
  const timeStatus = formdata.get('timing')
  const maskStatus = formdata.get('mask-usage')
  event.preventDefault()

  const newReport = window.db.collection('reports').doc()

  newReport.set({
    author: 'guest',
    station: stationId,
    route: routeId,
    seating: seat.indexOf(seatStatus),
    timing: time.indexOf(timeStatus),
    masks: mask.indexOf(maskStatus),
    timestamp: Date.now()
  })
}

// Go back button
const back = document.getElementById('back')
back.onclick = _ => {
  window.history.back()
}

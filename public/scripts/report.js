const seat = ['empty', 'standonly', 'full']
const time = ['ontime', 'late', 'verylate']
const mask = ['complete', 'partial', 'few']

const form = document.querySelector('.report-form')

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
    station: 52500,
    route: '49W',
    seating: seat.indexOf(seatStatus),
    timing: time.indexOf(timeStatus),
    masks: mask.indexOf(maskStatus),
    timestamp: Date.now()
  })
}

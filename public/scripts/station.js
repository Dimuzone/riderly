const {
  firebase, db, timediff, normstn, L, patch,
  div, span, localStorage, p, sessionStorage
} = window

const back = document.querySelector('.back')
back.onclick = _ => {
  window.history.back()
}

const leaflet = L.map('map', { zoomSnap: 0.25, zoomDelta: 0.5 })
L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1Ijoic2VtaWJyYW4iLCJhIjoiY2tpMnc2cTMxMWl2czJ5cGRpYWR4YWExNyJ9.cNgXsMZb5K-7DKOr6jw8ag', {
  id: 'mapbox/streets-v11',
  attribution: 'Data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>' +
    ', Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
  maxZoom: 18,
  tileSize: 512,
  zoomOffset: -1
}).addTo(leaflet)

const cache = {
  stationId: +sessionStorage.getItem('stationId'),
  stationName: sessionStorage.getItem('stationName'),
  stationEnd: sessionStorage.getItem('stationEnd'),
  route: sessionStorage.getItem('route'),
  before: sessionStorage.getItem('before'),
  after: sessionStorage.getItem('after')
}

sessionStorage.removeItem('stationEnd')

let name = cache.stationName
let before = cache.before
let after = cache.after

if (cache.stationEnd === 'first') {
  before = cache.stationName
  name = cache.after
  after = cache.before
  document.querySelector('.station.-current').classList.remove('-select')
  document.querySelector('.station.-before').classList.add('-select')
} else if (cache.stationEnd === 'last') {
  before = cache.after
  name = cache.before
  after = cache.stationName
  document.querySelector('.station.-current').classList.remove('-select')
  document.querySelector('.station.-after').classList.add('-select')
}

before = normstn(before)[0]
name = normstn(name)[0]
after = normstn(after)[0]

const join = document.getElementById('join')
join.innerText = 'Join chat for Route ' + cache.route
join.onclick = _ => {
  window.location.href = 'chat.html'
}

document.getElementById('name').innerText = normstn(cache.stationName)[0]
document.getElementById('routeAndId').innerText = cache.route + ' - #' + cache.stationId
document.getElementById('routeId').innerText = cache.route
document.getElementById('currentName').innerText = name
document.getElementById('before').innerText = before
document.getElementById('after').innerText = after

// Display recent report
const seating = ['Empty', 'Seating only', 'Full']
const timing = ['On time', 'Late', 'Very Late']
const mask = ['Complete', 'Partial', 'Few']
const colors = ['-green', '-yellow', '-red']

db.collection('reports')
  .where('station', '==', cache.stationId)
  .where('route', '==', cache.route)
  .orderBy('timestamp', 'desc').limit(1)
  .get()
  .then(col => {
    const reports = []
    col.forEach(doc => reports.push(doc.data()))
    const report = reports[0]
    if (report) {
      const seatingStatus = document.getElementsByClassName('-seating')[0]
      seatingStatus.innerText = seating[report.seating]
      seatingStatus.classList.add(colors[report.seating])

      const timingStatus = document.getElementsByClassName('-timing')[0]
      timingStatus.innerText = timing[report.timing]
      timingStatus.classList.add(colors[report.timing])

      const maskStatus = document.getElementsByClassName('-mask')[0]
      maskStatus.innerText = mask[report.masks]
      maskStatus.classList.add(colors[report.masks])
    }
  })

const station = cache.stationId
const route = cache.route
const star = document.getElementById('star')
const stationName = cache.stationName
const previous = sessionStorage.getItem('before')
const thisStation = station + '-' + route + '-' + stationName + '-' + previous + '-' + after

// Save stations button
firebase.auth().onAuthStateChanged(user => {
  console.log(user.email)

  // user log in
  db.collection('users').doc(user.uid).get().then(users => {
    star.style.display = 'inherit'
    const saves = users.data().saves.slice()
    if (saves.includes(thisStation)) {
      star.innerText = 'star'
    }
  })
})

star.onclick = function onClick () {
  if (star.innerText === 'star_border') {
    saveStation(station)
    star.innerText = 'star'
  } else if (star.innerText === 'star') {
    removeStation(station)
    star.innerText = 'star_border'
  }
}

function saveStation (station) {
  firebase.auth().onAuthStateChanged(user => {
    const id = user.uid
    db.collection('users').doc(id).get().then(user => {
      const saves = user.data().saves.slice()
      saves.push(thisStation)
      db.collection('users').doc(id).update({ saves })
    })
  })
}

function removeStation (station) {
  firebase.auth().onAuthStateChanged(user => {
    const id = user.uid
    db.collection('users').doc(id).get().then(user => {
      const saves = user.data().saves.slice()
      if (saves.includes(thisStation)) {
        saves.splice(saves.indexOf(thisStation), 1)
      }
      db.collection('users').doc(id).update({ saves })
    })
  })
}

// display recent message
const messages = []
const stationMessageWrap = document.getElementById('recentmsg')
db.collection('messages').where('route', '==', cache.route).orderBy('timestamp', 'desc').limit(3)
  .get().then(col => {
    col.forEach(doc => messages.push(doc.data()))
    console.log(messages)
    console.log(stationMessageWrap)
    patch(stationMessageWrap, div({ id: 'recentmsg' }, messages.map(renderRecentMsg)))
  })

function renderRecentMsg (recentmsg) {
  const now = Date.now()
  const ago = timediff(recentmsg.timestamp, now)
  return div({ class: 'option' }, [
    div({ class: 'option-data' }, [p({ class: 'option-text' }, [recentmsg.route]),
      div({ class: 'option-subtext' }, [recentmsg.username + ': ' + recentmsg.content])
    ]),
    div({ class: 'timewrap' }, [span({ class: 'time' }, ago),
      span({ class: 'option-icon material-icons' }, 'chevron_right')])
  ])
}

// local storage for recent stations
if (localStorage.getItem('recents') == null) {
  localStorage.setItem('recents', thisStation)
} else {
  const recent = localStorage.getItem('recents').split(',')
  if (!recent.includes(thisStation)) {
    recent.push(thisStation)
    localStorage.setItem('recents', recent)
  }
  console.log(localStorage.getItem('recents'))
}

// Update report
const update = document.getElementById('update')
update.onclick = function report () {
  window.location.href = 'report.html'
}

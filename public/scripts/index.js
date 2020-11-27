const saved = document.getElementById('usersaved')
const history = document.getElementById('userhistory')
const stationWrap = document.getElementById('station')
const { firebase, db, patch, div, span, localStorage, p } = window

firebase.auth().onAuthStateChanged(user => {
  // user log in
  if (!user) return
  db.collection('users').doc(user.uid).get().then(users => {
    const name = users.data().name.split(' ')

    // display welcome message
    const welcome = document.getElementById('welcome')
    welcome.innerText = 'Hi, ' + name[0] + '!'

    // display user saved
    saved.style.display = 'flex'

    // Saved Station button
    saved.onclick = _ => {
      const savedstations = users.data().saves
      patch(stationWrap, div({
        id: 'station'
      }, savedstations.map(renderRecent)))
    }
  })
  const loginstatus = document.getElementsByClassName('login-text')[0]
  loginstatus.innerText = 'Logout'
})

// log in/out button
const button = document.getElementsByClassName('login')[0]

button.onclick = _ => {
  const signin = firebase.auth().currentUser
  if (signin) {
    firebase.auth().signOut().then(_ => { window.location.href = 'index.html' })
    const welcome = document.getElementById('welcome')
    welcome.innerText = ''
  } else {
    window.location.href = 'login.html'
  }
}

// Add recents
let recents = localStorage.getItem('recents')
recents = recents ? recents.split(',') : []

history.onclick = _ => {
  patch(stationWrap, div({
    id: 'station'
  }, recents.map(renderRecent)))
}

patch(stationWrap, div({
  id: 'station'
}, recents.map(renderRecent)))

function renderRecent (recent) {
  const newStation = recent.split('-')
  function onclick () {
    window.sessionStorage.setItem('after', newStation[4])
    window.sessionStorage.setItem('before', newStation[3])
    window.sessionStorage.setItem('stationId', newStation[0])
    window.sessionStorage.setItem('stationName', newStation[2])
    window.sessionStorage.setItem('route', newStation[1])
    window.location.href = 'station.html'
  }
  return div({ class: 'option', onclick: onclick },
    [div({ class: 'option-data' },
      [p({ class: 'option-text' }, [newStation[2]]),
        div({ class: 'option-subtext' }, ['Route ' + newStation[1] + ' ‧ ' + newStation[0]])
      ])
    ])
}

// Recent messages
const messages = []
const now = Date.now()
const messageWrap = document.getElementById('recentmsg')

db.collection('messages').orderBy('timestamp', 'desc').limit(3)
  .get().then(col => {
    col.forEach(doc => messages.push(doc.data()))
    patch(messageWrap, div({
      id: 'recentmsg'
    }, messages.map(renderRecentMsg)))
  })

function renderRecentMsg (recentmsg) {
  return div({ class: 'option' },
    [div({ class: 'option-data' },
      [p({ class: 'option-text' }, [recentmsg.route]),
        div({ class: 'option-subtext' }, [recentmsg.username + ': ' + recentmsg.content])
      ]),
    div({ class: 'timewrap' },
      [span({ class: 'time' }, window.strifytime(recentmsg.timestamp, now)),
        span({ class: 'option-icon material-icons' }, 'chevron_right')
      ])
    ])
}

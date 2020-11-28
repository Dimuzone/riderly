const {
  firebase, db, patch,
  main, section, h2, span
} = window

const login = document.getElementById('login')
const welcome = document.getElementById('welcome')
const page = document.querySelector('.page.-home')

const state = {
  stations: [],
  messages: []
}
render(state)

// login/logout button
login.onclick = async function () {
  const signin = firebase.auth().currentUser
  if (signin) {
    welcome.innerText = ''
    await firebase.auth().signOut()
    window.location.href = 'index.html'
  } else {
    window.location.href = 'login.html'
  }
}

firebase.auth().onAuthStateChanged(user => {
  // if user isn't logged in, we don't need to do anything extra
  if (!user) return

  // set button text
  login.innerText = 'Logout'

  db.collection('users').doc(user.uid).get().then(users => {
    const name = users.data().name.split(' ')
    welcome.innerText = 'Hi, ' + name[0] + '!'

    // // Saved Station button
    // saved.onclick = _ => {
    //   const savedstations = users.data().saves
    //   patch(stationWrap, div({
    //     id: 'station'
    //   }, savedstations.map(renderRecent)))
    // }
  })
})

function render ({ stations, messages }) {
  patch(page, main({ class: 'page -home' }, [
    section({ class: 'section -stations' }, [
      h2({ class: 'section-title' },
        stations.length ? '' : 'Recent ' + 'Stations'),
      stations.length
        ? stations.map(renderStation)
        : span({ class: 'section-notice' },
          'When you view a station\'s info, it will appear here.')
    ]),
    section({ class: 'section -messages' }, [
      h2({ class: 'section-title' }, 'Recent Messages'),
      messages.length
        ? messages.map(renderMessage)
        : span({ class: 'section-notice' },
          'No recent user activity!')
    ])
  ]))
}

function renderStation (station) {
  return span('station')
}

function renderMessage (message) {
  return span('message')
}

// // Add recents
// let recents = localStorage.getItem('recents')
// recents = recents ? recents.split(',') : []

// history.onclick = _ => {
//   patch(stationWrap, div({
//     id: 'station'
//   }, recents.map(renderRecent)))
// }

// patch(stationWrap, div({
//   id: 'station'
// }, recents.map(renderRecent)))

// function renderRecent (recent) {
//   const newStation = recent.split('-')
//   function onclick () {
//     window.sessionStorage.setItem('after', newStation[4])
//     window.sessionStorage.setItem('before', newStation[3])
//     window.sessionStorage.setItem('stationId', newStation[0])
//     window.sessionStorage.setItem('stationName', newStation[2])
//     window.sessionStorage.setItem('route', newStation[1])
//     window.location.href = 'station.html'
//   }
//   return div({ class: 'option', onclick: onclick },
//     [div({ class: 'option-data' },
//       [p({ class: 'option-text' }, [newStation[2]]),
//         div({ class: 'option-subtext' }, ['Route ' + newStation[1] + ' ‧ ' + newStation[0]])
//       ])
//     ])
// }

// // Recent messages
// const messages = []
// const now = Date.now()
// const messageWrap = document.getElementById('recentmsg')

// db.collection('messages').orderBy('timestamp', 'desc').limit(3)
//   .get().then(col => {
//     col.forEach(doc => messages.push(doc.data()))
//     patch(messageWrap, div({
//       id: 'recentmsg'
//     }, messages.map(renderRecentMsg)))
//   })

// function renderRecentMsg (recentmsg) {
//   return div({ class: 'option' },
//     [div({ class: 'option-data' },
//       [p({ class: 'option-text' }, [recentmsg.route]),
//         div({ class: 'option-subtext' }, [recentmsg.username + ': ' + recentmsg.content])
//       ]),
//     div({ class: 'timewrap' },
//       [span({ class: 'time' }, window.strifytime(recentmsg.timestamp, now)),
//         span({ class: 'option-icon material-icons' }, 'chevron_right')
//       ])
//     ])
// }

const {
  firebase, db, patch, getstns,
  div, input, button, span
} = window

const $main = document.querySelector('main')
const $page = document.querySelector('.page-content')
const $subtitle = document.querySelector('.subtitle')
const $back = document.querySelector('.back-text')
let $input = null
let $groups = null
let $wrap = null

const auth = firebase.auth()

const state = {
  users: JSON.parse(window.localStorage.users || '[]'),
  messages: JSON.parse(window.localStorage.messages || '[]'),
  stations: JSON.parse(window.localStorage.stations || '[]'),
  routes: JSON.parse(window.localStorage.routes || '[]'),
  route: null,
  userid: null,
  username: 'guest',
  init: false
}

;(async function init () {
  const [rtid, stnid] = window.location.hash.slice(1).split('/')
  const route = state.routes.find(rt => rt.id === rtid)
  if (!route) {
    return patch($main, 'not found')
  }

  state.route = route
  route.path = await getstns(route.path)
  if (stnid) {
    const station = route.path.find(stn => stn.id === +stnid)
    if (!station) {
      return patch($main, 'not found')
    }
  }

  $subtitle.innerText = `Route ${rtid}`
  if (stnid) {
    $back.innerText = stnid
  } else {
    $back.innerText = 'Home'
  }

  auth.onAuthStateChanged(user => {
    updateUser(user)

    if (!state.init) {
      state.init = true
      window.addEventListener('resize', scroll)

      // listen for messages
      db.collection('messages')
        .orderBy('timestamp', 'desc')
        .onSnapshot(col => {
          const news = []
          for (const doc of col.docs) {
            const msg = { ...doc.data(), id: doc.id }
            if (!state.messages.find(cached => cached.id === msg.id)) {
              news.push(msg)
            }
          }
          const messages = [...state.messages, ...news]
          if (news.length) {
            window.localStorage.messages = JSON.stringify(messages)
          }
          update({ messages })
        })
    }
  })
})()

async function updateUser (user) {
  if (user) {
    const doc = await db.collection('users').doc(user.uid).get()
    update({ userid: doc.data().email, username: doc.data().name })
  } else {
    let token = window.localStorage.token
    if (!token) {
      token = Math.random().toString().slice(2)
      window.localStorage.token = token
    }
    update({ userid: token })
  }
}

function update (data) {
  Object.assign(state, data)
  patch($page, ChatPage(state))
  if (!$wrap) $wrap = document.querySelector('.messages')
  if (!$input) $input = document.querySelector('.message-input')
  if (!$groups) $groups = document.querySelector('.message-groups')
  scroll()
}

function ChatPage (state) {
  const messages = state.messages
    .filter(msg => msg.route === state.route.id)
    .sort((a, b) => a.timestamp - b.timestamp)
  return div({ class: 'page-content' }, [
    div({ class: 'messages' }, [MessageGroups(messages, state.userid)]),
    div({ class: 'message-bar' }, [
      input({
        class: 'message-input',
        placeholder: 'Enter a message...',
        onkeypress: evt => evt.key === 'Enter' ? send(state) : true
      }),
      button({
        class: 'message-send material-icons',
        onclick: _ => send(state)
      }, 'arrow_upward')
    ])
  ])
}

function send (state) {
  if (!$input.value) return false
  const message = {
    timestamp: Date.now(),
    route: state.route.id,
    username: state.username,
    userid: state.userid,
    content: $input.value
  }
  $input.value = ''
  db.collection('messages').add(message)
  return true
}

function scroll () {
  if ($groups.clientHeight > $wrap.clientHeight) {
    $wrap.classList.add('-scroll')
    $wrap.scrollTop = $groups.clientHeight - $wrap.clientHeight
  } else if ($wrap.classList.contains('-scroll')) {
    $wrap.classList.remove('-scroll')
  }
}

function MessageGroups(messages, userid) {
  const groups = []
  let group = null
  let author = null
  for (const msg of messages) {
    if (msg.userid !== author) {
      author = msg.userid
      group = author === userid
        ? div({ class: 'message-group -user' }, [
            span({ class: 'message-author' }, [msg.username + ' (You)'])
          ])
        : div({ class: 'message-group' }, [
          span({ class: 'message-author' }, [msg.username])
        ])
      groups.push(group)
    }
    group.content.push(
      div({ class: 'message' }, [msg.content])
    )
  }
  const el = div({ class: 'message-groups' }, groups)
  return el
}

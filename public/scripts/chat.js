const { firebase, db, patch, main, div, input, button, span } = window

const auth = firebase.auth()
const backButton = window.sessionStorage.getItem('backButton')
const route = window.sessionStorage.getItem('route')
const station = window.sessionStorage.getItem('stationName')
const subtitle = document.getElementById('subtitle')
const back = document.getElementById('back')
const page = document.querySelector('.page.-chat')
let textbox = null
let wrap = null
let groups = null
const state = {
  userid: null,
  username: 'guest',
  messages: []
}

subtitle.innerText = `Route ${route}`
if (station !== null) {
  back.innerText = `${station.split(' @ ')[1]}`
} else {
  back.innerTest = route
}

updateUser(auth.currentUser)
auth.onAuthStateChanged(updateUser)

db.collection('messages')
  .where('route', '==', route)
  .onSnapshot(col => {
    for (const doc of col.docs) {
      if (!state.messages.find(msg => msg.id === doc.id)) {
        state.messages.push({ id: doc.id, ...doc.data() })
      }
    }
    state.messages.sort((a, b) => a.timestamp - b.timestamp)
    render(state)
  })

async function updateUser (user) {
  if (user) {
    const userdoc = await db.collection('users').doc(user.uid).get()
    state.userid = userdoc.data().email
    state.username = userdoc.data().name
    render(state)
  } else {
    let token = window.localStorage.getItem('token')
    if (!token) {
      token = Math.random().toString().slice(2)
      window.localStorage.setItem('token', token)
    }
    state.userid = token
    render(state)
  }
}

function render (state) {
  patch(page, main({ class: 'page -chat' }, [
    div({ class: 'messages' }, [renderMessages(state)]),
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
  ]))
  textbox = document.querySelector('.message-input')
  groups = document.querySelector('.message-groups')
  wrap = document.querySelector('.messages')
  window.addEventListener('resize', scroll)
  scroll()
}

function send (state) {
  if (!textbox.value) return false
  const message = {
    timestamp: Date.now(),
    route: route,
    username: state.username,
    userid: state.userid,
    content: textbox.value,
    likes: 0
  }
  db.collection('messages').add(message)
  render({
    ...state,
    messages: [...state.messages, message]
  })
  textbox.value = ''
  return true
}

function scroll () {
  if (groups.clientHeight > wrap.clientHeight) {
    wrap.classList.add('-scroll')
    wrap.scrollTop = groups.clientHeight - wrap.clientHeight
  } else if (wrap.classList.contains('-scroll')) {
    wrap.classList.remove('-scroll')
  }
}

function renderMessages (state) {
  const groups = []
  let group = null
  let author = null
  for (const msg of state.messages) {
    if (msg.userid !== author) {
      author = msg.userid
      group = author === state.userid
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

if (backButton === null) {
  console.log('hi')
} else {
  subtitle.innerText = route
  back.innerText = backButton
}
window.sessionStorage.removeItem('backButton')

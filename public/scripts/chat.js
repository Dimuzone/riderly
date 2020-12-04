// imports (for standardjs)
const {
  firebase, db, patch, getrts, getstns,
  header, div, input, button, h1, span, a
} = window
const auth = firebase.auth()

// element defs
const $main = document.querySelector('main')
const $header = document.querySelector('header')
const $page = document.querySelector('.page-content')
let $input = null
let $groups = null
let $wrap = null

// state defs
const state = {
  user: JSON.parse(window.sessionStorage.user || null),
  users: JSON.parse(window.sessionStorage.users || '[]'),
  messages: JSON.parse(window.sessionStorage.messages || '[]'),
  stations: JSON.parse(window.localStorage.stations || '[]'),
  routes: null,
  route: null,
  init: false
}

// init()
// page logic entry point
// resolves data based on hash
;(async function init () {
  // extract data from hash
  const locid = window.location.hash.slice(1).split('/')
  const rtid = locid[0]
  const stnid = +locid[1]

  // resolve all routes from cache, or db if nonexistent
  state.routes = await getrts()

  // break early if route isn't found in db
  const route = state.routes.find(rt => rt.id === rtid)
  if (!route) {
    return patch($main, 'not found')
  }

  // this route exists. we can get data from it
  state.route = route

  // break early if the station id provided
  // isn't a part of the route
  if (stnid && !route.path.includes(stnid)) {
    return patch($main, 'not found')
  }

  // resolve each station id inside the route path
  route.path = await getstns(route.path)

  // break early if station is a part of route
  // but our db doesn't have data on it
  if (stnid && !route.path.find(stn => stn.id === stnid)) {
    return patch($main, 'not found')
  }

  // update header text
  patch($header, Header(route, stnid))

  // response optimization:
  // use cached user if existent,
  // otherwise wait for confirmation of logged in user
  if (state.user) {
    mount(state.user)
  } else {
    auth.onAuthStateChanged(mount)
  }
})()

// mount(user)
// resolves user into page state,
// performs first render,
// and appends listeners
async function mount (user) {
  // we only want to perform the mount procedure once
  if (state.init) return
  state.init = true

  const users = state.users

  // if a user we haven't cached yet is logged in,
  // get their data from the db and cache
  // (technically not necessary for the chat page,
  // but if we're going to cache user data for
  // faster page loads it should be valid across
  // all pages)
  if (user && !state.user) {
    // get all the user's data from db
    const userdoc = await db.collection('users').doc(user.uid).get()
    const userdata = userdoc.data()

    // normalize user metadata
    userdata.uid = user.uid
    userdata.id = userdata.email
    delete userdata.email
    users.push(userdata)

    // cache user
    window.sessionStorage.user = JSON.stringify(userdata)
    window.sessionStorage.users = JSON.stringify(users)

    // reflect user data on page
    state.user = userdata
  } else if (!user) {
    // assign a random token to this user from localstorage
    let token = window.localStorage.token
    if (!token) {
      token = Math.random().toString().slice(2)
      window.localStorage.token = token
    }
    state.user = {
      id: token,
      name: 'guest',
      saves: []
    }
  }

  update()
  window.addEventListener('resize', scroll)

  // listen for messages
  db.collection('messages')
    .orderBy('timestamp', 'desc')
    .onSnapshot(col => {
      const news = []
      for (const doc of col.docs) {
        // flatten message data structure
        const msg = { ...doc.data(), id: doc.id }
        const cached = state.messages.find(cached => cached.id === msg.id)
        if (!cached) {
          // we don't have this message cached; add it
          news.push(msg)
        }
      }

      // cache and update html if we found a new message
      if (news.length) {
        const messages = [...state.messages, ...news]
        messages.sort((a, b) => b.timestamp - a.timestamp)
        window.sessionStorage.messages = JSON.stringify(messages)
        update({ messages })
      }
    })
}

// update(data)
// updates page state with a partial data patch,
// then updates the page html structure
function update (data) {
  Object.assign(state, data)
  patch($page, ChatPage(state))

  // cache html elements for autoscroll hook
  if (!$wrap) $wrap = document.querySelector('.messages')
  if (!$input) $input = document.querySelector('.message-input')
  if (!$groups) $groups = document.querySelector('.message-groups')
  scroll()
}

// ChatPage(state) -> vnode
// component defining the HTML structure for a chat page
function ChatPage (state) {
  // sort messages by timestamp
  const messages = state.messages
    .filter(msg => msg.route === state.route.id)
    .sort((a, b) => a.timestamp - b.timestamp)

  return div({ class: 'page-content' }, [
    div({ class: 'messages' }, [
      messages.length
        ? MessageGroups(messages, state.user.id)
        : div({ class: 'message-groups -notice' }, 'Be the first to say something.')
    ]),
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

// MessageGroups(messages, userid) -> vnode
// component defining the HTML structure for all messages
// uses userid to determine if messages are sent by this user or not
function MessageGroups (messages, userid) {
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

// Header(route)
// component defining the HTML structure for the chat page header
const Header = (route, stnid) =>
  header({ class: 'header header-text -color -secondary' }, [
    div({ class: 'title-row' }, [
      h1({ class: 'title -small' }, 'Chat'),
      button({ class: 'back', onclick: _ => window.history.back() }, [
        span({ class: 'icon -back material-icons' },
          'keyboard_arrow_left'),
        stnid
      ])
    ]),
    span({ class: 'subtitle' }, [
      'Route ',
      a({ href: `station.html#${route.id}/${stnid}` }, route.number + route.pattern)
    ])
  ])

// send(state) -> bool
// sends a chat message
function send (state) {
  // don't send empty messages
  if (!$input.value) return false

  const message = {
    timestamp: Date.now(),
    route: state.route.id,
    username: state.user.name,
    userid: state.user.id,
    content: $input.value
  }

  // clear input
  $input.value = ''

  // add message to db
  // onsnapshot triggers for this client too,
  // so we don't need to update the html from here
  db.collection('messages').add(message)

  // allow key input for good measure
  return true
}

// scroll()
// enables scrolling and autoscrolls
// if total height of all messages exceeds the wrapper height
function scroll () {
  if ($groups.clientHeight > $wrap.clientHeight) {
    $wrap.classList.add('-scroll')
    $wrap.scrollTop = $groups.clientHeight - $wrap.clientHeight
  } else if ($wrap.classList.contains('-scroll')) {
    $wrap.classList.remove('-scroll')
  }
}

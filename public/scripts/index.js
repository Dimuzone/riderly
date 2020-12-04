const {
  firebase, db, timediff, fmtstn, patch, getrts, getstns, normname,
  main, header, section, div, h1, h2, button, span, strong, a
} = window
const auth = firebase.auth()

// HTML refs
const $page = document.querySelector('main')

const state = {
  user: JSON.parse(window.sessionStorage.user || null),
  search: JSON.parse(window.sessionStorage.search || null),
  users: JSON.parse(window.sessionStorage.users || '[]'),
  messages: JSON.parse(window.sessionStorage.messages || '[]'),
  routes: JSON.parse(window.localStorage.routes || '[]'),
  stations: JSON.parse(window.localStorage.stations || '[]'),
  recents: JSON.parse(window.localStorage.recents || '[]')
    .map(id => {
      const [route, station] = id.split('/')
      return { route, station: +station }
    }),
  saves: [],
  tab: 'recents',
  init: false
}

const switchtab = (state, newtab) =>
  ({ tab: newtab })

;(async function main () {
  if (!state.routes.length) {
    const routes = await getrts()
    state.routes = routes.map(route =>
      ({ ...route, name: normname(route.name) }))
  }

  if (state.user) {
    state.saves = state.user.saves.map(id => {
      const [route, station] = id.split('/')
      return { route, station: +station }
    })
  }

  const stnids = [
    ...state.recents.map(save => save.station),
    ...state.saves.map(save => save.station)
  ]

  if (stnids.length) {
    const stations = await getstns(stnids)
    const news = stations.filter(stn => !state.stations.find(cached => cached.id === stn.id))
    if (news.length) {
      state.stations.push(...news)
      window.localStorage.stations = JSON.stringify(state.stations)
    }
  }

  for (const recent of state.recents) {
    recent.route = state.routes.find(route => route.id === recent.route)
    recent.station = state.stations.find(station => station.id === recent.station)
  }

  for (const save of state.saves) {
    save.route = state.routes.find(route => route.id === save.route)
    save.station = state.stations.find(station => station.id === save.station)
  }

  // clear search whenever user returns to search page
  if (state.search) {
    delete window.sessionStorage.search
  }

  if (state.user) {
    mount(state.user)
  } else {
    auth.onAuthStateChanged(mount)
  }
})()

async function mount (user) {
  if (state.init) return
  state.init = true

  const { users } = state

  // if a user we haven't cached yet is logged in
  if (user && !state.user) {
    const userdata = (await db.collection('users').doc(user.uid).get()).data()
    userdata.uid = user.uid
    userdata.id = userdata.email
    delete userdata.email
    users.push(userdata)

    const saves = userdata.saves.map(id => {
      const [route, station] = id.split('/')
      return { route, station: +station }
    })
    state.saves.push(...saves)

    const stnids = saves.map(save => save.station)
    if (stnids.length) {
      const news = await getstns(stnids)
      if (news.length) {
        state.stations.push(...news)
        window.localStorage.stations = JSON.stringify(state.stations)
      }
    }

    for (const save of state.saves) {
      save.route = state.routes.find(route => route.id === save.route)
      save.station = state.stations.find(station => station.id === save.station)
    }

    window.sessionStorage.user = JSON.stringify(userdata)
    window.sessionStorage.users = JSON.stringify(users)
    state.user = userdata
  }

  // render page
  update()

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

function update (data) {
  Object.assign(state, data)
  patch($page, HomePage(state))
}

function HomePage (state) {
  const { user, tab, recents, saves, messages } = state
  const name = user ? user.name.split(' ')[0] : ''

  // login/logout button
  const onlogin = async _ => {
    if (!user) {
      window.location.href = 'login.html'
    } else {
      await firebase.auth().signOut()
      delete window.sessionStorage.user
      window.location.href = 'index.html'
    }
  }

  return main({ class: 'page -home' }, [
    header({ class: 'header -search -home' }, [
      div({ class: 'title-row' }, [
        h1({ class: 'title' }, 'Home'),
        button({ class: 'button -login', onclick: onlogin },
          !user ? 'Login' : 'Logout')
      ]),
      a({ href: './search.html', class: 'search' }, [
        div({ class: 'search-bar' }, [
          span({ class: 'icon -search material-icons' },
            'search'),
          span({ class: 'search-input' }, 'Search routes')
        ])
      ])
    ]),
    div({ class: 'page-content' }, [
      user
        ? span({ class: 'greeting' },
            ['Hi, ', strong(name), '!'])
        : '',
      section({ class: 'section -stations' }, [
        h2({ class: 'section-title section-header' },
          tab === 'recents' ? 'Recent Stations' : 'Saved Stations'),
        user && div({ class: 'section-tabs' }, [
          button({
            class: 'section-tab' + (tab === 'recents' ? ' -select' : ''),
            onclick: _ => update(switchtab(state, 'recents'))
          }, [
            span({ class: 'icon -tab material-icons' },
              tab === 'recents' ? 'watch_later' : 'access_time'),
            'History'
          ]),
          button({
            class: 'section-tab' + (tab === 'saves' ? ' -select' : ''),
            onclick: _ => update(switchtab(state, 'saves'))
          }, [
            span({ class: 'icon -tab material-icons' },
              tab === 'saves' ? 'star' : 'star_outline'),
            'Saved'
          ])
        ]),
        tab === 'recents'
          ? recents.length
              ? div({ class: 'section-content stations -recent' }, recents.slice(0, 3).map(Save))
              : span({ class: 'section-content section-notice' },
                'When you view a station, it will appear here.')
          : saves.length
            ? div({ class: 'section-content stations -saves' }, saves.map(Save))
            : span({ class: 'section-content section-notice' },
              'When you save a station, it will appear here.')
      ]),
      section({ class: 'section -messages' }, [
        h2({ class: 'section-title section-header' }, 'Recent Messages'),
        messages.length
          ? div({ class: 'section-content messages' }, messages.slice(0, 3).map(Message))
          : span({ class: 'section-content section-notice' },
            'No recent user activity!')
      ])
    ])
  ])
}

function Save (save) {
  const { station, route } = save
  const [name, subname] = fmtstn(station.name)
  const addendum = subname ? [' · ', strong(subname)] : []
  return a({ class: 'option', href: `station.html#${route.id}/${station.id}` }, [
    div({ class: 'option-lhs' }, [
      span({ class: 'icon -route material-icons-outlined' },
        'place'),
      div({ class: 'option-meta' }, [
        div({ class: 'option-name' }, `${name} (${route.number}${route.pattern})`),
        div({ class: 'option-data' },
          [station.id, ...addendum])
      ])
    ]),
    div({ class: 'option-rhs' }, [
      span({ class: 'icon -option material-icons' }, 'chevron_right')
    ])
  ])
}

function Message (message) {
  const { timestamp, route: routeid, username, content } = message
  const route = state.routes.find(rt => rt.id === routeid)
  const now = Date.now()
  const ago = timediff(timestamp, now)
  return a({ class: 'option -message', href: 'chat.html#' + routeid }, [
    div({ class: 'option-lhs' }, [
      span({ class: 'icon -message material-icons-outlined' },
        'sms'),
      div({ class: 'option-meta' }, [
        div({ class: 'option-name' }, `"${content}"`),
        div({ class: 'option-data' },
          ['from ', strong(username), ' on ', strong(route.number + route.pattern)])
      ])
    ]),
    div({ class: 'option-rhs' }, [
      span({ class: 'option-time' }, ago),
      span({ class: 'icon -arrow material-icons' },
        'keyboard_arrow_right')
    ])
  ])
}

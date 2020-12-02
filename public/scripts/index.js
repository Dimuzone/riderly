const {
  firebase, db, timediff, normname, patch,
  main, header, section, div, h1, h2, button, span, strong, a
} = window

const $main = document.querySelector('main')

const state = {
  user: JSON.parse(window.sessionStorage.user || null),
  tab: 'recents',
  recents: [],
  saves: [],
  messages: []
}

const switchtab = (state, newtab) =>
  ({ ...state, tab: newtab })

;(async function main () {
  const cache = window.localStorage.getItem('recents')
  state.recents = !cache
    ? state.recents
    : cache.split(',')
      .reverse()
      .slice(0, 3)
      .map(decodestn)

  render(state)

  // get chat messages and rerender
  const col = await db.collection('messages')
    .orderBy('timestamp', 'desc')
    .limit(3).get()
  for (const doc of col.docs) {
    state.messages.push(doc.data())
  }
})()

firebase.auth().onAuthStateChanged(async user => {
  // if user isn't logged in, we don't need to do anything extra.
  // just render and exit
  if (!user) return render(state)

  // save user data
  const doc = await db.collection('users').doc(user.uid).get()
  const userdata = doc.data()
  state.user = userdata
  state.saves = userdata.saves.reverse().map(decodestn)
  render(state)
})

function decodestn (stn) {
  const [id, route, name, before, after] = stn.split('-')
  return { id, route, name, before, after }
}

function render (state) {
  const { user, tab, recents, saves, messages } = state
  const name = user ? user.name.split(' ')[0] : ''

  // login/logout button
  const onlogin = async _ => {
    if (!user) {
      window.location.href = 'login.html'
    } else {
      await firebase.auth().signOut()
      window.location.href = 'index.html'
    }
  }

  patch($main, main({ class: 'page -home' }, [
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
        div({ class: 'section-tabs' }, [
          button({
            class: 'section-tab' + (tab === 'recents' ? ' -select' : ''),
            onclick: _ => render(switchtab(state, 'recents'))
          }, [
            span({ class: 'icon -tab material-icons' },
              tab === 'recents' ? 'watch_later' : 'access_time'),
            'History'
          ]),
          button({
            class: 'section-tab' + (tab === 'saves' ? ' -select' : ''),
            onclick: _ => render(switchtab(state, 'saves'))
          }, [
            span({ class: 'icon -tab material-icons' },
              tab === 'saves' ? 'star' : 'star_outline'),
            'Saved'
          ])
        ]),
        tab === 'recents'
          ? recents.length
              ? div({ class: 'section-content stations -recent' }, recents.map(renderstn))
              : span({ class: 'section-content section-notice' },
                'When you view a station, it will appear here.')
          : saves.length
            ? div({ class: 'section-content stations -saves' }, saves.map(renderstn))
            : span({ class: 'section-content section-notice' },
              'When you save a station, it will appear here.')
      ]),
      section({ class: 'section -messages' }, [
        h2({ class: 'section-title section-header' }, 'Recent Messages'),
        messages.length
          ? div({ class: 'section-content messages' }, messages.map(Message))
          : span({ class: 'section-content section-notice' },
            'No recent user activity!')
      ])
    ])
  ]))
}

function renderstn (station) {
  const [on, at] = normname(station.name)
  function onclick () {
    window.sessionStorage.setItem('stationId', station.id)
    window.sessionStorage.setItem('route', station.route)
    window.sessionStorage.setItem('stationName', station.name)
    window.sessionStorage.setItem('before', station.before)
    window.sessionStorage.setItem('after', station.after)
    window.location.href = 'station.html'
  }
  return div({ class: 'option', onclick }, [
    div({ class: 'option-lhs' }, [
      span({ class: 'option-text' }, on),
      span({ class: 'option-subtext' },
        [station.route, ' ‧ ', station.id, ...(at ? [' · ', strong(at)] : [])])
    ]),
    div({ class: 'option-rhs' }, [
      span({ class: 'icon -option material-icons' }, 'chevron_right')
    ])
  ])
}

const Message = (message) => {
  const { timestamp, route: routeid, username, content } = message
  const now = Date.now()
  const ago = timediff(timestamp, now)
  return a({ class: 'option -message', href: 'chat.html#' + routeid }, [
    div({ class: 'option-lhs' }, [
      span({ class: 'icon -message material-icons-outlined' },
        'sms'),
      div({ class: 'option-meta' }, [
        div({ class: 'option-name' }, `"${content}"`),
        div({ class: 'option-data' },
          ['from ', strong(username), ' on ', strong(routeid)])
      ])
    ]),
    div({ class: 'option-rhs' }, [
      span({ class: 'option-time' }, ago),
      span({ class: 'icon -arrow material-icons' },
        'keyboard_arrow_right')
    ])
  ])
}

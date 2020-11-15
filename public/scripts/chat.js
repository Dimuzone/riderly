const route = "49W"
let user = "guest"
let messages = []

firebase.auth().onAuthStateChanged(user => {
	if (user) {
		user = user.email.slice(0, user.email.indexOf("@"))
		console.log(user)
		render({ user, messages })
	} else {
		console.log("No user logged in")
	}
})

let page = document.querySelector(".page.-chat")
let textbox = null
let wrap = null
let groups = null

const send = (state) => {
	if (!textbox.value) return false
	let message = {
		time: Date.now(),
		route: route,
		author: state.user,
		content: textbox.value,
		likes: 0
	}
	db.collection("messages").add(message)
	render({
		...state,
		messages: [ ...state.messages, message ]
	})
	scroll()
	textbox.value = ""
	return true
}

const render = state =>
	patch(page,
		main({ class: "page -chat" }, [
			div({ class: "messages" }, [ renderMessages(state) ]),
			div({ class: "message-bar" }, [
				input({
					class: "message-input",
					placeholder: "Enter a message...",
					onkeypress: evt => evt.key === "Enter" ? send(state) : true
				}),
				button({
					class: "message-send material-icons",
					onclick: _ => send(state)
				}, "arrow_upward")
			])
		])
	)

const init = _ => {
	render({ user, messages })
	textbox = document.querySelector(".message-input")
	groups = document.querySelector(".message-groups")
	wrap = document.querySelector(".messages")
	window.addEventListener("resize", scroll)
	scroll()
}

db.collection("messages").where("route", "==", route)
	.get()
	.then(col => {
		col.forEach(doc => messages.push(doc.data()))
		messages.sort((a, b) => a.time - b.time)
		init()
	})

function scroll() {
	if (groups.clientHeight > wrap.clientHeight) {
		wrap.classList.add("-scroll")
		wrap.scrollTop = groups.clientHeight - wrap.clientHeight
	} else if (wrap.classList.contains("-scroll")) {
		wrap.classList.remove("-scroll")
	}
}

function renderMessages(state) {
	let groups = []
	let group = null
	let author = null
	for (let msg of state.messages) {
		if (msg.author !== author) {
			author = msg.author
			group = author === state.user
				? div({ class: "message-group -user" }, [
						span({ class: "message-author" }, [ author + " (You)" ])
					])
				: div({ class: "message-group" }, [
						span({ class: "message-author" }, [ author ])
					])
			groups.push(group)
		}
		let message = div({ class: "message" }, [ msg.content ])
		group.content.push(message)
	}
	let el = div({ class: "message-groups" }, groups)
	return el
}

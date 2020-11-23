const auth = firebase.auth()
const route = "49W"
let page = document.querySelector(".page.-chat")
let textbox = null
let wrap = null
let groups = null
let state = {
	userid: null,
	username: null,
	messages: []
}

updateUser(auth.currentUser)
auth.onAuthStateChanged(updateUser)

db.collection("messages")
	.where("route", "==", route)
	.onSnapshot(col => {
		for (let doc of col.docs) {
			if (!state.messages.find(msg => msg.id === doc.id)) {
				state.messages.push({ id: doc.id, ...doc.data() })
			}
		}
		state.messages.sort((a, b) => a.time - b.time)
		render(state)
	})

async function updateUser(user) {
	if (user) {
		let userdoc = await db.collection("users").doc(user.uid).get()
		state.userid = userdoc.data().email
		state.username = userdoc.data().name
		render(state)
	} else {
		let token = localStorage.getItem("token")
		if (!token) {
			token = Math.random().toString().slice(2)
			localStorage.setItem("token", token)
		}
		state.userid = token
		render(state)
	}
}

function render(state) {
	patch(page, main({ class: "page -chat" }, [
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
	]))
	textbox = document.querySelector(".message-input")
	groups = document.querySelector(".message-groups")
	wrap = document.querySelector(".messages")
	window.addEventListener("resize", scroll)
	scroll()
}

function send(state) {
	if (!textbox.value) return false
	let message = {
		timestamp: Date.now(),
		route: route,
		username: state.username,
		userid: state.userid,
		content: textbox.value,
		likes: 0
	}
	db.collection("messages").add(message)
	render({
		...state,
		messages: [ ...state.messages, message ]
	})
	textbox.value = ""
	return true
}

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
		if (msg.userid !== author) {
			author = msg.userid
			group = author === state.userid
				? div({ class: "message-group -user" }, [
						span({ class: "message-author" }, [ msg.username + " (You)" ])
					])
				: div({ class: "message-group" }, [
						span({ class: "message-author" }, [ msg.username ])
					])
			groups.push(group)
		}
		group.content.push(
			div({ class: "message" }, [ msg.content ])
		)
	}
	let el = div({ class: "message-groups" }, groups)
	return el
}

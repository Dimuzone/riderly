let page = document.querySelector(".page.-chat")
let textbox = null
let wrap = null
let groups = null
let chatid = null

const send = (state) => {
	if (!textbox.value) return false
	let message = {
		time: Date.now(),
		author: state.user,
		content: textbox.value
	}
	update({
		...state,
		messages: [ ...state.messages, message ]
	})
	scroll()
	textbox.value = ""
	db.collection("chats/" + chatid + "/messages").add(message)
	return true
}

const update = (state) =>
	patch(page,
		main({ class: "page -chat" }, [
			div({ class: "messages" }, [ renderMessages(state) ]),
			div({ class: "message-bar" }, [
				input({
					class: "message-input",
					placeholder: "Enter a message...",
					onkeypress: (evt) => evt.key === "Enter" ? send(state) : true
				}),
				button({
					class: "message-send material-icons",
					onclick: _ => send(state)
				}, [ "arrow_upward" ])
			])
		])
	)

const getId = (route) => new Promise(resolve =>
	db.collection("chats").get()
		.then(chats => chats.forEach(doc => {
			if (doc.data().route === route)  {
				chatid = doc.id
				resolve(doc.id)
			}
		})))

const getMessages = (id) => new Promise(resolve =>
	db.collection("chats/" + id + "/messages").get()
		.then(col => {
			let messages = []
			col.forEach(doc => messages.push(doc.data()))
			messages.sort((a, b) => a.time - b.time)
			resolve(messages)
		}))

const init = (messages) => {
	update({
		user: "instant_noodle",
		messages: messages
	})
	textbox = document.querySelector(".message-input")
	groups = document.querySelector(".message-groups")
	wrap = document.querySelector(".messages")
	window.addEventListener("resize", scroll)
	scroll()
}

getId("49W")
	.then(getMessages)
	.then(init)

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

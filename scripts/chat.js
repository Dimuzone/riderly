let page = document.querySelector(".page.-chat")
let textbox = null
let wrap = null
let groups = null

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
	db.collection("chats")
		.doc("49W")
		.collection("messages")
		.add(message)
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

db.collection("chats")
	.doc("49W")
	.collection("messages")
	.get()
	.then(data => {
		let messages = []
		data.forEach(message => messages.push(message.data()))
		messages.sort((a, b) => a.time - b.time)
		init(messages)
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

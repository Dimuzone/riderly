const wrap = document.querySelector(".messages-wrap")
const send = document.querySelector(".message-send")
const input = document.querySelector(".message-input")

// raw application data
const state = {
	user: "instant_noodle",
	messages: [
		{ time: null, author: "instant_noodle", content: "Ambulance on the scene" },
		{ time: null, author: "DeclanBarlow", content: "it's been 30 mins :((" },
		{ time: null, author: "DeclanBarlow", content: "my boss is gonna talk my ear off" },
		{ time: null, author: "bboberts", content: "Wait" },
		{ time: null, author: "bboberts", content: "What happened??" },
		{ time: null, author: "instant_noodle", content: "A semi got rearended off marine right before the loop" },
		{ time: null, author: "bboberts", content: "Ooo" }
	]
}

// mutate state
const actions = {
	send: message => {
		state.messages.push(message)
	}
}

// calls actions in response to user interaction
const events = {
	mount: el => {
		let tree = renderMessages(state.messages, state)
		view = manifest(tree)
		el.appendChild(view)
		scroll()

		send.onclick = events.send
		input.onkeypress = evt => {
			if (evt.key === "Enter") {
				events.send()
			}
		}
	},
	send: _ => {
		if (!input.value) return false
		actions.send({
			time: null,
			author: state.user,
			content: input.value
		})
		let tree = renderMessages(state.messages, state)
		patch(view, tree)
		scroll()
		input.value = ""
	}
}

let view = null
events.mount(wrap)

function scroll() {
	if (wrap.scrollHeight > wrap.clientHeight) {
		wrap.scrollTop = wrap.scrollHeight - wrap.clientHeight
	}
}

function renderMessage(message, state) {
	return message.author === state.user
		? div({ class: "message -user" }, [
				div({ class: "message-text" }, [ message.content ])
			])
		: div({ class: "message" }, [
				div({ class: "message-text" }, [ message.content ])
			])
}

function renderMessages(messages, state) {
	let groups = []
	let group = null
	let author = null
	for (let msg of messages) {
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
		let message = renderMessage(msg, state)
		group.content.push(message)
	}
	let el = div({ class: "messages" }, groups)
	return el
}

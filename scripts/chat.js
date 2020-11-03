const wrap = document.querySelector(".messages-wrap")

const state = {
	user: "instant_noodle",
	messages: [
		{ time: null, author: "instant_noodle", content: "Ambulance on the scene" },
		{ time: null, author: "DeclanBarlow", content: "it's been 30 mins :((" },
		{ time: null, author: "DeclanBarlow", content: "my boss is gonna talk my ear off" },
		{ time: null, author: "bboberts", content: "Wait" },
		{ time: null, author: "bboberts", content: "What happened??" },
		{ time: null, author: "instant_noodle", content: "A semi got rearended off marine right before the loop" },
		{ time: null, author: "bboberts", content: "Ooo" },
	]
}

const renderMessages = (messages, state) => {
	let groups = []
	let group = null
	let author = null
	for (let message of messages) {
		if (message.author !== author) {
			author = message.author
			group = author === state.user
				? div({ class: "message-group -user" }, [
						span({ class: "message-author" }, [ author + " (You)" ])
					])
				: div({ class: "message-group" }, [
						span({ class: "message-author" }, [ author ])
					])
			groups.push(group)
		}
		group.appendChild(renderMessage(message, state))
	}
	let el = div({ class: "messages" }, groups)
	return el
}

const renderMessage = (message, state) =>
	message.author === state.user
		? div({ class: "message -user" }, [
				div({ class: "message-text" }, [ message.content ])
			])
		: div({ class: "message" }, [
				div({ class: "message-text" }, [ message.content ])
			])

let messages = renderMessages(state.messages, state)
wrap.appendChild(messages)

if (wrap.scrollHeight > wrap.clientHeight) {
	wrap.scrollTop = wrap.scrollHeight - wrap.clientHeight
}

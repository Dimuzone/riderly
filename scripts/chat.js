let textbox = null
let wrap = null
let groups = null

const send = (state) => {
	if (!textbox.value) return false
	update({
		...state,
		messages: [ ...state.messages, {
			time: null,
			author: state.user,
			content: textbox.value
		}]
	})
	scroll()
	textbox.value = ""
	return true
}

const update = (state) =>
	patch(document.querySelector(".page.-chat"),
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

// set initial state
update({
	user: "instant_noodle",
	messages: [ // this will be retrieved async by db
		{ time: null, author: "instant_noodle", content: "Ambulance on the scene" },
		{ time: null, author: "DeclanBarlow", content: "it's been 30 mins :((" },
		{ time: null, author: "DeclanBarlow", content: "my boss is gonna talk my ear off" },
		{ time: null, author: "bboberts", content: "Wait" },
		{ time: null, author: "bboberts", content: "What happened??" },
		{ time: null, author: "instant_noodle", content: "A semi got rearended off marine right before the loop" },
		{ time: null, author: "bboberts", content: "Ooo" }
	]
})

textbox = document.querySelector(".message-input")
wrap = document.querySelector(".messages")
groups = document.querySelector(".message-groups")
scroll()

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

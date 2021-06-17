let questions = [];
const questionTime = 10;

class Game {
	index = 0;
	correct_answers = 0;
	stopWatch = questionTime;
	timer = null;
	pause = false;
	config = {}

	constructor(config) {
		this.config = config;
		config.render(this);
		this.startTimer();
		config.ready();
	}

	interval() {
		if (this.stopWatch === 0) {
			this.config.flashCorrectOption();
			this.stopTimer();
			setTimeout(() => this.nextQuestion(), 1000);
		} else {
			this.stopWatch--
			this.config.updateStopWatch(this);
		}
	}

	startTimer() {
		this.pause = false;
		this.timer = setInterval(() => this.interval(), 1000);
	}

	stopTimer() {
		this.pause = true;
		clearInterval(this.timer);
	}

	getQuestion() {
		return questions[this.index];
	}

	answer(optionIndex) {
		if (this.pause) return;
		this.stopTimer();
		const {answer} = this.getQuestion();
		if (parseInt(optionIndex) !== answer) {
			return answer;
		}
		this.correct_answers++;
	}

	nextQuestion() {
		if (questions.length - 1 === this.index) {
			this.endGame();
			return;
		}
		this.index++;
		this.startTimer();
		this.stopWatch = questionTime;
		this.config.render(this);
	}

	endGame() {
		this.config.endGame()
	}
}

$(document).ready(async function () {
	questions = await fetch('src/data/questions.json')
	.then(response => response.json());
	const dom = {
		stats: $('#stats'),
		stopWatch: $('#stop-watch'),
		modal: {
			self: $('#modal'),
			title: $('#modal-title'),
			data: $('#data'),
			startGameButton: $('#start-game-button')
		},
		gameContainer: $('#game-container'),
		question: $('#question'),
		text: $('#text'),
		extra: $("#extra"),
		options: $('#options'),
	}
	let game;

	function flashCorrectOption() {
		dom.options.children().eq(game.getQuestion().answer).addClass('correct');
	}

	function clickButton(event) {
		if (game.pause) return;
		const optionDiv = event.target;
		const index = optionDiv.getAttribute('index');
		$(optionDiv).addClass('selected');
		const isAnswerWrong = game.answer(index) !== undefined
		setTimeout(() => {
			$(optionDiv).addClass(isAnswerWrong ? 'wrong' : 'correct');
			flashCorrectOption();
			setTimeout(() => game.nextQuestion(), 1000);
		}, 1000);
	}

	function createButton(text, index) {
		const optionDiv = document.createElement('div');
		$(optionDiv).addClass('box');
		optionDiv.innerText = text;
		optionDiv.setAttribute('index', index);
		optionDiv.addEventListener('click', clickButton)
		return optionDiv;
	}

	function renderQuestion(game) {
		const question = game.getQuestion();
		dom.text.html(question.text);
		dom.extra.html('');
		if (question.hasOwnProperty('image'))
			dom.extra.html(`<img src="${question.image}"/>`);
		if (question.hasOwnProperty('video'))
			dom.extra.html(`
			<video width="100%" height="240" autoplay>
			  <source src="${question.video}" type="video/mp4">
				Your browser does not support the video tag.
			</video>`);
		if (question.hasOwnProperty('sound'))
			dom.extra.html(`
			<video controls autoplay height="50px" width="100%">
			  <source src="${question.sound}" type="audio/mpeg">
				Your browser does not support the audio element.
			</video>`);
		dom.options.html(question.options.map(createButton));
	}

	function renderStats(game) {
		dom.stats.html(`${game.correct_answers} / ${game.index + 1}`);
	}

	function renderStopWatch(game) {
		dom.stopWatch.html(`${game.stopWatch} saniye`);
	}

	function render(game) {
		renderStats(game);
		renderStopWatch(game);
		renderQuestion(game);
	}

	function startGame() {
		dom.modal.self.addClass('hidden');
		dom.gameContainer.removeClass('hidden');
	}

	function endGame() {
		dom.modal.title.text("Oyun Bitti");
		dom.modal.startGameButton.text('Yeniden Oyna')
		dom.modal.self.removeClass('hidden');
		dom.gameContainer.addClass('hidden');
		dom.modal.data.html(`
			<h2>Soru Sayısı: ${questions.length}</h2>
			<h2>Doğru Sayısı: ${game.correct_answers}</h2>
		`);
	}

	dom.modal.startGameButton.click(async function () {
		game = await new Game({
			updateStopWatch: renderStopWatch,
			ready: startGame,
			render,
			flashCorrectOption,
			endGame,
		});
	});

})

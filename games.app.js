const games = [
	{ id: "runner", title: "Infinity Runner", description: "Corra, pule os obstaculos e sobreviva o maximo possivel.", icon: "01" },
	{ id: "invaders", title: "Space Invaders", description: "Defenda a nave e destrua a invasao alienigena.", icon: "02" },
	{ id: "platform", title: "Plataforma", description: "Pule entre plataformas e alcance a bandeira.", icon: "03" },
	{ id: "memory", title: "Jogo da memoria", description: "Encontre todos os pares escondidos.", icon: "04" },
	{ id: "puzzle", title: "Quebra-cabeca", description: "Organize as pecas na ordem de 1 a 15.", icon: "05" }
];

const summaries = document.querySelector("#resumo-jogos");
const stage = document.querySelector("#game-stage");
const gameInfo = document.querySelector("#game-info");
let activeId = null;

const controls = {
	runner: ["Segure Espaco, seta para cima ou clique: pule mais alto", "Solte o controle para diminuir o salto", "Desvie dos obstaculos e sobreviva"],
	invaders: ["Setas esquerda/direita: mover a nave", "Espaco ou clique: disparar", "Destrua a onda para liberar a proxima"],
	platform: ["Setas esquerda/direita: andar", "Segure Espaco ou clique: pular", "Vença todas as fases e alcance a bandeira"],
	memory: ["Clique em duas cartas para revelar um par", "Encontre todos os pares de emojis", "A dificuldade aumenta com mais cartas"],
	puzzle: ["Escolha 3x3, 4x4 ou 5x5", "Clique em uma peca vizinha ao espaco vazio", "Organize os numeros na ordem correta"]
};

function renderMenus() {
	games.forEach((game) => {
		const card = document.createElement("button");
		card.className = "game-card";
		card.dataset.game = game.id;
		card.innerHTML = `<strong>${game.icon} &nbsp; ${game.title}</strong><span>${game.description}</span>`;
		summaries.append(card);
	});
	document.querySelectorAll(".game-card").forEach((button) => button.addEventListener("click", () => selectGame(button.dataset.game)));
}

function selectGame(id) {
	const game = games.find((item) => item.id === id);
	activeId = id;
	gameInfo.innerHTML = `<span class="eyebrow">COMO JOGAR</span><h2>${game.title}</h2><p>${game.description}</p><ul>${controls[id].map((control) => `<li>${control}</li>`).join("")}</ul>`;
	stage.innerHTML = `<div class="game-panel"><span class="eyebrow">DESAFIO ${game.icon}</span><h2>${game.title}</h2><p>${game.description}</p><div id="game-content"></div></div>`;
	startGame(id, document.querySelector("#game-content"));
	document.querySelector("#jogo-id").scrollIntoView({ behavior: "smooth", block: "start" });
}

function startGame(id, container) {
	if (id === "runner") setupRunner(container);
	if (id === "invaders") setupInvaders(container);
	if (id === "platform") setupPlatform(container);
	if (id === "memory") setupMemory(container);
	if (id === "puzzle") setupPuzzle(container);
}

function canvasGame(container, title, help) {
	container.innerHTML = `<canvas class="arcade-canvas" width="720" height="400" tabindex="0" aria-label="${title}"></canvas><div class="game-stat" id="canvas-status">Clique no canvas para comecar.</div><p class="game-help">${help}</p>`;
	const canvas = container.querySelector("canvas");
	canvas.focus();
	return { canvas, context: canvas.getContext("2d"), status: container.querySelector("#canvas-status") };
}

function setupRunner(container) {
	const game = canvasGame(container, "Infinity Runner", "Segure Espaco, seta para cima ou o canvas para carregar o salto.");
	const { canvas, context, status } = game; let player; let obstacles; let frame; let score; let playing; let holding; let last = 0;
	const reset = () => { player = { x: 80, y: 320, vy: 0, grounded: true }; obstacles = []; score = 0; playing = true; holding = false; last = 0; status.textContent = "Corra e carregue seus saltos!"; cancelAnimationFrame(frame); frame = requestAnimationFrame(loop); };
	const pressJump = () => { if (!playing) { reset(); return; } holding = true; if (player.grounded) { player.vy = -11; player.grounded = false; } };
	const releaseJump = () => { holding = false; if (player.vy < -5) player.vy = -5; };
	const loop = (time) => { const delta = Math.min((time - last) / 16.67 || 1, 2); last = time; player.vy += (holding && player.vy < 0 ? .3 : .7) * delta; player.y += player.vy * delta; if (player.y >= 320) { player.y = 320; player.vy = 0; player.grounded = true; } if (Math.random() < .018 * delta) obstacles.push({ x: 720, width: 22 + Math.random() * 22, height: 28 + Math.random() * 30 }); obstacles.forEach((item) => item.x -= 6 * delta); obstacles = obstacles.filter((item) => item.x > -50); score += .12 * delta; if (obstacles.some((item) => item.x < player.x + 26 && item.x + item.width > player.x && item.height > 350 - player.y)) { playing = false; status.textContent = `Fim de jogo. Pontuacao: ${Math.floor(score)}. Segure o controle para reiniciar.`; drawRunner(); return; } drawRunner(); frame = requestAnimationFrame(loop); };
	const drawRunner = () => { context.fillStyle = "#9be4e1"; context.fillRect(0, 0, 720, 400); context.fillStyle = "#064d4d"; context.fillRect(0, 350, 720, 50); context.fillStyle = "#f5e6b8"; context.fillRect(player.x, player.y, 28, 30); obstacles.forEach((item) => { context.fillStyle = "#b22222"; context.fillRect(item.x, 350 - item.height, item.width, item.height); }); context.fillStyle = "#064d4d"; context.font = "bold 20px Arial"; context.fillText(`Pontos: ${Math.floor(score)}`, 20, 32); };
	canvas.addEventListener("pointerdown", pressJump); canvas.addEventListener("pointerup", releaseJump); canvas.addEventListener("pointerleave", releaseJump); window.addEventListener("keydown", (event) => { if (activeId === "runner" && (event.code === "Space" || event.code === "ArrowUp")) { event.preventDefault(); pressJump(); } }); window.addEventListener("keyup", (event) => { if (activeId === "runner" && (event.code === "Space" || event.code === "ArrowUp")) releaseJump(); }); reset();
}

function setupInvaders(container) {
	const game = canvasGame(container, "Space Invaders", "Use as setas para mover e Espaco para disparar. As ondas ficam mais dificeis."); const { canvas, context, status } = game; let ship; let bullets; let aliens; let keys = {}; let frame; let playing; let wave; let alienSpeed;
	const startWave = () => { const rows = Math.min(2 + wave, 5); const columns = Math.min(5 + wave, 9); aliens = Array.from({ length: rows * columns }, (_, index) => ({ x: 60 + (index % columns) * 68, y: 55 + Math.floor(index / columns) * 38, alive: true })); alienSpeed = .04 + wave * .035; status.textContent = `Onda ${wave}: ${aliens.length} invasores.`; };
	const reset = () => { ship = { x: 350, y: 360 }; bullets = []; wave = 1; playing = true; startWave(); cancelAnimationFrame(frame); frame = requestAnimationFrame(loop); };
	const shoot = () => { if (playing) bullets.push({ x: ship.x + 8, y: ship.y }); };
	const loop = () => { if (!playing) return; if (keys.ArrowLeft) ship.x -= 5; if (keys.ArrowRight) ship.x += 5; ship.x = Math.max(10, Math.min(690, ship.x)); bullets.forEach((bullet) => bullet.y -= 8); aliens.forEach((alien) => { if (alien.alive && bullets.some((bullet) => bullet.x > alien.x && bullet.x < alien.x + 28 && bullet.y < alien.y + 20 && bullet.y > alien.y - 8)) { alien.alive = false; bullets = bullets.filter((bullet) => !(bullet.x > alien.x && bullet.x < alien.x + 28 && bullet.y < alien.y + 20)); } }); aliens.forEach((alien) => { if (alien.alive) alien.y += alienSpeed; }); bullets = bullets.filter((bullet) => bullet.y > 0); if (aliens.some((alien) => alien.alive && alien.y > 335)) { playing = false; status.textContent = "Os invasores chegaram! Pressione Enter para recomecar."; } drawInvaders(); if (!playing) return; if (aliens.every((alien) => !alien.alive)) { wave += 1; startWave(); } frame = requestAnimationFrame(loop); };
	const drawInvaders = () => { context.fillStyle = "#081c35"; context.fillRect(0, 0, 720, 400); context.fillStyle = "#42c2c2"; context.fillRect(ship.x, ship.y, 28, 16); context.fillStyle = "#f5e6b8"; bullets.forEach((bullet) => context.fillRect(bullet.x, bullet.y, 4, 12)); aliens.forEach((alien) => { if (alien.alive) { context.fillStyle = "#b22222"; context.fillRect(alien.x, alien.y, 28, 20); context.fillStyle = "#f5e6b8"; context.fillRect(alien.x + 6, alien.y + 7, 5, 5); context.fillRect(alien.x + 17, alien.y + 7, 5, 5); } }); };
	window.addEventListener("keydown", (event) => { if (activeId !== "invaders") return; keys[event.code] = true; if (event.code === "Space") { event.preventDefault(); shoot(); } if (event.code === "Enter" && !playing) reset(); }); window.addEventListener("keyup", (event) => { keys[event.code] = false; }); canvas.addEventListener("click", shoot); reset();
}

function setupPlatform(container) {
	const game = canvasGame(container, "Plataforma", "Use as setas para andar, segure Espaco para pular e supere as tres fases."); const { canvas, context, status } = game; let hero; let keys = {}; let frame; let finished; let level = 0; let platforms; let hazards;
	const levels = [
		{ platforms: [{ x: 0, y: 365, width: 720, height: 35 }, { x: 90, y: 285, width: 150, height: 18 }, { x: 300, y: 225, width: 140, height: 18 }, { x: 505, y: 150, width: 130, height: 18 }], hazards: [] },
		{ platforms: [{ x: 0, y: 365, width: 150, height: 35 }, { x: 205, y: 310, width: 105, height: 18 }, { x: 365, y: 245, width: 105, height: 18 }, { x: 535, y: 180, width: 185, height: 18 }], hazards: [{ x: 155, y: 350, width: 45, height: 15 }, { x: 315, y: 350, width: 45, height: 15 }] },
		{ platforms: [{ x: 0, y: 365, width: 120, height: 35 }, { x: 170, y: 275, width: 90, height: 18 }, { x: 325, y: 185, width: 90, height: 18 }, { x: 500, y: 105, width: 110, height: 18 }], hazards: [{ x: 275, y: 350, width: 40, height: 15 }, { x: 430, y: 350, width: 55, height: 15 }] }
	];
	const reset = () => { level = 0; finished = false; loadLevel(); };
	const loadLevel = () => { hero = { x: 35, y: 320, vy: 0, grounded: false }; platforms = levels[level].platforms; hazards = levels[level].hazards; status.textContent = `Fase ${level + 1} de ${levels.length}: alcance a bandeira.`; cancelAnimationFrame(frame); frame = requestAnimationFrame(loop); };
	const loop = () => { if (finished) return; if (keys.ArrowLeft) hero.x -= 4; if (keys.ArrowRight) hero.x += 4; hero.vy += .65; hero.y += hero.vy; hero.grounded = false; platforms.forEach((platform) => { if (hero.x + 24 > platform.x && hero.x < platform.x + platform.width && hero.y + 30 >= platform.y && hero.y + 30 <= platform.y + platform.height + 8 && hero.vy >= 0) { hero.y = platform.y - 30; hero.vy = 0; hero.grounded = true; } }); if (keys.Space && hero.grounded) { hero.vy = -13; keys.Space = false; } hero.x = Math.max(0, Math.min(696, hero.x)); const hitHazard = hazards.some((hazard) => hero.x + 24 > hazard.x && hero.x < hazard.x + hazard.width && hero.y + 30 > hazard.y); if (hero.y > 420 || hitHazard) { status.textContent = "Desafio perdido. Pressione Enter para tentar a fase novamente."; finished = true; } if (hero.x > 620 && hero.y < 180) { if (level < levels.length - 1) { level += 1; loadLevel(); return; } status.textContent = "Campanha concluida! Pressione Enter para recomecar."; finished = true; } drawPlatform(); if (!finished) frame = requestAnimationFrame(loop); };
	const drawPlatform = () => { context.fillStyle = level === 2 ? "#f1c27d" : "#87ceeb"; context.fillRect(0, 0, 720, 400); context.fillStyle = "#f5e6b8"; context.fillRect(625, 90, 5, 90); context.fillStyle = "#b22222"; context.fillRect(630, 90, 42, 22); platforms.forEach((platform) => { context.fillStyle = "#064d4d"; context.fillRect(platform.x, platform.y, platform.width, platform.height); }); hazards.forEach((hazard) => { context.fillStyle = "#b22222"; context.fillRect(hazard.x, hazard.y, hazard.width, hazard.height); }); context.fillStyle = "#f5e6b8"; context.fillRect(hero.x, hero.y, 24, 30); };
	window.addEventListener("keydown", (event) => { if (activeId === "platform") { keys[event.code] = true; if (event.code === "Enter" && finished) { if (level < levels.length - 1) loadLevel(); else reset(); } } }); window.addEventListener("keyup", (event) => { keys[event.code] = false; }); canvas.addEventListener("pointerdown", () => { keys.Space = true; }); reset();
}

function setupMemory(container) {
	const values = ["🚀", "🚀", "👾", "👾", "🌟", "🌟", "🪐", "🪐", "🎮", "🎮", "⚡", "⚡", "🛰️", "🛰️", "🌙", "🌙", "🔥", "🔥", "💎", "💎", "🤖", "🤖", "🛸", "🛸"].sort(() => Math.random() - .5);
	container.innerHTML = `<div class="memory-grid memory-grid-large">${values.map((value, index) => `<button class="memory-card" data-value="${value}" data-index="${index}" aria-label="Carta ${index + 1}">${value}</button>`).join("")}</div><div class="game-stat" id="memory-result">Pares: 0 de ${values.length / 2}</div>`;
	let opened = []; let matched = 0; let locked = false;
	container.querySelectorAll(".memory-card").forEach((card) => card.addEventListener("click", () => {
		if (locked || card.classList.contains("revealed") || card.classList.contains("matched")) return;
		card.classList.add("revealed"); opened.push(card);
		if (opened.length !== 2) return;
		if (opened[0].dataset.value === opened[1].dataset.value) { opened.forEach((item) => item.classList.add("matched")); opened = []; matched += 1; container.querySelector("#memory-result").textContent = matched === values.length / 2 ? "Parabens! Voce encontrou todos os emojis." : `Pares: ${matched} de ${values.length / 2}`; }
		else { locked = true; setTimeout(() => { opened.forEach((item) => item.classList.remove("revealed")); opened = []; locked = false; }, 700); }
	}));
}

function setupPuzzle(container) {
	let size = 4; let tiles; let moves = 0;
	container.innerHTML = `<div class="game-controls"><span>Nivel:</span><button class="game-button puzzle-level" data-size="3">3x3</button><button class="game-button puzzle-level" data-size="4">4x4</button><button class="game-button puzzle-level" data-size="5">5x5</button></div><div class="puzzle-grid"></div><div class="game-stat" id="puzzle-result">Movimentos: 0</div><button class="game-button" id="puzzle-reset">Misturar novamente</button>`;
	const grid = container.querySelector(".puzzle-grid"); const result = container.querySelector("#puzzle-result");
	const shuffle = () => { tiles = Array.from({ length: size * size - 1 }, (_, index) => index + 1).concat(0); for (let index = 0; index < size * size * 12; index += 1) { const blank = tiles.indexOf(0); const neighbors = []; if (blank % size > 0) neighbors.push(blank - 1); if (blank % size < size - 1) neighbors.push(blank + 1); if (blank >= size) neighbors.push(blank - size); if (blank < size * (size - 1)) neighbors.push(blank + size); const swap = neighbors[Math.floor(Math.random() * neighbors.length)]; [tiles[blank], tiles[swap]] = [tiles[swap], tiles[blank]]; } moves = 0; result.textContent = `Movimentos: 0 | Nivel ${size}x${size}`; render(); };
	const render = () => { grid.style.setProperty("--puzzle-size", size); grid.innerHTML = ""; tiles.forEach((value, index) => { const tile = document.createElement("button"); tile.className = `puzzle-tile${value === 0 ? " blank" : ""}`; tile.textContent = value || ""; tile.setAttribute("aria-label", value ? `Peca ${value}` : "Espaco vazio"); tile.addEventListener("click", () => { const blank = tiles.indexOf(0); const neighbors = []; if (blank % size > 0) neighbors.push(blank - 1); if (blank % size < size - 1) neighbors.push(blank + 1); if (blank >= size) neighbors.push(blank - size); if (blank < size * (size - 1)) neighbors.push(blank + size); if (!neighbors.includes(index)) return; [tiles[index], tiles[blank]] = [tiles[blank], tiles[index]]; moves += 1; const solved = tiles.slice(0, -1).every((item, position) => item === position + 1) && tiles[tiles.length - 1] === 0; result.textContent = solved ? `Resolvido em ${moves} movimentos!` : `Movimentos: ${moves} | Nivel ${size}x${size}`; render(); }); grid.append(tile); }); };
	container.querySelectorAll(".puzzle-level").forEach((button) => button.addEventListener("click", () => { size = Number(button.dataset.size); shuffle(); })); container.querySelector("#puzzle-reset").addEventListener("click", shuffle); shuffle();
}

renderMenus();

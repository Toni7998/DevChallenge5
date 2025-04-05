const socket = io();

let gameId = '';
let playerName = '';

const modal = document.getElementById('gameModal');
const joinButton = document.getElementById('joinGameButton');
const gameIdInput = document.getElementById('gameIdInput');
const playerNameInput = document.getElementById('playerNameInput');
const gameArea = document.getElementById('gameArea');

joinButton.addEventListener('click', () => {
    const gameIdInputValue = gameIdInput.value.trim();
    const playerNameInputValue = playerNameInput.value.trim();

    if (gameIdInputValue && playerNameInputValue) {
        gameId = gameIdInputValue;
        playerName = playerNameInputValue;

        socket.emit('joinGame', { gameId, playerName });
        modal.style.display = 'none';
    } else {
        alert('Per favor, omple tots els camps!');
    }
});

socket.on('waitingForPlayers', (message) => {
    gameArea.innerHTML = `<p>${message}</p>`;
    document.body.classList.remove('not-in-game');
});

socket.on('gameStart', (data) => {
    const { cards, names } = data;
    gameArea.innerHTML = ''; // Limpiar área de juego

    const playerCards = cards[socket.id];

    if (!playerCards) {
        gameArea.innerHTML = `
            <div class="message-box lose">
                <h2>No pots jugar en aquesta partida.</h2>
                <p>Només es permeten 2 jugadors actius. Torna enrere i entra a una altra partida.</p>
            </div>`;
        document.body.classList.add('not-in-game');
        return;
    }

    document.body.classList.remove('not-in-game');

    renderCards(playerCards);

    playerCards.forEach((card, index) => {
        const cardElem = document.createElement('div');
        cardElem.classList.add('card');

        const img = document.createElement('img');
        img.src = `images/carta.png`;
        img.alt = 'Carta';

        cardElem.appendChild(img);

        cardElem.onclick = () => {
            socket.emit('pickCard', { gameId, cardIndex: index });
            selectCard(cardElem);
        };
        gameArea.appendChild(cardElem);
    });
});

socket.on('gameResult', (result) => {
    gameArea.innerHTML = `<h2>Resultat</h2>
                          <p>${result.winner ? `${result.winner} ha guanyat!` : "Empat!"}</p>
                          <p>La teva carta: ${result.card1.value} de ${result.card1.suit}</p>
                          <p>La carta de l'altre jugador: ${result.card2.value} de ${result.card2.suit}</p>`;

    const restartButton = document.createElement('button');
    restartButton.textContent = 'Tornar a jugar';
    restartButton.onclick = () => {
        socket.emit('restartRound', { gameId });
        gameArea.innerHTML = '<p>Esperant a la nova ronda...</p>';
    };
    gameArea.appendChild(restartButton);
});

socket.on('playerDisconnected', (data) => {
    gameArea.innerHTML = `<p>El jugador ${data.playerId} s'ha desconnectat. El joc ha acabat prematurament.</p>`;
    document.body.classList.add('not-in-game');
});

socket.on('errorMessage', (msg) => {
    gameArea.innerHTML = `<div class="message-box lose"><p>${msg}</p></div>`;
    document.body.classList.add('not-in-game');
});

function selectCard(cardElem) {
    const selectedCards = document.querySelectorAll('.card.selected');
    selectedCards.forEach(card => card.classList.remove('selected'));
    cardElem.classList.add('selected');
}

function renderCards(cards) {
    const gameArea = document.getElementById('gameArea');
    gameArea.innerHTML = ''; // Limpiar área de juego antes de renderizar las cartas

    // Iterar sobre las cartas del jugador y mostrar cada una
    cards.forEach((card, index) => {
        const cardElem = document.createElement('div');
        cardElem.classList.add('card');

        const img = document.createElement('img');
        img.src = `images/carta.png`; // Asegúrate de que las imágenes de las cartas estén en la carpeta correcta
        img.alt = `${card.value} de ${card.suit}`;

        cardElem.appendChild(img);

        // Acción al seleccionar la carta
        cardElem.onclick = () => {
            socket.emit('pickCard', { gameId, cardIndex: index });
            selectCard(cardElem); // Marcar la carta como seleccionada
        };

        gameArea.appendChild(cardElem);
    });
}

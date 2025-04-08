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
    document.getElementById('waitingMessage').textContent = message;
    document.getElementById('waitingMessage').style.display = 'block';

    const header = document.createElement('div');
    header.classList.add('waiting-header');
    header.innerHTML = `<span class="player-name">Jugador: ${playerName}</span>`;

    gameArea.innerHTML = ''; // Limpia cartas previas pero no elimina `#waitingMessage`
    gameArea.appendChild(header);
    gameArea.appendChild(document.getElementById('waitingMessage'));

    document.body.classList.remove('not-in-game');
});


socket.on('gameStart', (data) => {
    const { cards, names } = data;
    gameArea.innerHTML = '';

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

    const header = document.createElement('div');
    header.classList.add('waiting-header');
    header.innerHTML = `<span class="player-name">Jugador: ${playerName}</span>`;
    gameArea.appendChild(header);

    renderCards(playerCards);
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
    const cardsContainer = document.createElement('div');
    cardsContainer.classList.add('cards-container');

    cards.forEach((card, index) => {
        const cardElem = document.createElement('div');
        cardElem.classList.add('card');

        const img = document.createElement('img');
        img.src = `images/carta.png`;
        img.alt = `${card.value} de ${card.suit}`;

        cardElem.appendChild(img);

        cardElem.onclick = () => {
            socket.emit('pickCard', { gameId, cardIndex: index });
            selectCard(cardElem);
        };

        cardsContainer.appendChild(cardElem);
    });

    gameArea.appendChild(cardsContainer);
}

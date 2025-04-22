document.addEventListener('DOMContentLoaded', () => {
    const socket = io();

    let gameId = '';
    let playerName = '';
    let selectedCardIndex = null;

    const modal = document.getElementById('gameModal');
    const joinButton = document.getElementById('joinGameButton');
    const gameIdInput = document.getElementById('gameIdInput');
    const playerNameInput = document.getElementById('playerNameInput');
    const gameArea = document.getElementById('gameArea');
    const confirmBtn = document.getElementById('confirm-card');

    joinButton.addEventListener('click', () => {
        const gameIdInputValue = gameIdInput.value.trim();
        const playerNameInputValue = playerNameInput.value.trim();

        if (gameIdInputValue && playerNameInputValue) {
            gameId = gameIdInputValue;
            playerName = playerNameInputValue;

            socket.emit('joinGame', { gameId, playerName });
            modal.style.display = 'none';
        } else {
            alert('Si us plau, ompli tots els camps!');
        }
    });

    socket.on('waitingForPlayers', (message) => {
        document.getElementById('waitingMessage').textContent = message;
        document.getElementById('waitingMessage').style.display = 'block';

        const header = document.createElement('div');
        header.classList.add('waiting-header');
        header.innerHTML = `<span class="player-name">Jugador: ${playerName}</span>`;

        const waitingMessage = document.getElementById('waitingMessage');
        waitingMessage.textContent = message;
        waitingMessage.style.display = 'block';

        gameArea.replaceChildren(header, waitingMessage);

        document.body.classList.remove('not-in-game');

        const confirmBtn = document.getElementById('confirm-card');
        if (confirmBtn) confirmBtn.style.display = 'none';
    });

    socket.on('gameStart', (data) => {
        const { cards, names } = data;
        gameArea.innerHTML = '';

        const playerCards = cards[socket.id];

        if (!playerCards) {
            gameArea.innerHTML = `
            <div class="message-box lose">
                <h2>No pots jugar en aquesta partida.</h2>
                <p>Només es permeten 2 jugadors actius. Torna enrere i entra a una altre partida.</p>
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
        gameArea.innerHTML = '';

        const resultBox = document.createElement('div');
        resultBox.classList.add('result-box');

        const title = document.createElement('h2');
        title.textContent = 'Resultat';

        const winnerText = document.createElement('p');
        winnerText.textContent = result.winner ? `Jugador: ${result.winner} ha guanyat!` : "Empat!";

        const playerCard = document.createElement('p');
        playerCard.textContent = `La teva carta: ${result.card1.value} de ${result.card1.suit}`;

        const opponentCard = document.createElement('p');
        opponentCard.textContent = `La carta de l'altre jugador: ${result.card2.value} de ${result.card2.suit}`;

        const restartButton = document.createElement('button');
        restartButton.textContent = 'Tornar a jugar';
        restartButton.onclick = () => {
            socket.emit('restartRound', { gameId });
            gameArea.innerHTML = '<p>Esperant a la nova ronda...</p>';
        };

        resultBox.appendChild(title);
        resultBox.appendChild(winnerText);
        resultBox.appendChild(playerCard);
        resultBox.appendChild(opponentCard);
        resultBox.appendChild(restartButton);

        // Comprovem que els elements existeixen abans de modificar-los
        const confirmBtn = document.getElementById('confirm-card');
        const cards = document.getElementById('cards');

        if (confirmBtn) {
            confirmBtn.style.display = 'none';
        }

        if (cards) {
            cards.style.display = 'none';
        }

        gameArea.appendChild(resultBox);
    });

    socket.on('playerDisconnected', (data) => {
        gameArea.innerHTML = `
            <p>El jugador ${data.playerName} s'ha desconnectat. Pots esperar un altre jugador o buscar una nova partida.</p>
            <button id="findNewGameButton">Buscar una altra partida</button>
        `;
        document.body.classList.add('not-in-game');

        const confirmBtn = document.getElementById('confirm-card');
        if (confirmBtn) confirmBtn.style.display = 'none';

        const findNewGameButton = document.getElementById('findNewGameButton');
        findNewGameButton.addEventListener('click', () => {
            // Lógica para buscar una nueva partida o esperar
            // Aquí podrías agregar la lógica que prefieras para hacer que el jugador busque una nueva partida
            socket.emit('joinGame', { gameId: 'nuevoGameId', playerName });
        });
    });

    function restartGame() {
        socket.emit('restartRound', { gameId });
        gameArea.innerHTML = '<p>Esperant a la nova ronda...</p>';
    }

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

        selectedCardIndex = null;

        // Eliminar y recrear el botón confirm-card si no está
        let confirmBtn = document.getElementById('confirm-card');
        if (!confirmBtn) {
            confirmBtn = document.createElement('button');
            confirmBtn.id = 'confirm-card';
            confirmBtn.textContent = 'Confirmar carta';
            confirmBtn.disabled = true;

            confirmBtn.onclick = () => {
                if (selectedCardIndex !== null && !confirmBtn.disabled) {
                    socket.emit('pickCard', { gameId, cardIndex: selectedCardIndex });

                    confirmBtn.disabled = true;
                    confirmBtn.classList.add('active');

                    // Desactivar todos los eventos onclick de las cartas
                    const allCards = document.querySelectorAll('.card');
                    allCards.forEach(card => {
                        card.onclick = null;
                        card.classList.add('disabled');
                    });
                }
            };

        } else {
            confirmBtn.disabled = true;
            confirmBtn.classList.remove('active');
            confirmBtn.style.display = 'block';
        }

        cards.forEach((card, index) => {
            const cardElem = document.createElement('div');
            cardElem.classList.add('card');

            const img = document.createElement('img');
            img.src = `images/carta.png`;
            img.alt = `${card.value} de ${card.suit}`;

            cardElem.appendChild(img);

            cardElem.onclick = () => {
                selectCard(cardElem);
                selectedCardIndex = index;
                confirmBtn.disabled = false;
            };

            cardsContainer.appendChild(cardElem);
        });

        gameArea.appendChild(cardsContainer);
        gameArea.appendChild(confirmBtn);
    }

});

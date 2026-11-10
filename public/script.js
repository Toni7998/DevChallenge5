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

    function createHeader() {
        const header = document.createElement('div');
        header.classList.add('waiting-header');

        const player = document.createElement('span');
        player.classList.add('player-name');
        player.textContent = `Jugador: ${playerName}`;

        const room = document.createElement('span');
        room.classList.add('room-name');
        room.textContent = `Sala: ${gameId}`;

        header.append(player, room);
        return header;
    }


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
        const waitingMessage = document.getElementById('waitingMessage');
        waitingMessage.textContent = message;
        waitingMessage.style.display = 'block';

        gameArea.replaceChildren(createHeader(), waitingMessage);

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

        gameArea.appendChild(createHeader());
        renderCards(playerCards);
    });

    socket.on('gameResult', (result) => {
        gameArea.innerHTML = '';

        const messages = {
            win: { title: 'Has guanyat! 🎉', text: 'Enhorabona, la teva carta era la més alta.' },
            lose: { title: 'Has perdut 😞', text: `${result.opponentName || "L'altre jugador"} ha guanyat aquesta ronda.` },
            draw: { title: '🤝 Empat!', text: 'Les dues cartes tenen el mateix valor.' }
        };

        const resultBox = document.createElement('div');
        resultBox.classList.add('result-box', result.outcome);

        const title = document.createElement('h2');
        title.textContent = messages[result.outcome].title;

        const winnerText = document.createElement('p');
        winnerText.textContent = messages[result.outcome].text;

        const playerCardText = document.createElement('p');
        playerCardText.textContent = `La teva carta: ${result.myCard.value} de ${result.myCard.suit}`;

        const opponentCardText = document.createElement('p');
        opponentCardText.textContent = `La carta de ${result.opponentName || "l'altre jugador"}: ${result.opponentCard.value} de ${result.opponentCard.suit}`;

        const restartButton = document.createElement('button');
        restartButton.textContent = 'Tornar a jugar';
        restartButton.onclick = () => {
            socket.emit('restartRound', { gameId });
            gameArea.innerHTML = '<p>Esperant a la nova ronda...</p>';
        };

        resultBox.appendChild(title);
        resultBox.appendChild(winnerText);
        resultBox.appendChild(playerCardText);
        resultBox.appendChild(opponentCardText);
        resultBox.appendChild(restartButton);

        const confirmBtn = document.getElementById('confirm-card');
        const cardsContainer = document.querySelector('.cards-container');
        if (confirmBtn) confirmBtn.style.display = 'none';
        if (cardsContainer) cardsContainer.style.display = 'none';

        gameArea.appendChild(resultBox);
    });

    socket.on('playerDisconnected', (data) => {
        gameArea.innerHTML = `
            <p>El jugador ${data.playerName} s'ha desconnectat. Pots esperar un altre jugador o buscar/crear una nova partida.</p>
            <button id="findNewGameButton">Buscar una altra partida</button>
        `;
        document.body.classList.add('not-in-game');

        const confirmBtn = document.getElementById('confirm-card');
        if (confirmBtn) confirmBtn.style.display = 'none';

        const findNewGameButton = document.getElementById('findNewGameButton');
        findNewGameButton.addEventListener('click', () => {
            // Lógica para buscar una nueva partida o esperar
            window.location.reload(); // Reinicia la pestaña completamente
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

    socket.on('showRetryButton', () => {
        const retryBtn = document.createElement('button');
        retryBtn.textContent = 'Buscar una altra partida';
        retryBtn.classList.add('retry-button'); // opcional para estilos

        retryBtn.addEventListener('click', () => {
            window.location.reload(); // Reinicia la página para volver al modal inicial
        });

        // Muestra el botón en el gameArea
        gameArea.appendChild(retryBtn);
    });

});

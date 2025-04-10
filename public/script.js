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
        const confirmBtn = document.getElementById('confirmBtn');
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

        selectedCardIndex = null;
        confirmBtn.disabled = true;  // Inicialmente deshabilitado
        confirmBtn.classList.remove('active');  // Elimina la clase 'active' al inicio

        cards.forEach((card, index) => {
            const cardElem = document.createElement('div');
            cardElem.classList.add('card');

            const img = document.createElement('img');
            img.src = `images/carta.png`;  // Cambia esta URL si no es correcta
            img.alt = `${card.value} de ${card.suit}`;

            cardElem.appendChild(img);

            cardElem.onclick = () => {
                selectCard(cardElem);  // Llama a la función para marcar la carta
                selectedCardIndex = index;  // Guarda el índice de la carta seleccionada
                confirmBtn.disabled = false;  // Habilita el botón de confirmación
            };

            cardsContainer.appendChild(cardElem);
        });

        gameArea.appendChild(cardsContainer);
    }

    // El evento del botón de confirmar
    confirmBtn.onclick = () => {
        if (selectedCardIndex !== null && !confirmBtn.disabled) {
            socket.emit('pickCard', { gameId, cardIndex: selectedCardIndex });

            // Deshabilitar el botón después de hacer la selección
            confirmBtn.disabled = true;
            confirmBtn.classList.add('active');  // Mantener el color cambiado

            // El botón no se puede hacer clic nuevamente hasta que el servidor lo permita
        }
    };

});

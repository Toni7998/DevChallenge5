const socket = io();
const gameId = prompt("Introdueix el nom del joc (o crea'n un nou):");
const playerName = prompt("Introdueix el teu nom:"); // Pedir nombre al jugador

socket.emit('joinGame', { gameId, playerName });

socket.on('waitingForPlayers', (message) => {
    const gameArea = document.getElementById('gameArea');
    gameArea.innerHTML = `<p>${message}</p>`;
});

socket.on('gameStart', (data) => {
    const { cards, names } = data;
    const gameArea = document.getElementById('gameArea');
    gameArea.innerHTML = ''; // Limpiar área de juego

    const playerCards = cards[socket.id];

    if (!playerCards) {
        gameArea.innerHTML = "<p>Error: No s'han trobat cartes per a aquest jugador.</p>";
        return;
    }

    playerCards.forEach((card, index) => {
        const cardElem = document.createElement('div');
        cardElem.classList.add('card');

        const img = document.createElement('img');
        img.src = `images/carta.png`; // Asegurar que las imágenes sean correctas
        img.alt = 'Carta';

        cardElem.appendChild(img);

        cardElem.onclick = () => {
            socket.emit('pickCard', { gameId, cardIndex: index });
            selectCard(cardElem); // Marcar la carta como seleccionada
        };
        gameArea.appendChild(cardElem);
    });
});

socket.on('gameResult', (result) => {
    const gameArea = document.getElementById('gameArea');
    gameArea.innerHTML = `<h2>Resultat</h2>
                          <p>${result.winner ? `${result.winner} ha guanyat!` : "Empat!"}</p>
                          <p>La teva carta: ${result.card1.value} de ${result.card1.suit}</p>
                          <p>La carta de l'altre jugador: ${result.card2.value} de ${result.card2.suit}</p>`;

    // Afegir botó per reiniciar la partida
    const restartButton = document.createElement('button');
    restartButton.textContent = 'Tornar a jugar';
    restartButton.onclick = () => {
        socket.emit('restartRound', { gameId });
        gameArea.innerHTML = '<p>Esperant a la nova ronda...</p>'; // Missatge d'espera
    };
    gameArea.appendChild(restartButton);
});

// Quan un jugador es desconnecta
socket.on('playerDisconnected', (data) => {
    const gameArea = document.getElementById('gameArea');
    gameArea.innerHTML = `<p>El jugador ${data.playerId} s'ha desconnectat. El joc ha acabat prematurament.</p>`;
});

// Funció per marcar una carta com seleccionada
function selectCard(cardElem) {
    const selectedCards = document.querySelectorAll('.card.selected');
    selectedCards.forEach(card => card.classList.remove('selected'));
    cardElem.classList.add('selected');
}

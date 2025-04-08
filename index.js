const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

let games = {}; // Almacena las partidas en curso

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('Un jugador se ha conectado:', socket.id);

    socket.on('joinGame', ({ gameId, playerName }) => {
        if (!games[gameId]) {
            games[gameId] = { players: [], names: {}, waitingQueue: [], cards: {} };
        }

        if (games[gameId].players.length < 2) {
            games[gameId].players.push(socket.id);
            games[gameId].names[socket.id] = playerName;
            socket.join(gameId);

            if (games[gameId].players.length === 2) {
                let cards = generateDeck();
                games[gameId].cards = {
                    [games[gameId].players[0]]: cards.splice(0, 5),
                    [games[gameId].players[1]]: cards.splice(0, 5),
                };

                io.to(gameId).emit('gameStart', {
                    cards: games[gameId].cards,
                    names: games[gameId].names
                });
            } else {
                socket.emit('waitingForPlayers', 'Esperant a un altre jugador per començar la partida...');
            }
        } else {
            games[gameId].waitingQueue.push(socket.id);
            socket.emit('waitingForPlayers', 'Estás en espera de otro jugador para comenzar la partida.');
        }
    });

    socket.on('pickCard', (data) => {
        const { gameId, cardIndex } = data;
        const game = games[gameId];

        // Comprobamos si el jugador está en el juego antes de intentar acceder a las cartas
        if (game && game.players.includes(socket.id)) {
            if (game.cards && game.cards[socket.id] && Array.isArray(game.cards[socket.id]) && game.cards[socket.id][cardIndex]) {
                game.cards[socket.id].chosenCard = game.cards[socket.id][cardIndex];

                if (Object.values(game.cards).every(cards => cards.chosenCard !== undefined)) {
                    const winner = determineWinner(game.cards, game.names);
                    io.to(gameId).emit('gameResult', winner);
                }
            } else {
                console.log(`Jugador ${socket.id} ha intentado triar una carta però la carta no és vàlida o no existeix.`);
                socket.emit('errorMessage', 'La carta no és vàlida.');
            }
        } else {
            console.log(`Jugador ${socket.id} ha intentado interactuar pero no está en el juego.`);
            socket.emit('errorMessage', 'No estàs dins la partida activa.');
        }
    });

    socket.on('restartRound', (data) => {
        const { gameId } = data;
        const game = games[gameId];

        if (game) {
            let cards = generateDeck();
            game.cards = {
                [game.players[0]]: cards.splice(0, 5),
                [game.players[1]]: cards.splice(0, 5),
            };
            io.to(gameId).emit('gameStart', {
                cards: game.cards,
                names: game.names
            });
        }
    });

    socket.on('waitingForPlayers', (msg) => {
        gameArea.innerHTML = `<p>${msg}</p>`;
    });

    socket.on('disconnect', () => {
        console.log('Un jugador se ha desconectado:', socket.id);

        let wasInGame = false;

        for (const gameId in games) {
            const game = games[gameId];

            const playerIndex = game.players.indexOf(socket.id);
            if (playerIndex !== -1) {
                // Solo si estaba en la partida lo eliminamos
                game.players.splice(playerIndex, 1);
                delete game.names[socket.id];
                delete game.cards[socket.id];
                wasInGame = true;

                // Notificar a los demás jugadores de la desconexión
                io.to(gameId).emit('playerDisconnected', { playerId: socket.id });

                // Opcional: eliminar la partida si ya no queda nadie
                if (game.players.length === 0 && game.waitingQueue.length === 0) {
                    delete games[gameId];
                    console.log(`Partida ${gameId} eliminada per quedar buida.`);
                }
            }

            // También lo eliminamos de la cola de espera si estuviera ahí
            const waitingIndex = game.waitingQueue.indexOf(socket.id);
            if (waitingIndex !== -1) {
                game.waitingQueue.splice(waitingIndex, 1);
            }
        }

        if (!wasInGame) {
            console.log(`Socket ${socket.id} s'ha desconectat però no estava en cap partida activa.`);
        }
    });
});

function generateDeck() {
    const suits = ['Corazones', 'Diamantes', 'Tréboles', 'Picas'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    let deck = [];
    suits.forEach(suit => {
        values.forEach(value => {
            deck.push({ suit, value });
        });
    });
    return shuffle(deck);
}

function shuffle(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

function determineWinner(cards, names) {
    const valuesOrder = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const [player1, player2] = Object.keys(cards);
    const [card1, card2] = [cards[player1].chosenCard, cards[player2].chosenCard];

    const index1 = valuesOrder.indexOf(card1.value);
    const index2 = valuesOrder.indexOf(card2.value);

    if (index1 > index2) return { winner: names[player1], card1, card2 };
    if (index2 > index1) return { winner: names[player2], card1, card2 };
    return { winner: null, card1, card2 };
}

server.listen(3000, () => {
    console.log('Servidor escuchando en el puerto 3000');
});

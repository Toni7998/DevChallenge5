# 🃏 Joc de cartes en línia per a 2 jugadors

Un joc de cartes multijugador en temps real fet amb **Node.js**, **Express** i **Socket.IO**. Dos jugadors entren a la mateixa sala, cadascun tria una carta a cegues i guanya qui tingui la carta més alta.

## 📋 Requisits

- [Node.js](https://nodejs.org/) (versió 16 o superior)
- Un navegador web modern

## 🚀 Instal·lació i posada en marxa

1. Descarrega o clona el projecte i entra a la carpeta:

   ```bash
   cd nom-del-projecte
   ```

2. Instal·la les dependències:

   ```bash
   npm install express socket.io
   ```

3. Arrenca el servidor:

   ```bash
   node index.js
   ```

4. Veuràs aquest missatge al terminal:

   ```
   Servidor escoltant en el port 3000
   ```

5. Obre el joc al navegador: **http://localhost:3000**

> 💡 Si canvies el codi del servidor (`index.js`), atura i torna a arrencar `node index.js`. Si només canvies `script.js` o el CSS, n'hi ha prou amb recarregar la pàgina amb **Ctrl+F5**.

## 🎮 Com jugar

### 1. Entrar a una sala

1. Escriu el teu **nom de jugador**.
2. Escriu el **Game ID** (el nom de la sala). Pot ser qualsevol text, per exemple `sala1`.
3. Prem el botó per unir-te.

El primer jugador veurà el missatge *"Esperant a un altre jugador..."*. El segon jugador ha d'escriure **exactament el mateix Game ID** per entrar a la mateixa sala.

> Durant l'espera i durant la partida veuràs el teu nom i el nom de la sala a la part superior.

### 2. Triar una carta

Quan entra el segon jugador, la partida comença automàticament i cadascú rep **5 cartes**.

- Les cartes es mostren **de cara avall**, així que tries a cegues.
- Fes clic a la carta que vulguis: es ressaltarà amb una vora groga.
- Pots canviar d'opinió i fer clic en una altra abans de confirmar.
- Prem **"Confirmar carta"** per fixar la teva elecció.

Un cop confirmada no es pot canviar, i la resta de cartes es bloquegen.

### 3. Veure el resultat

Quan **els dos jugadors** han confirmat la seva carta, es revela el resultat. Cada jugador veu la seva pròpia pantalla:

| Resultat | Què veus |
|----------|----------|
| 🎉 **Has guanyat!** | La teva carta és més alta que la del rival |
| 😞 **Has perdut** | La carta del rival és més alta que la teva |
| 🤝 **Empat!** | Les dues cartes tenen el mateix valor |

També es mostra la teva carta i la del teu rival.

### 4. Jugar una altra ronda

Prem **"Tornar a jugar"** per repartir cartes noves i començar una altra ronda a la mateixa sala.

## 🏆 Regles

- Guanya la carta amb **més valor**.
- L'ordre de menor a major és:

  ```
  2 < 3 < 4 < 5 < 6 < 7 < 8 < 9 < 10 < J < Q < K < A
  ```

- **El coll no compta** (Cors, Diamants, Trèvols i Piques valen el mateix). Si les dues cartes tenen el mateix valor, és empat.
- Les sales admeten **un màxim de 2 jugadors**.

## ⚠️ Situacions especials

- **Sala plena:** si intentes entrar a una sala que ja té 2 jugadors, veuràs un avís i un botó per **buscar una altra partida** amb un altre Game ID.
- **Desconnexió del rival:** si l'altre jugador marxa, veuràs un missatge amb el seu nom i un botó per **buscar una altra partida**.

## 🌐 Jugar amb una altra persona

- **A el mateix ordinador:** obre dues pestanyes a `http://localhost:3000`.
- **A la mateixa xarxa (wifi/LAN):** l'altre jugador obre `http://IP-DEL-TEU-ORDINADOR:3000`. Pots veure la teva IP amb `ipconfig` (Windows) o `ifconfig` / `ip a` (Mac/Linux). Si no connecta, comprova que el tallafoc permeti el port 3000.
- **Per internet:** necessites desplegar el servidor en un allotjament amb Node.js, o fer servir un túnel com [ngrok](https://ngrok.com/).

## 📁 Estructura del projecte

```
├── index.js          # Servidor (Express + Socket.IO) i lògica del joc
└── public/           # Fitxers que serveix el servidor
    ├── index.html
    ├── script.js     # Lògica del client
    ├── (estils CSS)
    └── images/
        ├── carta.png # Revers de les cartes
        └── fons.jpg  # Fons
```

## 🛠️ Com funciona per dins

1. Els jugadors s'uneixen amb l'esdeveniment `joinGame`. El servidor crea la partida o afegeix el jugador a la sala existent.
2. Amb 2 jugadors, el servidor barreja una baralla de 52 cartes, reparteix 5 a cadascun i emet `gameStart`.
3. Cada jugador envia la seva elecció amb `pickCard`.
4. Quan tots dos han triat, el servidor calcula el guanyador i envia a **cada jugador el seu propi resultat** amb `gameResult` (`win`, `lose` o `draw`, més la seva carta i la del rival).
5. `restartRound` reparteix cartes noves per a una altra ronda.
6. Si algú es desconnecta, el servidor avisa l'altre jugador amb `playerDisconnected`.

## 📜 Llicència

Projecte personal amb finalitats educatives. Fes-lo servir i modifica'l com vulguis.

const Player = ['x', 'o'];
const AIPlayer = 1;
const MinmaxDepth = 3;
let alertLock;

const minmax = (table, turn, depth) => {
    const functionName = (turn === AIPlayer) ? "max" : "min";

    const winner = getWinner(table);
    if(winner !== -1) {
        const score = (winner === AIPlayer) ? 1 : -1;
        return {
            position: undefined,
            score: score
        };
    }
    if(isFilled(table)) {
        const score = 0;
        return {
            position: undefined,
            score: score
        };
    }
    if(depth === 0) {
        const score = 0;
        return {
            position: undefined,
            score: score
        };
    }

    const successors = [];
    for(let i = 0; i < 3; i++) {
        for(let j = 0; j < 3; j++) {
            if(table[i][j] === null) {
                const newTable = JSON.parse(JSON.stringify(table));
                newTable[i][j] = turn;
                successors.push({
                    position: {
                        x: i,
                        y: j
                    },
                    score: minmax(newTable, 1 - turn, depth - 1).score
                });
            }
        }
    }

    let bestSuccessors = [];
    let bestScore = (turn === AIPlayer) ? -2 : 2;
    successors.forEach(successor => {
        const newBestScore = Math[functionName](bestScore, successor.score);
        if(newBestScore !== bestScore) {
            bestSuccessors = [];
            bestScore = newBestScore;
        }
        if(newBestScore === successor.score) {
            bestSuccessors.push(successor);
        }
    });

    const randomIndex = Math.floor(Math.random() * bestSuccessors.length);
    return bestSuccessors[randomIndex];
};

const closePopup = () => { $('#popup').css('display', 'none'); alertLock = false; }
const openPopup = () => { $('#popup').css('display', 'block'); alertLock = true; }

const checkHorizontally = (table, turn, x, y) => {
    for(let j = 0; j < 3; j++)
        if(table[x][j] !== turn)
            return false;
    return true;
}
const checkVertically = (table, turn, x, y) => {
    for(let i = 0; i < 3; i++)
        if(table[i][y] !== turn)
            return false;
    return true;
}
const checkDiagonally = (table, turn, x, y) => {
    if(x === y) {
        for(let i = 0; i < 3; i++)
            if(table[i][i] !== turn)
                return false;
        return true;
    }
    else return false
}
const checkReverseDiagonally = (table, turn, x, y) => {
    if(x + y === 2) {
        for(let i = 0; i < 3; i++)
            if(table[i][2 - i] !== turn)
                return false;
        return true;
    }
    else return false;
}

const hasWon = (table, turn, x, y) => checkHorizontally(table , turn, x, y)
        || checkVertically(table , turn, x, y)
        || checkDiagonally(table , turn, x, y)
        || checkReverseDiagonally(table , turn, x, y);

// returns -1 if the game does not have a winner
const getWinner = (table) => {
    for(let i = 0; i < 3; i++) {
        // check all columns
        if(table[i][0] !== null && table[i][0] === table[i][1] && table[i][1] === table[i][2]) {
            return table[i][0];
        }
        // check all rows
        if(table[0][i] !== null && table[0][i] === table[1][i] && table[1][i] === table[2][i]) {
            return table[0][i];
        }
    }
    if(table[0][0] !== null && table[0][0] === table[1][1] && table[1][1] === table[2][2]) {
        return table[0][0];
    }
    if(table[0][2] !== null && table[0][2] === table[1][1] && table[1][1] === table[2][0]) {
        return table[0][2];
    }
    return -1;
};
const isFilled = (table) => {
    for(let i = 0; i < 3; i++)
        for(let j = 0; j < 3; j++)
            if(table[i][j] === null)
                return false;
    return true;
}

const logWinner = (winnerId = -1) => {
    const message = (winnerId < 0) ?
        'Draw!' :
        `Player <span class="winner">'${Player[winnerId].toUpperCase()}'</span> has won the game!`;
    $('#log').prepend(`
        <li class="log-item">
            <p>${message}</p>
        </li>
    `);
}
const updatePopup = (winnerId = -1) => {
    const message = (winnerId < 0) ?
        'Draw!' :
        `Player <span class="winner">'${Player[winnerId].toUpperCase()}'</span>`;
    $('#popup-message').html(`<p>${message}</p>`)
};
const announceWinner = (winnerId = -1) => {
    updatePopup(winnerId);
    openPopup();
    logWinner(winnerId);
}

const updateTurn = (turn) => {
    $('#turn').html(`<p>Turn: Player '${Player[turn].toUpperCase()}'</p>`);
};

const playAI = (table) => {
    const result = minmax(table, AIPlayer, MinmaxDepth);
    const chosenPosition = result.position;
    const x = chosenPosition.x;
    const y = chosenPosition.y;

    table[x][y] = AIPlayer;

    // show the choice
    const cell = $(`.cell[data-x="${x}"][data-y="${y}"]`);

    $(cell).removeClass('empty');
    $(cell).addClass('filled');
    $(cell).addClass(Player[AIPlayer]);

    if(hasWon(table, AIPlayer, x, y)) {
        announceWinner(AIPlayer);
        createGame();
        throw {
            message: 'AI has won the game!'
        };
    }
    if($('.filled').length === 9) {
        announceWinner();
        createGame();
        throw {
            message: 'Draw!'
        };
    }
};

const createGame = () => {
    if(alertLock) {
        setTimeout(createGame, 100);
        return;
    }

    deleteGame();

    let turn = (Math.random() < 0.5) ? 0 : 1;
    const table = [];

    updateTurn(turn);

    $('#app').append(`<div class="board" id="board"></div>`);

    const board = $('#board');

    // creating table
    for(let i = 0; i < 3; i++) {
        table.push([]);
        for(let j = 0; j < 3; j++) {
            board.append(`<div class="cell empty" data-x="${i}" data-y="${j}"></div>`);
            table[i].push(null);
        }
    }

    if(turn === AIPlayer) {
        playAI(table);

        turn = 1 - turn;
        updateTurn(turn);
    }

    board.on('click', '.cell.empty', e => {
        const cell = $(e.target);
        const x = Number(cell.attr('data-x'));
        const y = Number(cell.attr('data-y'));

        table[x][y] = turn;

        $(cell).removeClass('empty');
        $(cell).addClass('filled');
        $(cell).addClass(Player[turn]);

        if(hasWon(table, turn, x, y)) {
            announceWinner(turn);
            createGame();
            return;
        }

        if($('.filled').length === 9) {
            announceWinner();
            createGame();
            return;
        }

        turn = 1 - turn;
        updateTurn(turn);

        try { playAI(table); }
        catch(e) { return; }

        turn = 1 - turn;
        updateTurn(turn);
    });
};
const deleteGame = () => {
    $('#app').html('');
}

$(() => {
    $('#popup').on('click', event => {
        if($(event.target)[0] === $('#popup')[0])
            closePopup();
    });

    $('#popup-close').on('click', closePopup);

    alertLock = false;

    createGame();
});
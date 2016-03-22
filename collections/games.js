var games = new Meteor.Collection('games');

var updateStatistics = function(losingPlayerId, winningPlayerId) {
	'use strict';

	Meteor.users.update({_id: losingPlayerId, 'friends._id': winningPlayerId}, {$inc: {'friends.$.statistics.losses': 1}});
	Meteor.users.update({_id: winningPlayerId, 'friends._id': losingPlayerId}, {$inc: {'friends.$.statistics.wins': 1}});
	return true;
};

Meteor.methods({

	// ----- Game Setup -----

	/*
	A game looks like this:
	{
		_id: 'JSDFK8X38057',
		players: [playerId, friendId],
		playerData: {
			playerId: {
				limbo: ['h', 'h'],
				removed: []
			},
			friendId: {
				limbo: [l'],
				removed: []
			}
		},
		board: [
			...
			{
				place: 1,
				pieces: []
			},
			{
				place: 2,
				pieces: ['h', 'h']
			},
			...
		],
		colours: {
			playerId: 'wet-ashphalt',
			friendId: 'carrot'
		},
		bases: {
			playerId: 'h',
			friendId: 'l'
		},
		startingRolls: {
			playerId: '4',
			friendId: '5'
		},
		turn: friendId,
		status: 'inProgress'
	}
	*/

	// Status Changes

	// createGame		-> 	notStarted
	// setupNewGame 	-> 	setupColour
	// setColour 		->	setupBase
	// setBase  		->	setupRoll
	// rollToStart		-> 	inProgress
	// removePiece		->	finished
	// forfeit 			-> 	forfeited

	createGame: function(playerId, friendId) {
		'use strict';

		var newGame = {
			players: [playerId, friendId],
			playerData: {},
			board: [],
			colours: {},
			bases: {},
			startingRolls: {},
			status: 'notStarted'
		};

		newGame.playerData[playerId] = {
			limbo: [],
			removed: []
		};
		newGame.playerData[friendId] = {
			limbo: [],
			removed: []
		};

		return games.insert(newGame);
	},

	setupNewGame: function(gameId, playerId, friendId) {
		'use strict';

		var generateRoll = function() {
				return Math.floor(Math.random() * 6) + 1;
			},

			clearBoard = {
				board: [
					{
						place: 0,
						pieces: []
					},
					{
						place: 1,
						pieces: ['h', 'h']
					},
					{
						place: 2,
						pieces: []
					},
					{
						place: 3,
						pieces: []
					},
					{
						place: 4,
						pieces: []
					},
					{
						place: 5,
						pieces: ['l', 'l', 'l', 'l', 'l']
					},
					{
						place: 6,
						pieces: []
					},
					{
						place: 7,
						pieces: ['l', 'l', 'l']
					},
					{
						place: 8,
						pieces: []
					},
					{
						place: 9,
						pieces: []
					},
					{
						place: 10,
						pieces: []
					},
					{
						place: 11,
						pieces: ['h', 'h', 'h', 'h', 'h']
					},
					{
						place: 12,
						pieces: ['l', 'l', 'l', 'l', 'l']
					},
					{
						place: 13,
						pieces: []
					},
					{
						place: 14,
						pieces: []
					},
					{
						place: 15,
						pieces: []
					},
					{
						place: 16,
						pieces: ['h', 'h', 'h']
					},
					{
						place: 17,
						pieces: []
					},
					{
						place: 18,
						pieces: ['h', 'h', 'h', 'h', 'h']
					},
					{
						place: 19,
						pieces: []
					},
					{
						place: 20,
						pieces: []
					},
					{
						place: 21,
						pieces: []
					},
					{
						place: 22,
						pieces: ['l', 'l']
					},
					{
						place: 23,
						pieces: []
					}
				],
				playerData: {},
				colours: {},
				bases: {},
				startingRolls: {},
				rolls: [generateRoll(), generateRoll()],
				status: 'setupColour',
				winner: null
			};

		clearBoard.playerData[playerId] = {
			limbo: [],
			removed: []
		};
		clearBoard.playerData[friendId] = {
			limbo: [],
			removed: []
		};

		games.update({_id: gameId}, {$set: clearBoard});
	},

	setColour: function(gameId, playerId, friendId, colourId) {
		'use strict';

		var game = games.findOne({_id: gameId}),
			colours = game.colours,
			updates;

		if (colours[friendId] === colourId) {
			return false;
		}

		colours[playerId] = colourId;
		updates = {colours: colours};

		if (Object.keys(colours).length === 2) {
			updates.status = 'setupBase';
		}

		games.update({_id: gameId}, {$set: updates});

		return true;
	},

	setBase: function(gameId, playerId, friendId, base) {
		'use strict';

		var game = games.findOne({_id: gameId}),
			bases = game.bases,
			updates;

		// Can't set if..
		// - already defined
		// - if base is not one of 'h' or 'l'
		// - if friend has already chosen this base
		if (bases[playerId] || ['h', 'l'].indexOf(base) === -1 || bases[friendId] === base) {
			return false;
		}

		bases[playerId] = base;
		updates = {bases: bases};

		if (Object.keys(bases).length === 2) {
			updates.status = 'setupRoll';
		}

		games.update({_id: gameId}, {$set: updates});

		return true;
	},

	rollToStart: function(gameId, playerId, friendId) {
		'use strict';

		var game = games.findOne({_id: gameId}),
			startingRolls = game.startingRolls,
			friendRoll,
			playerRoll,
			firstTurn;

		if (startingRolls[playerId] && startingRolls[playerId] !== 'draw') {
			// They've already rolled, ignore this.
			return false;
		}

		startingRolls[playerId] = Math.floor(Math.random() * 6) + 1;

		playerRoll = startingRolls[playerId];

		// Still waiting for someone to roll
		if (Object.keys(startingRolls).length !== 2) {
			games.update({_id: gameId}, {$set: {startingRolls: startingRolls}});
			return true;
		}

		friendRoll = startingRolls[friendId];

		// Both have rolled but they are the same.
		if (playerRoll === friendRoll) {
			startingRolls[playerId] = 'draw';
			startingRolls[friendId] = 'draw';
			games.update({_id: gameId}, {$set: {startingRolls: startingRolls}});
			return true;
		}

		firstTurn = playerRoll > friendRoll ? playerId : friendId;

		// All good!
		games.update({_id: gameId}, {$set: {
			startingRolls: startingRolls,
			turn: firstTurn
		}});

		return firstTurn;
	},

	startGame: function(gameId) {
		'use strict';

		games.update({_id: gameId}, {$set: {
			status: 'inProgress'
		}});
	},

	forfeitGame: function(gameId, playerId, friendId) {
		'use strict';

		updateStatistics(playerId, friendId);

		games.update({_id: gameId}, {$set: {
			status: 'forfeited',
			winner: friendId
		}});
		return true;
	},

	// ----- Gameplay -----

	changeTurn: function(gameId, playerId, friendId) {
		'use strict';

		var game = games.findOne({_id: gameId}),
			generateRoll = function() {
				return Math.floor(Math.random() * 6) + 1;
			};

		// You can only change turn if it's your turn to begin with
		if (playerId !== game.turn) {
			return false;
		}

		games.update({_id: gameId}, {$set: {
			turn: friendId,
			rolls: [generateRoll(), generateRoll()]
		}});
	},

	// pieceToMove is an object in the form {base: '', place: ''}
	removePiece: function(gameId, playerId, pieceToMove) {
		'use strict';

		var game = games.findOne({_id: gameId}),
			board = game.board,
			playerData = game.playerData,
			playerBase = game.bases[playerId],
			i,
			movedPiece,
			updates;

		// Basic validation: ensure user is moving their piece and that they don't have any pieces in limbo
		if (playerBase !== pieceToMove.base || playerData[playerId].limbo.length > 0) {
			return false;
		}

		// Validation: To remove a piece from the board, all pieces must be in the user's base

		// Player is playing high, so must have no pieces in places 0 - 17
		if (playerBase === 'h') {

			for (i = 0; i <= 17; i++) {
				if (_.contains(board[i].pieces, 'h')) {
					return false;
				}
			}

		// Player is playing low, so must have no pieces in places 6 - 23
		} else {
			for (i = 6; i <= 23; i++) {
				if (_.contains(board[i].pieces, 'l')) {
					return false;
				}
			}
		}

		// Remove piece
		movedPiece = board[pieceToMove.place].pieces.pop();
		playerData[playerId].removed.push(movedPiece);

		updates = {
			board: board,
			playerData: playerData
		};

		if (playerData[playerId].removed.length === 15) {
			updates.status = 'finished';
			updates.winner = playerId;
		}

		games.update({_id: gameId}, {$set: updates});

		return true;

	},

	// pieceToMove is an object in the form {base: '', place: ''}
	movePiece: function(gameId, playerId, friendId, pieceToMove, place) {
		'use strict';

		var game = games.findOne({_id: gameId}),
			board = game.board,
			playerData = game.playerData,
			playerBase = game.bases[playerId],
			destinationPieces = board[place].pieces,
			numberOfDestPieces = destinationPieces.length,
			move,
			topDestinationPiece,
			movedPiece;

		// Basic validation: ensure user is moving their piece
		if (playerBase !== pieceToMove.base) {
			return false;
		}

		// Basic validation: if user has pieces in limbo, they can only move those pieces. Also, if they are in limbo,
		// they can only move their piece to the enemy's base.
		if (playerData[playerId].limbo.length > 0) {

			if (pieceToMove.place !== 'limbo') {
				return false;
			}

			// If the player is playing high, if they're in limbo they must move their pieces to the low base
			if (playerBase === 'h' && !_.contains([0, 1, 2, 3, 4, 5], place)) {
				return false;
			}

			// If the player is playing high, if they're in limbo they must move their pieces to the low base
			if (playerBase === 'l' && !_.contains([23, 22, 21, 20, 19, 18], place)) {
				return false;
			}

		// Basic validation: if user is not in limbo, ensure they're moving in the right direction
		} else {
			// This should never happen but check anyway
			if (pieceToMove.place === 'limbo') {
				return false;
			}

			// The 'h' player moves low to high, the 'l' player moves high to low
			// Subtracting the starting position from the destination should result in a positive result
			// for the 'h' player and a negative result for the 'l' player
			move = place - pieceToMove.place;
			if (playerBase === 'h' && move < 1 || playerBase === 'l' && move > -1) {
				return false;
			}
		}

		// Check the space is available to be moved to
		if (numberOfDestPieces > 0) {
			topDestinationPiece = destinationPieces[numberOfDestPieces - 1];

			// Trying to place on an enemy piece
			if (pieceToMove.base !== topDestinationPiece) {

				// There is only one piece on the stack - success! Move to limbo.
				if (numberOfDestPieces === 1) {
					playerData[friendId].limbo.push(destinationPieces.pop());
				} else {
					// The enemy is guarded, no such luck
					return false;
				}
			}
		}

		// Move piece
		if (pieceToMove.place === 'limbo') {
			movedPiece = playerData[playerId].limbo.pop();
		} else {
			movedPiece = board[pieceToMove.place].pieces.pop();
		}

		destinationPieces.push(movedPiece);
		board[place].pieces = destinationPieces;

		games.update({_id: gameId}, {$set: {
			board: board,
			playerData: playerData
		}});

		return true;
	}
});

// Export to global space
Games = games;

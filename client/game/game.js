/* global $, UI, Router */
'use strict';

var getFriend = function() {
		return Router.current().data().friend;
	},

	getGame = function() {
		return Router.current().data().game;
	},

	inLimbo = function(element) {
		return element.parents('.limbo').length === 1;
	},

	// Keep track of what's selected
	currentlySelectedPiece,

	deselectCurrentPiece = function() {
		currentlySelectedPiece = null;
		$('.place .piece-active').removeClass('piece-active');
	},

	movePiece = function(pieceToMove, place) {
		Meteor.call('movePiece', getGame()._id, Meteor.userId(), getFriend()._id, pieceToMove, place, function(error, result) {
			// If the piece was successfully moved, set the currently selected piece to null
			if (result) {
				deselectCurrentPiece();
			}
		});
	};

UI.registerHelper('firstFive', function(arr) {
	return arr.slice(0, 5);
});

UI.registerHelper('remaining', function(arr) {
	return arr && arr.length > 5 ? arr.slice(5) : [];
});

Template.game.helpers({
	colours: function(id) {
		return this.game.colours[id] || '';
	},

	gameStatus: function(status) {
		return this.game.status === status;
	},

	inSetup: function() {
		return !_.contains(['finished', 'forfeited', 'inProgress'], this.game.status);
	},

	winner: function() {
		return this.game.winner === Meteor.userId() ? Meteor.user() : this.friend;
	},

	gameSetupTemplate: function() {
		return Template[this.game.status];
	},

	currentPlayerUsername: function() {
		var user = Meteor.user();
		return this.game.turn === user._id ? 'Your' : this.friend.username + '\'s';
	},

	rolledUsername: function() {
		var user = Meteor.user();
		return this.game.turn === user._id ? 'You' : this.friend.username;
	},

	base: function() {
		return this.game.bases[Meteor.userId()];
	},

	currentUsersTurn: function() {
		return this.game.turn === Meteor.userId();
	},

	highPlaces: function() {
		return this.game.board.slice(12, 24);
	},

	lowPlaces: function() {
		return this.game.board.slice(0, 12);
	},

	roll: function(roll) {
		return this.game.rolls[roll];
	}
});

// ------ Off Board Pieces -----
Template.offBoardPieces.helpers({
	piecesInLimbo: function(id) {
		return this.game.playerData[id].limbo;
	},

	piecesRemoved: function(id) {
		return this.game.playerData[id].removed;
	}
});

// ------ Piece ------

Template.piece.helpers({
	pieceColour: function(pieceValue) {

		var game = getGame(),
			colours = game.colours,
			userBase = game.bases[Meteor.userId()];

		return pieceValue === userBase ? colours[Meteor.userId()] : colours[getFriend()._id];
	}
});

// ------ Stacked Piece ------

Template.stackedPiece.helpers({
	stackedPieceColour: Template.piece.pieceColour,
	getCount: function(pieces) {
		if (pieces.length === 1) {
			return '';
		}
		return pieces.length.toString();
	}
});

// ----- Place -----

Template.place.helpers({
	base: function() {
		var game = getGame(),
			userId = Meteor.userId(),
			userColour = game.colours[userId],
			userBase = game.bases[userId],
			homeBase = userBase === 'h' ? [18, 19, 20, 21, 22, 23] : [0, 1, 2, 3, 4, 5];

		return _.contains(homeBase, this.place) ? userColour + ' base' : '';
	}
});

Template.game.events({

	'click .js-done': function(e) {
		e.preventDefault();
		Meteor.call('changeTurn', this.game._id, Meteor.userId(), this.friend._id);
	},

	'click .place .piece': function(e) {
		e.stopPropagation();

		var pieceElement = $(e.currentTarget),
			game = getGame(),
			userId = Meteor.userId(),
			userBase = game.bases[userId],
			baseOfSelectedPiece = $.isArray(this) ? this[0] : this,
			pieceInLimbo,
			placeElement,
			place,
			elementToSelect;

		// If it's not the user's turn, or if they're trying to select an enemy piece, don't do anything
		if (game.turn !== Meteor.userId() || baseOfSelectedPiece !== userBase) {
			return;
		}

		pieceInLimbo = inLimbo(pieceElement);

		// If the user has pieces in limbo and they're trying to select another piece, don't let them
		if (game.playerData[userId].limbo.length > 0 && !pieceInLimbo) {
			return;
		}

		placeElement = pieceInLimbo ? null : pieceElement.parent('.place');

		// Place number is stored in the data-place attr on the place element
		place = pieceInLimbo ? 'limbo' : placeElement.data('place');

		if (currentlySelectedPiece) {
			// If they've selected the same piece again, unselect it
			if (currentlySelectedPiece.place === place) {
				deselectCurrentPiece();
			} else if (place !== 'limbo') {
				// If the user already has a piece selected and they've clicked on another place (that's not limbo) move it
				movePiece(currentlySelectedPiece, place);
			}
			return;
		}

		// Select either the piece (if in limbo) or else the top piece in the stack
		elementToSelect = pieceInLimbo ? pieceElement : placeElement.children('.piece').last();

		// Select piece
		currentlySelectedPiece = {
			base: baseOfSelectedPiece,
			place: place
		};

		$('.place .piece-active').removeClass('piece-active');
		elementToSelect.addClass('piece-active');
	},

	'click .place': function(e) {
		e.stopPropagation();

		var placeElement = $(e.currentTarget), // The element that caused this handler to be invoked, i.e. the place
			place = this.place,
			game = getGame();

		// If it's not the user's turn, or they're trying to move to limbo (?) don't do anything
		if (game.turn !== Meteor.userId() || inLimbo(placeElement)) {
			return;
		}

		// If the user already had a piece selected, and they've selected a different place, move it
		if (currentlySelectedPiece && currentlySelectedPiece.place !== place) {
			movePiece(currentlySelectedPiece, place);
		}
	}
});

Template.offBoardPieces.events({
	'click .removed': function(e) {
		e.stopPropagation();

		var game = getGame(),
			userId = Meteor.userId();

		// If it's not the user's turn, don't do anything
		if (game.turn !== userId) {
			return;
		}

		// If the user has a piece selected, try and remove it
		if (currentlySelectedPiece) {
			Meteor.call('removePiece', game._id, userId, currentlySelectedPiece, function(error, result) {
			// If the piece was successfully moved, set the currently selected piece to null
				if (result) {
					deselectCurrentPiece();
				}
			});
		}
	}
});

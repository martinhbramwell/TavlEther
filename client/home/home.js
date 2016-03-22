'use strict';

// Subscriptions
Meteor.subscribe('userDirectory');
Meteor.subscribe('userData', Meteor.userId());
Meteor.subscribe('usersGames', Meteor.userId());

Template.home.helpers({
	friends: function() {
		return Meteor.user().friends;
	},

	gameInProgress: function() {
		var game = Games.findOne({_id: this.gameId}, {fields: {status: 1}});
		return game && _.contains(['setupColour', 'setupBase', 'setupRoll', 'inProgress'], game.status);
	},

	showAddFriendDialog: function() {
		return Session.equals('showDialog', 'addFriend');
	},

	showRemoveFriendDialog: function() {
		return Session.equals('showDialog', 'removeFriend');
	}
});

Template.home.events({
	'click .js-add-friend': function(e) {
		e.preventDefault();
		Session.set('showDialog', 'addFriend');
	},

	'click .js-remove-friend': function(e) {
		e.preventDefault();
		Session.set('showDialog', 'removeFriend');
	},

	'click .js-resume-game': function(e) {
		e.preventDefault();
		Router.go('game', {_id: this.gameId});
	},

	'click .js-forfeit-game': function(e) {
		e.preventDefault();
		Meteor.call('forfeitGame', this.gameId, Meteor.userId(), this._id, function(error) {
			if (error) {
				Notifications.error('Oops..', 'Something has gone wrong. Sorry about that! Try refreshing the page.');
			}
		});
	},

	'click .js-start-game': function(e) {
		e.preventDefault();
		var gameId = this.gameId;

		Meteor.call('setupNewGame', gameId, Meteor.userId(), this._id, function(error) {
			if (error) {
				Notifications.error('Oops..', 'Something has gone wrong. Sorry about that! Try refreshing the page.');
			} else {
				Router.go('game', {_id: gameId});
			}
		});
	}
});

'use strict';

// Config
Accounts.ui.config({
	passwordSignupFields: 'USERNAME_AND_EMAIL'
});

// Hooks
var loggedIn = function() {
		if (!(Meteor.user())) {
			this.render('login');
		} else {
			this.next();
		}
	},

	// Do some basic validation to ensure IDs are strings and 24 characters long (the required 12 byte length of a Mongo ObjectID)
	validId = function() {
		check(this.params._id, Match.Where(function(x) {
			check(x, String);
			return x.length !== 24 ;
		}));
		this.next();
	};

// Every route should use the applicationLayout template and run the loggedIn check before routing
Router.configure({
	layoutTemplate: 'applicationLayout',
	onBeforeAction: loggedIn
});

// Redirect slash to /home
Router.route('/', function() {
	this.redirect('/home');
});

Router.route('/home');

Router.route('/game/:_id', {
	name: 'game',
	onBeforeAction: validId,
	waitOn: function() {
		return Meteor.subscribe('usersGames', Meteor.userId());
	},
	data: function() {
		var game = Games.findOne({_id: this.params._id}),
			friendId;

		if (!game) {
			this.render('notFound');
			return;
		}

		friendId = _.without(game.players, Meteor.userId())[0];

		return {
			game: game,
			friend: Meteor.users.findOne({_id: friendId})
		};
	}
});

// Navigation links
Template.navBar.events({
	'click .home': function(e) {
		e.preventDefault();
		Router.go('/home');
	}
});

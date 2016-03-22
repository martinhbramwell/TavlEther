/*global Router*/
'use strict';

var colours = [
		{name: 'turquoise'},
		{name: 'emerald'},
		{name: 'peter-river'},
		{name: 'amethyst'},
		{name: 'wet-asphalt'},
		{name: 'sunflower'},
		{name: 'carrot'},
		{name: 'alizarin'}
	],

	bases = [
		{
			base: 'high',
			key: 'h'
		},
		{
			base: 'low',
			key: 'l'
		}
	],

	TOO_LATE = 'Too Late! Already Taken',

	getFriend = function() {
		return Router.current().data().friend;
	},

	getGame = function() {
		return Router.current().data().game;
	};

// ----- Colour Selection -----

Template.setupColour.helpers({

	playerNeedsToChoose: function() {
		return typeof getGame().colours[Meteor.userId()] === 'undefined';
	},

	colours: function() {
		return colours;
	},

	colourName: function(name, friendId) {
		return name === getGame().colours[friendId] ? TOO_LATE : name;
	}
});

Template.setupColour.events({
	'click .js-colour': function(e) {
		e.preventDefault();

		if (e.currentTarget.text !== TOO_LATE) {
			Meteor.call('setColour', getGame()._id, Meteor.userId(), getFriend()._id, this.name);
		}
	}
});

// ----- Base Selection -----

Template.setupBase.playerNeedsToChoose = function() {
	return typeof getGame().bases[Meteor.userId()] === 'undefined';
};

Template.setupBase.bases = function() {
	return bases;
};

Template.setupBase.baseFormatter = function(base, friendId) {
	var friendBase = getGame().bases[friendId];
	return base.key === friendBase ? TOO_LATE : base.base;
};

Template.setupBase.events({
	'click .js-base': function(e) {
		e.preventDefault();

		if (e.currentTarget.text !== TOO_LATE) {
			Meteor.call('setBase', getGame()._id, Meteor.userId(), getFriend()._id, this.key);
		}
	}
});

// ----- Game Roll -----

Template.setupRoll.playerNeedsToRoll = function(id) {
	var roll = getGame().startingRolls[id];
	return typeof roll === 'undefined' || roll === 'draw';
};

Template.setupRoll.equalRolls = function(id) {
	var game = getGame(),
		startingRolls = game.startingRolls;

	// There was a draw
	if (startingRolls[id] === 'draw') {
		return 'Uh oh, you guys rolled the same number. Roll again!';
	}
};

Template.setupRoll.colour = function(id) {
	return getGame().colours[id] || '';
};

Template.setupRoll.roll = function(id) {
	var roll = getGame().startingRolls[id];
	return roll && roll !== 'draw' ? roll : '...';
};

Template.setupRoll.username = function(id) {
	var user = Meteor.user();
	return id === user._id ? user.username : getFriend().username;
};

Template.setupRoll.events({
	'click .js-roll': function(e) {
		e.preventDefault();
		Meteor.call('rollToStart', getGame()._id, Meteor.userId(), getFriend()._id);
	},

	'click .js-start': function(e) {
		e.preventDefault();
		Meteor.call('startGame', getGame()._id, Meteor.userId(), getFriend()._id);
	}
});

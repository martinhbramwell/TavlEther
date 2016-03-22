/* global Games */
'use strict';

Meteor.publish('userDirectory', function() {
	return Meteor.users.find({}, {
		fields: {emails: 1, username: 1},
		sort: {username: 1}
	});
});

Meteor.publish('userData', function(userId) {
	return Meteor.users.find({_id: userId}, {fields: {friends: 1}});
});

Meteor.publish('usersGames', function(userId) {
	return Games.find({players: userId});
});

Games.allow({
	update: function(userId, user, fields) {

		// Ensure user doesn't update fields they shouldn't have access to
		var allowed = ['playerData', 'board', 'colours', 'bases', 'startingRolls', 'turn'];

		if (_.difference(fields, allowed).length) {
			return false;
		}
		return true;
	}
});

Meteor.users.allow({
	update: function(userId, user, fields, modifier) {

		// Ensure user doesn't update fields they shouldn't have access to
		var allowed = ['friends'];

		if (_.difference(fields, allowed).length) {
			return false;
		}

		// User can only update their own profile
		if (user._id === userId) {
			Meteor.users.update({_id: userId}, modifier);
			return true;
		} else {
			return false;
		}
	}
});

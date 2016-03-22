'use strict';

// ----- Add Friend Dialog -----

Template.addFriendDialog.helpers({
	users: function() {
		var currentUser = Meteor.user(),
			friends = currentUser.friends ? _.map(currentUser.friends, function(friend) { return friend._id; }) : [];

		return Meteor.users.find({$nor: [{_id: {$in: friends}}, {_id: currentUser._id}]});
	}
});

Template.addFriendDialog.events({
	'click .add': function() {
		Meteor.call('addFriend', this._id);
	},

	'click .done': function() {
		Session.set('showDialog', null);
	}
});

// ----- Remove Friend Dialog -----

Template.removeFriendDialog.helpers({
	friends: function() {
		return Meteor.user().friends;
	}
});

Template.removeFriendDialog.events({
	'click .remove': function() {
		Meteor.call('removeFriend', this._id);
	},

	'click .done': function() {
		Session.set('showDialog', null);
	}
});

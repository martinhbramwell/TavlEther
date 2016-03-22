/* global Games */
Meteor.methods({

	// ----- Friends -----

	/*
	Friends are stored as an array on a user, i.e.:

	{
		_id: 123,
		username: 'goodforenergy',
		friends: [{
			_id: friendId,
			username: friend.username,
			gameId: KJSDS98EJASD9,
			statistics: {
				wins: 0,
				losses: 0
			}
		}]
	}
	*/
	addFriend: function(friendId) {
		'use strict';

		check(friendId, String);

		var currentUser = Meteor.user(),
			friend = Meteor.users.findOne({_id: friendId}, {fields: {username: 1}});

		Meteor.call('createGame', currentUser._id, friendId, function(error, newGameId) {
			// TODO error handling

			// Add new friend to current user's friend list
			Meteor.users.update({ _id: currentUser._id }, {$push: {friends: {
				_id: friendId,
				username: friend.username,
				gameId: newGameId,
				statistics: {
					wins: 0,
					losses: 0
				}
			}}});

			// Add current user to new friend's friend list
			Meteor.users.update({ _id: friendId }, { $push: {friends: {
				_id: currentUser._id,
				username: currentUser.username,
				gameId: newGameId,
				statistics: {
					wins: 0,
					losses: 0
				}
			}}});
		});
	},

	removeFriend: function(friendId) {
		'use strict';
		check(friendId, String);

		var currentUser = Meteor.user(),
			friendship = _.find(currentUser.friends, function(friend) {
				return friend._id === friendId;
			});

		if (!friendship) {
			return false;
		}

		Meteor.users.update({_id: currentUser._id}, {$pull: {friends: { _id: friendId }}});
		Meteor.users.update({_id: friendId}, {$pull: {friends: { _id: currentUser._id }}});

		Games.remove(friendship.gameId);

		return true;
	}
});

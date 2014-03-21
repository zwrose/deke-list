/**
 * UserController.js 
 *
 * @description ::
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */

var bcrypt = require('bcrypt');

module.exports = {
	
	new: function(req, res){
    res.view();
  },

  create: function(req, res, next){
  	
    var userObj = {
        email: req.param('email'),
        password: req.param('password')
    }

    // Check to make sure the password and password confirmation match before creating record
    if (userObj.password != req.param('confirmation')) {
      var pwMismatch = [{name: 'pwMismatch', message: 'Passwords did not match - please retry!'}]
      req.session.flash = {
  				err: pwMismatch
  		}
  		return res.redirect('user/new');
    }

  	//Create a user with the params from the signup form
  	User.create(userObj, function userCreated(err, user){
  		
  		if(err){
  			console.log(err.ValidationError);
  			req.session.flash = {
  				err: err.ValidationError
  			}

  			return res.redirect('user/new');
  		}

  		//After successfully creating the user
      //Log the user in
      req.session.authenticated = true;
      req.session.User = user;
  		
      res.redirect('/');

  	});
  },

  destroy: function(req, res, next){

    User.findOne(req.param('id'), function foundUser(err, user){
      if(err) return next(err);

      if(!user) return next('User doesn\'t exist.');

      User.destroy(req.param('id'), function userDestroyed(err){
        if(err) return next(err);
      
      });

      res.redirect('/');

    });
  },

  show: function(req, res, next){

  	if(!req.param('id')){
  		return res.view({
  			user: req.session.User
  		});
  	}

    User.findOne(req.param('id'), function foundUser(err, user){

      if(err) return next(err);
      if(!user) return next('User doesn\'t exist.');

      res.view({
        user: user
      });
    });
  },

  edit: function(req, res, next){

    User.findOne(req.param('id'),function foundUser(err, user){

      if(err) return next(err);
      if(!user) return next('User doesn\'t exist.');

      res.view({
        user: user
      });
    });
  },

  update: function(req, res, next){

    var userObj = {
      email: req.param('email'),
      password: req.param('newPassword')
    }

    // Check to make sure the correct old password was entered
    User.findOne(req.param('id'),function foundUser(err, user){

      if(err) {
      	req.session.flash = {
							err: err
				}
				return res.redirect('/user/edit/'+req.param('id'));
      }

      if(!user) {
      	var noUser = [{name: 'noUser', message: 'User does not exist.'}]
				req.session.flash = {
					err: noUser
				}
				return res.redirect('/user/edit/'+req.param('id'));
      }

      if(req.param('oldPassword') && !bcrypt.compareSync(req.param('oldPassword'), user.encryptedPassword)) {

				var badOldPass = [{name: 'badOldPass', message: 'Old password was incorrect - password not updated'}]
				req.session.flash = {
					err: badOldPass
				}
				return res.redirect('/user/edit/'+req.param('id'));

      }

      // Check to make sure the new password and password confirmation match before updating record
	    if (userObj.password != req.param('confirmation')) {
	      var pwMismatch = [{name: 'pwMismatch', message: 'Passwords did not match - please retry!'}]
	      req.session.flash = {
	  			err: pwMismatch
	  		}
	  		return res.redirect('/user/edit/'+req.param('id'));
	    }

	    User.update(req.param('id'), userObj, function userUpdated(err){
	      if(err){
	      	req.session.flash = {
						err: err
					}
	        return res.redirect('/user/edit/'+req.param('id'));
	      }

	      var goodUpdate = [{name: 'goodUpdate', message: 'Information updated successfully.'}]
	      req.session.flash = {
					successMsg: goodUpdate
				}
	      res.redirect('/user/show/'+req.param('id'));
	    });
      
    });

    
  },

};

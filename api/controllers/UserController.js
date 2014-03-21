/**
 * UserController.js 
 *
 * @description ::
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */

module.exports = {
	
	new: function(req, res){
    res.view();
  },

  create: function(req, res, next){
  	
    var userObj = {
        email: req.param('email'),
        password: req.param('password'),
        confirmation: req.param('confirmation')
      }
    console.log(userObj);

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

};

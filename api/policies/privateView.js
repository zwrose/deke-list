/**
 * privateView
 *
 * @module      :: Policy
 * @description :: Ensures that only the appropriate user can see profile info (or an admin)
 * @docs        :: http://sailsjs.org/#!documentation/policies
 *
 */
module.exports = function(req, res, next) {

  var isUser = req.session.User.id == req.param('id');
	var isAdmin = req.session.User.admin;

	// if not right user nor admin, send to them to their profile page
	if (!(isUser || isAdmin)) {
		var noRightsError = [{name: 'noRights', message: 'Sorry, you do not have permission to access that page.'}]
		req.session.flash = {
			err: noRightsError
		}
    return res.redirect('/user/show/' + req.session.User.id); 
	}

	// Otherwise, let them through.
	return next();

};

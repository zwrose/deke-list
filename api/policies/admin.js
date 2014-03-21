/**
 * padmin
 *
 * @module      :: Policy
 * @description :: Ensures that only an admin can see the page
 * @docs        :: http://sailsjs.org/#!documentation/policies
 *
 */
module.exports = function(req, res, next) {

	// if not admin, send to user to their profile page
	if (!req.session.User.admin) {
		var noRightsError = [{name: 'noRights', message: 'Sorry, you do not have permission to access that page.'}]
		req.session.flash = {
			err: noRightsError
		}
    return res.redirect('/user/show/' + req.session.User.id); 
	}

	// Otherwise, let them through.
	return next();

};

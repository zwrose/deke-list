/**
 * isAuthenticated
 *
 * @module      :: Policy
 * @description :: Simple policy to allow any authenticated user
 *                 Assumes that your login action in one of your controllers sets `req.session.authenticated = true;`
 * @docs        :: http://sailsjs.org/#!documentation/policies
 *
 */
module.exports = function(req, res, next) {

	// If the user is not logged in, ask them to.
  if (!req.session.User) {
    var UnAuth = [{name: 'UnAuth', message: 'Please log in.'}]
		req.session.flash = {
			err: {auth: UnAuth}
		}
    return res.redirect('/session/new');
  }

  // Otherwise, let them through.
  return next();
};

// This policy allows the use of flash in the views rather easily
// Be sure to enable it in config/policies.js where needed.
module.exports = function(req, res, next) {

 res.locals.flash = {};

 if(!req.session.flash) return next();

 res.locals.flash = _.clone(req.session.flash);

 // clear flash
 req.session.flash = {};

 next();
};
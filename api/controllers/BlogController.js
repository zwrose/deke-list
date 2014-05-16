/**
 * BlogController
 *
 * @module      :: Controller
 * @description	:: A set of functions called `actions`.
 *
 *                 Actions contain code telling Sails how to respond to a certain type of request.
 *                 (i.e. do stuff, then send some JSON, show an HTML page, or redirect to another URL)
 *
 *                 You can configure the blueprint URLs which trigger these actions (`config/controllers.js`)
 *                 and/or override them with custom routes (`config/routes.js`)
 *
 *                 NOTE: The code you write here supports both HTTP and Socket.io automatically.
 *
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */

var moment = require('moment');

module.exports = {
  
  new: function(req, res, next){
    res.view();
  },
  
  create: function(req, res, next){
    
    var articleObj = {
      title: req.param('articleTitle'),
      articleBody: req.param('articleBody')
    }
    articleObj.author = req.session.User;
    if(req.param('publish') === 'live') {
      articleObj.published = true;
    }
    
    Blog.create(articleObj, function articleCreated(err, article){
      
      if(err) return next(err);
      article.createdAt = moment(article.createdAt).format('MMMM Do, YYYY');
      
      res.redirect('/')
      
    });
    
  },
    
  index: function(req, res, next) {
    
    res.view('home/index');
    
  }
    

  
};

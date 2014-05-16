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
      articleObj.pubDate = moment().format('MMMM Do, YYYY, h:mm a');
    }
    
    Blog.create(articleObj, function articleCreated(err, article){
      
      if(err) {console.log(err); return next(err);}
      
      res.redirect('/')
      
    });
    
  },
    
  index: function(req, res, next) {
    
    Blog.find().where({published: true}).exec(function(err, pubdArticles){
      
      var num = pubdArticles.length;
      
      if(err) return next(err);
      
      if(req.param('id')){
        page = req.param('id');
      } else {
        page = 1;
      }
      
      totalPages = Math.ceil(num/10);
      
      if(page >= totalPages){
        lastPage = true;
      } else {
        lastPage = false;
      }
      
      Blog.find()
      .where({published: true})
      .sort('pubDate desc')
      .paginate({page: page})
      .exec(function(err, articles){
        
        if(err) return next(err);
        
        res.view({
          articles: articles,
          lastPage: lastPage
        })
      });
      
    });
    
  },

    show: function(req, res, next){
      
      Blog.findOne(req.param('id'), function foundArticle(err, article){
        
        if(err) {console.log(err); return next(err);}
        
        if(article.published){
          res.view({
            article: article
          });
        } else {
          res.redirect('/');
        }
        
      });
      
    },
      
    edit: function(req, res, next){
      
      Blog.findOne(req.param('id'), function foundArticle(err, article){
        
        if(err) {console.log(err); return next(err);}
        
        res.view({
          article: article
        });
        
      });
      
    },
    
    update: function(req, res, next){

      var articleObj = {
        title: req.param('articleTitle'),
        articleBody: req.param('articleBody')
      }
      if(req.param('notAlreadyPub') && req.param('notAlreadyPub') === 'true'){
        if(req.param('publish') === 'live'){
          articleObj.published = true;
          articleObj.pubDate = moment().format('MMMM Do, YYYY, h:mm a');
          articleObj.author = req.session.User;
        }
      }
      
      if(req.param('publish') === 'draft'){
        articleObj.published = false;
      }
      
      Blog.update(req.param('id'), articleObj, function articleUpdated(err){

        if(err){
          console.log(err);
          return res.redirect('/blog/edit/'+req.param('id'));
        }

        res.redirect('/blog/show/'+req.param('id'));
      });
      
    },
  
};

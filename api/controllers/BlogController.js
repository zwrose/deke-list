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

// check if DST func
function DST(){
  var today = new Date();
  var yr = today.getFullYear();
  var dst_start = new Date("March 14, "+yr+" 02:00:00"); // 2nd Sunday in March can't occur after the 14th 
  var dst_end = new Date("November 07, "+yr+" 02:00:00"); // 1st Sunday in November can't occur after the 7th
  var day = dst_start.getDay(); // day of week of 14th
  dst_start.setDate(14-day); // Calculate 2nd Sunday in March of this year
  day = dst_end.getDay(); // day of the week of 7th
  dst_end.setDate(7-day); // Calculate first Sunday in November of this year
  if (today >= dst_start && today < dst_end){ //does today fall inside of DST period?
    return true; //if so then return true
  }
  return false; //if not then return false
}

module.exports = {
  
  new: function(req, res, next){
    res.view();
  },
  
  create: function(req, res, next){
    
    // precalculate date and time for publishing
    if(DST()) {
      var pubTimeNow = moment().zone("-04:00").format('MMMM Do, YYYY, h:mm a [EDT]');
    } else {
      var pubTimeNow = moment().zone("-05:00").format('MMMM Do, YYYY, h:mm a [EST]');
    }
    
    var articleObj = {
      title: req.param('articleTitle'),
      articleBody: req.param('articleBody')
    }
    articleObj.author = req.session.User;
    if(req.param('publish') === 'live') {
      articleObj.published = true;
      articleObj.pubDate = pubTimeNow;
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
      
      // precalculate date and time for publishing
      if(DST()) {
        var pubTimeNow = moment().zone("-04:00").format('MMMM Do, YYYY, h:mm a [EDT]');
      } else {
        var pubTimeNow = moment().zone("-05:00").format('MMMM Do, YYYY, h:mm a [EST]');
      }

      var articleObj = {
        title: req.param('articleTitle'),
        articleBody: req.param('articleBody')
      }
      if(req.param('notAlreadyPub') && req.param('notAlreadyPub') === 'true'){
        if(req.param('publish') === 'live'){
          articleObj.published = true;
          articleObj.pubDate = pubTimeNow;
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
      
    admin: function(req, res, next){
      
      Blog.find().exec(function(err, articles){
      
        var num = articles.length;

        if(err) return next(err);

        if(req.param('id')){
          page = req.param('id');
        } else {
          page = 1;
        }

        totalPages = Math.ceil(num/20);

        if(page >= totalPages){
          lastPage = true;
        } else {
          lastPage = false;
        }

        Blog.find()
        .sort('pubDate desc')
        .paginate({page: page, limit: 20})
        .exec(function(err, articles){

          if(err) return next(err);

          res.view({
            articles: articles,
            lastPage: lastPage
          })
        });

      });
      
    },
      
    pubChange: function(req, res, next){
      
      // precalculate date and time for publishing
      if(DST()) {
        var pubTimeNow = moment().zone("-04:00").format('MMMM Do, YYYY, h:mm a [EDT]');
      } else {
        var pubTimeNow = moment().zone("-05:00").format('MMMM Do, YYYY, h:mm a [EST]');
      }
      
      if(req.param('pubToggle') === 'Pub'){
        
        Blog.update(req.param('id'), {published: true, pubDate: pubTimeNow}, function articleUpdated(err){

          if(err){
            var pubError = [{name: 'pubError', message: 'Something went wrong while updating the publishing status!'}]
            req.session.flash = {
                err: {publish: pubError}
            }
            return res.redirect('/blog/admin');
          }

          res.redirect('/blog/admin');
        });
        
      } else {
        
        Blog.update(req.param('id'), {published: false}, function articleUpdated(err){

          if(err){
            var pubError = [{name: 'pubError', message: 'Something went wrong while updating the publishing status!'}]
            req.session.flash = {
                err: {publish: pubError}
            }
            return res.redirect('/blog/admin');
          }

          res.redirect('/blog/admin');
        });
        
      }
      
    },
  
};

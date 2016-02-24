var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');
var jwt = require('express-jwt');
var auth = jwt({ secret: 'SECRET', userProperty: 'payload' });

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

/* GET post json */
router.get('/posts', function(req, res, next) {
  	Post.find(function(err, posts) {
    	if(err) { return next(err); }
	    res.json(posts);
  	});
});

/* POST post */
router.post('/posts', function(req, res, next) {
  	var post = new Post(req.body);

  	post.save(function(err, post) {
    	if (err) { return next(err); }
    	res.json(post);
  	});
});

/* Preload post objects in routes/index.js so when a route URL
   is defined with :post, this function will run first */
router.param('post', function(req, res, next, id) {
  	var query = Post.findById(id);

  	query.exec(function (err, post) {
    	if (err) { return next(err); }
    	if (!post) { return next(new Error('can\'t find post')); }

    	req.post = post;
    	return next();
  	});
});

/* GET :post post object */
router.get('/posts/:post', function(req, res) {
	req.post.populate('comments', function(err, post) {
		if (err) { return next(err); }
		res.json(post);
	});
});

/* PUT :post upvote */
router.put('/posts/:post/upvote', function(req, res, next) {
  	req.post.upvote(function(err, post) {
    	if (err) { return next(err); }
    	res.json(post);
  	});
});

/* POST comment */
router.post('/posts/:post/comments', function(req, res, next) {
	var comment = new Comment(req.body);
	comment.post = req.post;

	comment.save(function(err, comment) {
		if (err) { return next(err); }

		req.post.comments.push(comment);
		req.post.save(function(err, post) {
			if (err) { return next(err); }
			res.json(comment);
		});
	});
});

/* Preload comment objects in routes/index.js so when a route URL
   is defined with :comment, this function will run first */
router.param('comment', function(req, res, next, id) {
  	var query = Comment.findById(id);

  	query.exec(function (err, comment) {
    	if (err) { return next(err); }
    	if (!comment) { return next(new Error('can\'t find comment')); }

    	req.comment = comment;
    	return next();
  	});
});

/* PUT :post/comments/:comment upvote */
router.put('/posts/:post/comments/:comment/upvote', function(req, res, next) {
  	req.comment.upvote(function(err, comment) {
    	if (err) { return next(err); }
    	res.json(comment);
  	});
});

/* POST login */
router.post('/login', function(req, res, next) {
    if (!req.body.username || !req.body.password) {
        return res.status(400).json({message: 'Please fill out all fields'});
    }

    passport.authenticate('local', function(err, user, info) {
        if (err) { return next(err); }

        if(user) {
            return res.json({ token: user.generateJWT() });
        }
        else {
            return res.status(401).json(info);
        }
    })(req, res, next);
});

module.exports = router;
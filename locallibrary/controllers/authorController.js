const Author = require('../models/author');
const Book = require('../models/book');

const async = require('async');

const {body, validationResult} = require('express-validator');

// display list of all authors
exports.author_list = (req, res, next) => {
    Author.find()
        .sort({family_name: 1})
        .exec((err, list_authors) => {
            if (err) return next(err);
            // on success
            res.render('author_list',{
                title: 'Author List',
                author_list: list_authors,
            });
        });
};

// display detail page for a specific author
exports.author_detail = (req, res, next) => {
    async.parallel(
        {
            author(callback){
                Author.findById(req.params.id)
                    .exec(callback)
            },
            author_books(callback){
                Book.find({author: req.params.id}, 'title summary')
                    .sort({title:1})
                    .exec(callback)
            },
        },
        (err, results) => {
            if (err) return next(err);
            // no results
            if (results == null){
                const err = new Error('Author not found!');
                err.status = 404;
                return next(err);
            }
            // successful, render view
            res.render('author_detail', {
                title: 'Author Detail',
                author: results.author,
                author_books: results.author_books,
            });
        }
    );
};

// display author create form on GET
exports.author_create_get = (req, res, next) => {
    res.render('author_form', {title:'Create Author'})
};

// handle author create form on POST
exports.author_create_post = [
    // validate and sanitize fields
    body('first_name').trim().isLength({min:1}).escape()
        .withMessage('First name must be specified.')
        .isAlphanumeric()
        .withMessage('First name has non-alphanumeric characters.'),
    body('family_name').trim().isLength({min:1}).escape()
        .withMessage('Family name must be specified.')
        .isAlphanumeric()
        .withMessage('Family name has non-alphanumeric characters.'),
    body('date_of_birth', 'Invalid date of birth').optional({checkFalsy:true})
        .isISO8601().toDate(),
    body('date_of_death', 'Invalid date of death').optional({checkFalsy: true})
        .isISO8601().toDate(),
    // process after validation and sanitization
    (req, res, next) => {
        // extract validation errors from request
        const errors = validationResult(req);
        // there's error, render form again with sanitized data and error messages
        if(!errors.isEmpty()){
            res.render('author_form',{
                title: 'Create Author',
                author: req.body,
                errors: errors.array()
            });
            return
        }
        // data is valid, create an Author object with trimmed and escaped data
        const author = new Author({
            first_name: req.body.first_name,
            family_name: req.body.family_name,
            date_of_birth: req.body.date_of_birth,
            date_of_death: req.body.date_of_death
        });

        author.save((err)=>{
            if(err) return next(err);
            // successful, redirect to author detail age
            res.redirect(author.url);
        });
    }

]

// display author delete form on GET
exports.author_delete_get = (req, res, next) =>{
    async.parallel(
        {   
            author(callback){
                Author.findById(req.params.id).exec(callback);
            },
            author_books(callback){
                Book.find({author:req.params.id}).exec(callback);
            }
        },
        (err, results)=>{
            if(err) return next(err);
    
            if(results.author  == null){
                // no author results, nothing to delete, redirect to author list
                res.redirect('/catalog/authors');
            }
            // successful, render author delete form
            res.render('author_delete',{
                title: 'Delete Author',
                author:results.author,
                author_books:results.author_books
            });    
        }
    )
}

// handle author delete form on POST
exports.author_delete_post = (req, res, next) => {
    async.parallel(
        {
            author(callback){
                // use form body parameter,rather than url parameter
                // to validate id has been provided
                Author.findById(req.body.authorid).exec(callback);
            },
            author_books(callback){
                Book.find({author:req.body.authorid}).exec(callback);
            }
        },
        (err, results) => {
            if(err) return next(err);
            // if there's associated books,re-render the form 
            if (results.author_books.length > 0){
                res.render('author_delete',{
                    title: 'Delete Author',
                    author:results.author,
                    author_books:results.author_books
                })
                return;
            }
            // delete author object, redirect to author list
            Author.findByIdAndRemove(req.body.authorid).exec((err)=>{
                if(err) return next(err);
                res.redirect('/catalog/authors');
            });
        }
    )
};

// display author update form on GET
exports.author_update_get = (req, res, next) => {
    // populate form from database using url parameter
    Author.findById(req.params.id).exec((err, results)=>{
        if(err) return next(err);
        // if no results
        if(results == null){
            const err = new Error('Author not found.');
            err.status = 404;
            return next(err);
        }
        // success, render update form
        res.render('author_form',{
            title: 'Update Author',
            author: results,
        });
    });
};

// handle author update form on POST
exports.author_update_post = [
    // sanitize and validate fields
    body('first_name')
        .trim()
        .isLength({min:1})
        .escape()
        .withMessage('First name must be specified.')
        .isAlphanumeric()
        .withMessage('First name contains non-alphanumeric characters.'),
    body('family_name')
        .trim()
        .isLength({min:1})
        .escape()
        .withMessage('Family name must be specified.')
        .isAlphanumeric()
        .withMessage('Family name contains non-alphanumeric characters.'),
    body('date_of_birth','Invalid date of birth')
        .optional({checkFalsy: true})
        .isISO8601()
        .toDate(),
    body('date_of_death','Invalid date of death')
        .optional({checkFalsy: true})
        .isISO8601()
        .toDate(),
    // process after validation
    (req, res, next) =>{
        // extract validation errors
        const errors = validationResult(req);
        // create author object
        const author = new Author({
            first_name: req.body.first_name,
            family_name: req.body.family_name,
            date_of_birth: req.body.date_of_birth,
            date_of_death: req.body.date_of_death,
            // required, or a new ID will be created
            _id: req.params.id,
        });
        // data is invalid, re-render form with sanitized data and error messages
        if(!errors.isEmpty()){
            res.render('author',{
                title: 'Update Author',
                author: author,
                errors: errors.array(),
            });
        }
        // success, update data, redirect to detail page
        Author.findByIdAndUpdate(req.params.id, author, {},(err,results)=>{
            if(err) return next(err);
            res.redirect(results.url);
        });
    }
];

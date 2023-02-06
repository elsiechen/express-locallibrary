const Genre = require('../models/genre');
const Book = require('../models/book');

const async = require('async');

const {body, validationResult} = require('express-validator');

// display list of all genres
exports.genre_list = (req, res,next) => {
    Genre.find()
        .sort({name: 1})
        .exec((err, list_genre) => {
            if (err) return next(err);
            res.render('genre_list', {
                title: 'Genre List',
                genre_list: list_genre,
            });
        });
};

// display detail page for a specific genre
exports.genre_detail = (req, res, next) => {
    async.parallel(
    {
        genre(callback){
            Genre.findById(req.params.id).exec(callback);
        },
        genre_books(callback){
            Book.find({genre: req.params.id}).exec(callback);
        }
    },
    (err, results) => {
        if (err) return next(err);
        // no results
        if(results == null){
            const err = new Error('Genre not found!');
            err.status = 404;
            return next(err);
        }
        // on success
        res.render('genre_detail', {
            title: 'Genre Detail',
            genre: results.genre,
            genre_books: results.genre_books,
        });
    });
};

// display genre create form on GET
exports.genre_create_get = (req, res, next) => {
    res.render('genre_form',{title: 'Create Genre'});
};

// handle genre create form on POST
exports.genre_create_post = [
    // Validate and sanitize the name field
    body('name', 'Genre name must contain at least 3 characters.').trim().isLength({min:3}).escape(),
    // process request after validation and sanitization
    (req, res, next) =>{
        // extract validation errors from request
        const errors = validationResult(req);
        // create a genre object with trimmed and escaped data  
        const genre = new Genre({name: req.body.name});
        // there are errors, redisplay form with sanitized data and error messages
        if(!errors.isEmpty()){
            res.render('genre_form',{
                title: 'Create Genre',
                genre,
                errors: errors.array(),
            });
            return
        }
        // data is valid, check if genre name already exist
        else{
            Genre.findOne({name: req.body.name}).exec((err, genre_found)=>{
                if(err) return next(err);
                // name already exist, redirect to detail page
                if(genre_found){
                    res.redirect(genre_found.url);
                }
                // name not exist, save genre, redirect to detail page
                else{
                    genre.save((err)=>{
                        if(err) return next(err);
                        res.redirect(genre.url);
                    });
                }
                
                

            })
        }
    }
]

// display genre delete form on GET
exports.genre_delete_get = (req, res, next) => {
    async.parallel(
        {
            genre(callback){
                Genre.findById(req.params.id).exec(callback);
            },
            genre_books(callback){
                Book.find({genre:req.params.id}).exec(callback);
            }
        },
        (err, results) =>{
            if(err) return next(err);
            // no results, redirect to genre list
            if(results.genre == null){
                res.redirect('/catalog/genres');
            }
            // success, render genre delete form
            res.render('genre_delete',{
                title: 'Delete Genre',
                genre:results.genre,
                genre_books:results.genre_books
            });
        }
    )
};

// handle genre delete form on POST
exports.genre_delete_post = (req, res, next) => {
    async.parallel(
        {
            genre(callback){
                Genre.findById(req.body.genreid).exec(callback);
            },
            genre_books(callback){
                Book.find({genre:req.body.genreid}).exec(callback);
            }
        },
        (err, results)=>{
            if(err) return next(err);
            // there's associated books, re-render delete form
            if(results.genre_books.length > 0){
                res.render('genre_delete',{
                    title:'Delete Genre',
                    genre:results.genre,
                    genre_books:results.genre_books
                });
                return
            }
            // successfully delete genre record, redirect to genre list
            Genre.findByIdAndRemove(req.body.genreid).exec((err)=>{
                if(err) return next(err);
                res.redirect('/catalog/genres');
            });
        }
    )
};

// display genre update form on GET
exports.genre_update_get = (req, res, next) => {
    // populate form with values from database
    // use url parameter to get specific genre
    Genre.findById(req.params.id).exec((err, results)=>{
        if(err) return next(err);
        // no results
        if(results == null){
            const err = new Error('Genre not found.');
            err.status = 404;
            return next(err);
        }
        // success
        res.render('genre_form',{
            title: 'Update Genre',
            genre: results,
        });
    });
};

// handle genre update form on POST
exports.genre_update_post = [
    // validate and sanitize field
    body('name','Genre name must contain at least 3 characters.')
        .trim()
        .isLength({min:3})
        .escape(),
    // process after validation
    (req, res, next) =>{
        // extract validation errors from request
        const errors = validationResult(req);
        // create genre object with data and old id
        const genre = new Genre({
            name: req.body.name,
            // required, or a new id will be created
            _id: req.params.id,
        });
        // data is invalid, re-render form with sanitized data and error messages
        if(!errors.isEmpty()){
            res.render('genre_form',{
                title: 'Update Genre',
                genre,
                errors: errors.array(),
            });
            return;
        }
        Genre.findByIdAndUpdate(req.params.id, genre, {}, (err, results)=>{
            if(err) return next(err);
            res.redirect(results.url);
        });
    }
        
]
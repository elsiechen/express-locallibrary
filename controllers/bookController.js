const Book = require('../models/book');
const BookInstance = require('../models/bookinstance');
const Author = require('../models/author');
const Genre = require('../models/genre');

const async = require('async');
const { validationResult, body } = require('express-validator');
const author = require('../models/author');
const book = require('../models/book');
const bookinstance = require('../models/bookinstance');

// display site welcome page
exports.index = (req, res) => {
    async.parallel({
        book_count(callback){
            Book.countDocuments({}, callback);
        },
        book_instance_count(callback){
            BookInstance.countDocuments({}, callback);
        },
        book_instance_available_count(callback){
            BookInstance.countDocuments({status: 'Available'}, callback);
        },
        author_count(callback){
            Author.countDocuments({}, callback);
        },
        genre_count(callback){
            Genre.countDocuments({}, callback);
        },
    },
    (err, results) => {
        res.render('index',{
            title: 'Local Library Home',
            error: err,
            data: results,
        });
    }
    );
};

// display list of all book
exports.book_list = (req, res, next) => {
    Book.find({}, 'title author')
        .sort({title: 1})
        .populate('author')
        .exec(function(err, list_books){
            if (err) return next(err);
            // on success, render template
            res.render('book_list', {title:'Book List', book_list: list_books});
        });
};

// display detail page for a specific 
exports.book_detail = (req, res, next) => {
    async.parallel(
        {
            book(callback){
                Book.findById(req.params.id)
                    .populate('author')
                    .populate('genre')
                    .exec(callback);
            },
            book_instance(callback){
                BookInstance.find({book:req.params.id})
                    .exec(callback);
            },
        },
        (err, results) => {
            if (err) return next(err);
            // no results
            if(results == null){
                const err = new Error('Book not found!');
                err.status = 404;
                return next(err);
            }
            // successful
            res.render('book_detail',{
                book: results.book,
                book_instance: results.book_instance,
            });
        }
    );
};

// display book create form on GET
exports.book_create_get = (req, res, next) => {
    // get all authors and genres which we can add to our book
    async.parallel(
        {
            authors(callback){
                Author.find(callback);
            },
            genres(callback){
                Genre.find(callback);
            }
        },
        (err, results) =>{
            if(err) return next(err);
            res.render('book_form',{
                title: 'Create Book',
                authors: results.authors,
                genres: results.genres,
            })
        }
    )
};

// handle book create on POST
exports.book_create_post = [
    // convert the genre to an array 
    // (book_form returns genre as an array
    // while other fields as strings)
    (req, res, next) => {
        if(!Array.isArray(req.body.genre)){
            req.body.genre = 
                typeof req.body.genre==='undefined'?[]:[req.body.genre];
        }
        // execute the next middleware in the middleware stack
        // the current middleware function doesn't end request-response cycle
        // it must call next() to pass control to next middleware function 
        next();
    },

    // validate and sanitize fields
    body('title','Title must be specified.').trim().isLength({min:1}).escape(),
    body('author','Author must be specified.').trim().isLength({min:1}).escape(),
    body('summary','Summary must be specified.').trim().isLength({min:1}).escape(),
    body('isbn','ISBN must be specified.').trim().isLength({min:1}).escape(),
    // sanitize every item below key genre to validate each of genre array entries
    body('genre.*').escape(),

    // process after validation and sanitization
    (req, res, next) => {
        // extract validation errors from request
        const errors = validationResult(req);

        // create book object
        const book = new Book({
            title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: req.body.genre
        });

        // data is invalid, rerender the form with escaped and trimmed data
        if(!errors.isEmpty()){
            // get all authors and genres for form
            async.parallel(
                {
                    authors(callback){
                        Author.find(callback);
                    },
                    genres(callback){
                        Genre.find(callback);
                    }
                },
                (err, results)=>{
                    if(err) return next(err);
                    // mark user's selected genres as checked
                    for(const val of results.genres){
                        if(book.genre.includes(val._id)){
                            val.checked = 'true';
                        }
                    }
                    res.render('book_form',{
                        title: 'Create Book',
                        authors: results.authors,
                        genres: results.genres,
                        book,
                        errors: errors.array()
                    });
                }
            )
            return;
        }

        // data is valid
        book.save((err)=> {
            if(err) return next(err);
            // successful, redirect to book detail page
            res.redirect(book.url);
        });
    }

];

// display book delete form on GET
exports.book_delete_get = (req, res, next) => {
    async.parallel(
        {
            book(callback){
                Book.findById(req.params.id)
                    .populate('author')
                    .populate('genre')
                    .exec(callback);
            },
            book_bookinstances(callback){
                BookInstance.find({book:req.params.id}).exec(callback);
            }
        },
        (err,results)=>{
            if(err) return next(err);
            // no results, redirect to book list
            if(results.book == null){
                res.redirect('/catalog/books');
            }
            // successful, render book delete form
            res.render('book_delete',{
                title: 'Delete Book',
                book: results.book,
                book_bookinstances: results.book_bookinstances
            });
        }
    )
};

// handle book delete on POST
exports.book_delete_post = (req, res,next) => {
    async.parallel(
        {
            book(callback){
                Book.findById(req.body.bookid)
                    .populate('author')
                    .populate('genre')
                    .exec(callback)
            },
            book_bookinstances(callback){
                BookInstance.find({book:req.body.bookid}).exec(callback);
            }
        },
        (err, results) =>{
            if(err) return next(err);
            // there are associated bookinstances, re-render book delete form
            if(results.book_bookinstances.isLength > 0){
                res.render('book_delete',{
                    title: 'Delete book',
                    book: results.book,
                    book_instances: results.book_bookinstances
                });
            }
            // successfully delete book record, redirect to book list
            Book.findByIdAndRemove(req.body.bookid).exec((err)=>{
                if(err) return next(err);
                res.redirect('/catalog/books');
            });
        }
    )
};

// display book update form on GET
exports.book_update_get = (req, res,next) => {
    async.parallel(
        {   
            // populate form with values from database
            // use url parameter to get the specific book
            book(callback){
                Book.findById(req.params.id)
                    .populate('author')
                    .populate('genre')
                    .exec(callback);
            },
            authors(callback){
                Author.find().exec(callback);
            },
            genres(callback){
                Genre.find().exec(callback);
            }
        },
        (err, results) => {
            if (err) return next(err);
            // no results
            if(results.book == null){
                const err = new Error('Book not found');
                err.status = 404;
                return next(err);
            }
            // successful
            // mark selected genre as checked           
            for(const genre of results.genres){
                for(const bookGenre of results.book.genre){
                    if(genre._id.toString() === bookGenre._id.toString()){
                        genre.checked = 'true';
                    }
                }
            }
            // render book form page
            res.render('book_form',{
                title: 'Update Book',
                book: results.book,
                authors: results.authors,
                genres: results.genres
            });
        }
    )
};

// handle book update on POST
exports.book_update_post = [
    // convert genre to an array 
    // (book_form returns genre as an array while other fields as strings)
    (req, res, next) => {
        if(!Array.isArray(req.body.genre)){
            req.body.genre = 
                typeof req.body.genre===undefined?[]:[req.body.genre];
        }
        // the current middleware function doesn't end request-response cycle
        // it must call next() to pass control to next middleware function 
        next();
    },
    // validate and sanitize fields
    body('title','Title must be specified.').trim().isLength({min:1}).escape(),
    body('author','Author must be specified.').trim().isLength({min:1}).escape(),
    body('summary','Summary must be specified.').trim().isLength({min:1}).escape(),
    body('isbn','ISBN must be specified.').trim().isLength({min:1}).escape(),
    // sanitize every item below key genre to validate each of genre array entries
    body('genre.*').escape(),

    // process after validation and sanitization
    (req, res, next) =>{
        // extract validation errors from request
        const errors = validationResult(req);
        // create book object with trimmed and escaped data and old id
        const book = new Book({
            title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            // genre: typeof req.body.genre==undefined?[]:req.body.genre,
            genre: req.body.genre,          
            // required or a new ID will be assigned(created)
            _id: req.params.id,
        })
        // data is invalid, re-render the form with trimmed and escaped data
        if(!errors.isEmpty()){
            // get all authors and genres for form
            async.parallel(
                {
                    authors(callback){
                        Author.find(callback);
                    },
                    genres(callback){
                        Genre.find(callback);
                    }
                },
                (err, results) =>{
                    if(err) return next(err);
                    // mark user's selected genres as checked
                    for(const val of results.genres){
                        if(book.genre.includes(val._id)){
                            val.checked = 'true';
                        }
                    }
                    // another way to mark selected genres as checked
                    // for(const genre of results.genres){
                    //     for(const bookGenre of book.genre){
                    //         if(genre._id.toString() === bookGenre._id.toString()){
                    //             genre.checked = 'true';
                    //         }
                    //     }
                    // }
                    res.render('book_form',{
                        title: 'Update Book',
                        book,
                        authors: results.authors,
                        genres: results.genres,
                        errors: errors.array() 
                    });
                }
            )
            return;
        }
        // data is valid, update record and redirect to detail page
        Book.findByIdAndUpdate(req.params.id, book, {},(err,results)=>{
            if(err) return next(err);
            res.redirect(results.url);
        });
    }
    
]
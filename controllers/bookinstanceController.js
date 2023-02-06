const BookInstance = require('../models/bookinstance');
const Book = require('../models/book');

const async = require('async');
const {body, validationResult} = require('express-validator');

// display list of all bookinstances
exports.bookinstance_list = (req, res, next) => {
    BookInstance.find()
        .populate('book')
        .exec((err, list_bookinstances) => {
            if (err) return next(err);

            // on success
            res.render('bookinstance_list',{
                title: 'Book Instance List',
                bookinstance_list: list_bookinstances,
            });
        });
};

// display detail page for a specific 
exports.bookinstance_detail = (req, res, next) => {
    BookInstance.findById(req.params.id)
        .populate('book')
        .exec((err, results)=>{
            if (err) return next(err);
            // no results
            if (results == null){
                const err = new Error('Book copy not found!');
                err.status = 404;
                return next(err);
            }
            // successful
            res.render('bookinstance_detail',{
                title: `Copy: ${results.book.title}`,
                bookinstance: results,
            });
        });
};

// display bookinstance create form on GET
exports.bookinstance_create_get = (req, res,next) => {
    Book.find({}, 'title',(err, results) =>{
        if(err) return next(err);
        res.render('bookinstance_form',{
            title: 'Create BookInstance',
            books: results,
        });
    });
};

// handle bookinstance create form on POST
exports.bookinstance_create_post = [
    // sanitize and validate fields
    body('book','Book must be supplied.').trim().isLength({min:1}).escape(),
    body('imprint','Imprint must be supplied.').trim().isLength({min:1}).escape(),
    body('status').escape(),
    body('due_back','Invalid date').optional({checkFalsy: true}).isISO8601().toDate(),
    // process after validation
    (req, res, err) =>{
        // extract validation errors from request
        const errors = validationResult('express-validator');
        // create bookinstance object with trimmed, escaped data
        const bookinstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
        })

        // if there's error, rerender form with trimmed, escaped data with error messages
        if(!errors.isEmpty()){
            // get all books for form
            Book.find({},'title',(err,results)=>{
                if(err) return next(err);
                res.render('bookinstance_form',{
                    title: 'Create BookInstance',
                    books:results,
                    selected_book:bookinstance.book._id,
                    bookinstance,
                    errors:errors.array()
                });
            });
            return;
        }
        // successful, save bookinstance, redirect to bookinstance detail page
        bookinstance.save((err)=>{
            if(err) return next(err);
            res.redirect(bookinstance.url);
        });

    }
];

// display bookinstance delete form on GET
exports.bookinstance_delete_get = (req, res, next) => {
    BookInstance.findById(req.params.id)
        .populate('book')
        .exec((err, results)=>{
            if(err) return next(err);
            // no bookinstance results, nothing to delete, redirect to bookinstance list
            if(results == null){
                res.redirect('/catalog/bookinstances')
            }
            // there's results, render bookinstance delete form
            res.render('bookinstance_delete',{
                title:'Delete BookInstance',
                bookinstance: results
            });
    });
    
};

// handle bookinstance delete form on POST
exports.bookinstance_delete_post = (req, res, next) => {
    BookInstance.findByIdAndRemove(req.body.bookinstanceid).exec((err)=>{
        if(err) return next(err);
        // successfully delete bookinstance, redirect to bookinstance list
        res.redirect('/catalog/bookinstances');
    }); 
};

// display bookinstance update form on GET
exports.bookinstance_update_get = (req, res, next) => {
    async.parallel(
        {   
            // populate form with values from database
            // use url parameter to get the specific book
            bookinstance(callback){
                BookInstance.findById(req.params.id)
                    .populate('book')
                    .exec(callback);        
            },
            books(callback){
                Book.find(callback);
            }
        },
        (err, results) =>{
            if(err) return next(err);
            // no results
            if(results.bookinstance == null){
                const err = new Error('BookInstance not found.');
                err.status = 404;
                return next(err);
            }
            // success, render bookinstance form
            res.render('bookinstance_form',{
                title: 'Update BookInstance',
                bookinstance: results.bookinstance,
                books: results.books,
                // selected book id
                selected_book: results.bookinstance.book._id,
            });
        }
    )
};

// handle bookinstance update form on POST
exports.bookinstance_update_post = [
    // sanitize and validate fields
    body('book','Book must be specified.').trim().isLength({min:1}).escape(),
    body('imprint','Imprint must be supplied.').trim().isLength({min:1}).escape(),
    body('status').escape(),
    body('due_back','Invalid date').optional({checkFalsy: true}).isISO8601().toDate(),
    
    // process after validation
    (req,res,next) => {
        // extract validation errors from request
        const errors = validationResult(req);
        // create bookinstance object
        const bookinstance = new BookInstance({
            title: 'Update BookInstance',
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
            // required or a new ID will be assigned(created)
            _id: req.params.id,
        })
        // data is invalid, re-render the form
        if(!errors.isEmpty()){
            // get all books for form
            Book.find({},'title').exec((err,results)=>{
                if(err) return next(err);
                res.render('bookinstance_form',{
                    title: 'Update BookInstance',
                    bookinstance,
                    // selected book id
                    selected_book: bookinstance.book._id,
                    books:results,
                    errors: errors.array()
                });
            });
            return;
        }
        // success, update bookinstance, redirect to detail page
        BookInstance.findByIdAndUpdate(
            req.params.id, 
            bookinstance,
            {},
            (err,results)=>{
                if(err) return next(err);
                res.redirect(results.url);
            });
    }
]

const express = require('express');
const router = express.Router();

// require controller modules
const book_controller = require('../controllers/bookController');
const book_instance_controller = require('../controllers/bookinstanceController');
const author_controller = require('../controllers/authorController');
const genre_controller = require('../controllers/genreController');

/// book routes ///

// get catalog home page (handle function are imported from controller modules)
router.get('/', book_controller.index);

// get request for creating a book
// note: this must come before routes that display book (uses id)
router.get('/book/create', book_controller.book_create_get);
// post request for creating a book
router.post('/book/create', book_controller.book_create_post);
// get request for deleting a book
router.get('/book/:id/delete', book_controller.book_delete_get);
// post request for deleting a book
router.post('/book/:id/delete', book_controller.book_delete_post);
// get request for updating a book
router.get('/book/:id/update', book_controller.book_update_get);
// post request for updating a book
router.post('/book/:id/update', book_controller.book_update_post);

// get request for one book
router.get('/book/:id', book_controller.book_detail);
// ger request for list of all books
router.get('/books', book_controller.book_list);

/// author routes ///

// get request for creating an author
// note: this must come before routes that display author (uses id)
router.get('/author/create', author_controller.author_create_get);
// post request for creating an author
router.post('/author/create', author_controller.author_create_post);
// get request for deleting an author
router.get('/author/:id/delete', author_controller.author_delete_get);
// post request for deleting an author
router.post('/author/:id/delete', author_controller.author_delete_post);
// get request for updating an author
router.get('/author/:id/update', author_controller.author_update_get);
// post request for updating an author
router.post('/author/:id/update', author_controller.author_update_post);

// get request for one author
router.get('/author/:id', author_controller.author_detail);
// get request for list of all authors
router.get('/authors', author_controller.author_list);


/// bookinstance routes ///

// get request for creating a book_instance
// note: this must come before routes that display book_instance (uses id)
router.get('/bookinstance/create', book_instance_controller.bookinstance_create_get);
// post request for creating a book_instance
router.post('/bookinstance/create', book_instance_controller.bookinstance_create_post);
// get request for deleting a book_instance
router.get('/bookinstance/:id/delete', book_instance_controller.bookinstance_delete_get);
// post request for deleting a book_instance
router.post('/bookinstance/:id/delete', book_instance_controller.bookinstance_delete_post);
// get request for updating a book_instance
router.get('/bookinstance/:id/update', book_instance_controller.bookinstance_update_get);
// post request for updating a book_instance
router.post('/bookinstance/:id/update', book_instance_controller.bookinstance_update_post);

// get request for one book_instance
router.get('/bookinstance/:id', book_instance_controller.bookinstance_detail);
// ger request for list of all bookinstances
router.get('/bookinstances', book_instance_controller.bookinstance_list);


/// genre routes ///

// get request for creating  genre
// note: this must come before routes that display genre (uses id)
router.get('/genre/create', genre_controller.genre_create_get);
// post request for creating a genre
router.post('/genre/create', genre_controller.genre_create_post);
// get request for deleting a genre
router.get('/genre/:id/delete', genre_controller.genre_delete_get);
// post request for deleting a genre
router.post('/genre/:id/delete', genre_controller.genre_delete_post);
// get request for updating a genre
router.get('/genre/:id/update', genre_controller.genre_update_get);
// post request for updating a genre
router.post('/genre/:id/update', genre_controller.genre_update_post);

// get request for one genre
router.get('/genre/:id', genre_controller.genre_detail);
// ger request for list of all genres
router.get('/genres', genre_controller.genre_list);


module.exports = router;
const { DateTime } = require("luxon");
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const BookInstanceSchema = new Schema({
    book:{type: Schema.Types.ObjectId, ref: 'Book', required: true},
    imprint:{type: String, required: true},
    status:{
        type: String,
        required: true,
        enum: ['Available', 'Maintenance', 'Loaned', 'Reserved'],
        default: 'Maintenance',
    },
    due_back: {type: Date, default: Date.now}
});

// virtual for bookinstance's url
BookInstanceSchema.virtual('url').get(function(){
    return `/catalog/bookinstance/${this._id}`;
});

// virtual for due_back_formatted
// format 'Oct 15, 2023' for detail page
BookInstanceSchema.virtual('due_back_formatted').get(function(){
    return DateTime.fromJSDate(this.due_back).toLocaleString(DateTime.DATE_MED);
});

// virtual for due_back_yyyy_mm_dd
// format '2023-10-15' for form input
BookInstanceSchema.virtual('due_back_yyyy_mm_dd').get(function(){
    return DateTime.fromJSDate(this.due_back).toISODate();
});

module.exports = mongoose.model('BookInstance', BookInstanceSchema);
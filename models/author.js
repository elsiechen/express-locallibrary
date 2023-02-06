const { DateTime } = require('luxon');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AuthorSchema = new Schema({
    first_name: {type: String, required: true, maxLength: 100},
    family_name: {type: String, required: true, maxLength: 100},
    date_of_birth: {type: Date},
    date_of_death: {type: Date},
});

// virtual for author's full name
AuthorSchema.virtual('name').get(function(){
    // to avoid errors where an author doesn't have family or first name
    // we return empty string to handle the exception
    let fullName = '';
    if(this.first_name && this.family_name){
        fullName = `${this.family_name}, ${this.first_name}`;
    }
    return fullName
});

// virtual for author's url
AuthorSchema.virtual('url').get(function(){
    // we don't use arrow function for we need 'this' object
    return `/catalog/author/${this._id}`;
});

// virtual for date_of_birth_yyyy_mm_dd
// format: 2023-11-15
AuthorSchema.virtual('date_of_birth_yyyy_mm_dd').get(function(){
    // return formatted date or blank string to ignore missing dates
    return this.date_of_birth? DateTime.fromJSDate(this.date_of_birth).toISODate():'';
});

// virtual for date_of_death_yyyy_mm_dd
AuthorSchema.virtual('date_of_death_yyyy_mm_dd').get(function(){
    return this.date_of_death? DateTime.fromJSDate(this.date_of_death).toISODate():'';
});


// export model
module.exports = mongoose.model('Author', AuthorSchema);
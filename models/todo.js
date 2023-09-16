const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const todoSchema = new mongoose.Schema({
  content: String,
  createdTime: String,
  userId: { type: Schema.Types.ObjectId, ref: 'user_infos' },
});

const Todo = mongoose.model('todos', todoSchema);

module.exports = Todo;

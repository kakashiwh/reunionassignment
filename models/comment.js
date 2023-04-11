import mongoose from 'mongoose' ;

const commentSchema = new mongoose.Schema({
    content: {
      type: String,
      required: true,
    },
    createdBy: {
      type: String,
      required: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
    },
  });
  
  const Comment = mongoose.model('Comment', commentSchema);
  
  export default Comment;
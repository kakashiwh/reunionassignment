import mongoose from 'mongoose' ;

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  createdBy: {
    type: String,
    required: true,
  },
  likes: [
    {
      type: String,
    },
  ],
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
    },
  ],
},
{ timestamps: true });


const Post = mongoose.model('PostMessage',postSchema);

export default Post;
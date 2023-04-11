import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import User from './models/user.js';
import Post from './models/postMessage.js';
import Comment from './models/comment.js';
import jwt from 'jsonwebtoken'; 

const app = express();
dotenv.config();


app.use(bodyParser.json({limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({limit: "30mb", extended: true }));
app.use(cors());


// JWT Secret key
const jwtSecret = 'secretkey';

// Authenticate user and return JWT token
app.post('/api/authenticate', (req, res) => {
  const { email, password } = req.body;

  // Dummy email and password for testing purposes
  if (email !== 'test@test.com' || password !== 'test') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Generate JWT token
  const token = jwt.sign({ email }, jwtSecret, { expiresIn: '1h' });
  return res.json({ token });
});

// Middleware for verifying JWT token
const authenticateUser = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

// Follow a user
app.post('/api/follow/:id', authenticateUser, async (req, res) => {
 if(req.body.userId !== req.params.id){
  try {
    const user = await User.findById(req.params.id);
    const currentUser = await User.findById(req.body.userId);
    if(!user.followers.includes(req.body.userId)){
      await user.updateOne({$push:{followers:req.body.userId}})
      await currentUser.updateOne({$push:{following:req.params.id}})
      res.status(200).json("user has been followed");
    }
    else{
      res.status(403).json("you already follow this user")
    }
  } catch (error) {
    res.status(500).json(error);
  }
 }
 else{
  res.status(403).json("you cant follow yourself");
 }
});

// Unfollow a user
app.post('/api/unfollow/:id', authenticateUser, async (req, res) => {
  if(req.body.userId !== req.params.id){
    try {
      const user = await User.findById(req.params.id);
      const currentUser = await User.findById(req.body.userId);
      if(user.followers.includes(req.body.userId)){
        await user.updateOne({$pull:{followers:req.body.userId}})
        await currentUser.updateOne({$pull:{following:req.params.id}})
        res.status(200).json("user has been unfollowed");
      }
      else{
        res.status(403).json("you dont unfollow this user")
      }
    } catch (error) {
      res.status(500).json(error);
    }
   }
   else{
    res.status(403).json("you cant unfollow yourself");
   }
  });

// Get user profile
app.get('/api/user', authenticateUser, async (req, res) => {
  const { email } = req.user;
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const { name, following=[], followers=[] } = user;
  return res.json({ name, following: following.length, followers: followers.length });
});

// Add new post
app.post('/api/posts', authenticateUser, async (req, res) => {
  const { title, description } = req.body;
  const post = new Post({ title, description, createdBy: req.user.email });
  await post.save();
  return res.json({ id: post._id, title, description, created_at: post.createdAt });
});

// Delete post
app.delete('/api/posts/:id', authenticateUser, async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;
  
  try {
    const post = await Post.findOne({ _id: postId, user: userId });
    if (!post) {
      return res.status(404).json({ error: 'Post not found or you are not authorized to delete it' });
    }
    
    // Delete any comments related to the post
    await Comment.deleteMany({ post: post._id });
    
    // Delete the post itself
    await Post.deleteOne({ _id: postId });
    
    return res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
  });

  // Like a post
app.post('/api/like/:id', authenticateUser, async (req, res) => {
  const { id } = req.params;
  const post = await Post.findByIdAndUpdate(id, { $addToSet: { likes: req.user.email } });
  if (!post) {
  return res.status(404).json({ error: 'Post not found' });
  }
  return res.json({ message:` You liked the post with ID: ${id}` });
  });
  
  // Unlike a post
  app.post('/api/unlike/:id', authenticateUser, async (req, res) => {
  const { id } = req.params;
  const post = await Post.findByIdAndUpdate(id, { $pull: { likes: req.user.email } });
  if (!post) {
  return res.status(404).json({ error: 'Post not found' });
  }
  return res.json({ message:` You unliked the post with ID: ${id} `});
  });
  
  // Add a comment to a post
  app.post('/api/comment/:id', authenticateUser, async (req, res) => {
  const { id } = req.params;
  const { comment } = req.body;
  const post = await Post.findById(id);
  if (!post) {
  return res.status(404).json({ error: 'Post not found' });
  }
  const newComment = new Comment({ content: comment, createdBy: req.user.email, post: id });
  await newComment.save();
  post.comments.push(newComment);
  await post.save();
  return res.json({ id: newComment._id });
  });
  
  // Get a single post with its likes and comments
  app.get('/api/posts/:id', authenticateUser, async (req, res) => {
  const { id } = req.params;
  const post = await Post.findById(id).populate('comments');
  if (!post) {
  return res.status(404).json({ error: 'Post not found' });
  }
  return res.json({ id: post._id, title: post.title, desc: post.description, created_at: post.createdAt, likes: post.likes.length, comments: post.comments });
  });
  
  // Get all posts created by the authenticated user sorted by post time
  app.get('/api/all_posts', authenticateUser, async (req, res) => {
  const posts = await Post.find({ createdBy: req.user.email }).sort({ createdAt: -1 }).populate('comments');
  const formattedPosts = posts.map((post) => ({
  id: post._id,
  title: post.title,
  desc: post.description,
  created_at: post.createdAt,
  likes: post.likes.length,
  comments: post.comments,
  }));
  return res.json(formattedPosts);
  });
  
  const PORT = process.env.PORT || 5000;
  const CONNECTION_URL='mongodb+srv://kakashiwh:kakashiwh123@cluster0.y6l7i2d.mongodb.net/?retryWrites=true&w=majority';
  
  mongoose.set("strictQuery", false);
  mongoose.connect(CONNECTION_URL,{ useNewUrlParser : true , useUnifiedTopology: true})
       .then(() => app.listen(PORT,() => console.log(`Server running on port: ${PORT}`)))
       .catch((error) => console.log(error));
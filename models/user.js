import mongoose from 'mongoose' ;

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  followers:
    {
      type: Array,
      default: [],
    },

  following: 
    {
      type: Array,
      default: [],
    },
  
});

export default mongoose.model("User", userSchema);
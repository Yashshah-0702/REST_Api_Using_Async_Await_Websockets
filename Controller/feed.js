const { validationResult } = require("express-validator");
const Post = require("../models/post");
const fs = require("fs");
const path = require("path");
const User = require("../models/user");
const io = require('../socket')

// Get Post(read)
// Using async/await
exports.getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2;
  // let totalItems;
  try{
    const totalItems = await Post.find()
    .countDocuments()
    const posts = await Post.find().populate('creator').sort({createdAt:-1})
    .skip((currentPage - 1) * perPage)
    .limit(perPage);

    res.status(200).json({
      message: "Posts Found",
      post: posts,
      totalItems: totalItems,
    });
  }
  catch(err){
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// Create Post (create)
exports.createPosts = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Creating post failed...!");
    error.statusCode = 422;
    throw error;
  }
  if (!req.file) {
    const error = new Error("No image found...!");
    error.statusCode = 422;
    throw error;
  }
  const imageurl = req.file.path;
  const title = req.body.title;
  const content = req.body.content;
  const post = new Post({
    title: title,
    content: content,
    imageurl: imageurl,
    creator: req.userId,
  });
  try{
 await post
    .save()
    const user = await User.findById(req.userId);
      user.posts.push(post);
      await user.save();
      io.getIO().emit('posts',{action:'create',post:{...post._doc,creator:{_id:req.userId,name:user.name}}})
      res.status(201).json({
        message: "Post Created Successfully",
        post: post,
        creator: { _id: user._id, name: user.name },
    })
  }
    catch(err){
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    };
};

// Read a single product
exports.getPost = async (req, res, next) => {
  const postsId = req.params.postsId;
  const posts = await Post.findById(postsId)
   try {
      if (!posts) {
        const error = new Error("No Product Found...!");
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({
        post: posts,
      });
   }
    catch(err){
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    };
};

// Update post (update)
exports.updatePosts = async (req, res, next) => {
  const postsId = req.params.postsId;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Updating post failed...!");
    error.statusCode = 422;
    throw error;
  }
  const title = req.body.title;
  const content = req.body.content;
  let imageurl = req.body.image;
  if (req.file) {
    imageurl = req.file.path;
  }
  if (!imageurl) {
    const error = new Error("No file picked...");
    error.statusCode = 422;
    throw error;
  }
  try{
  const post = await Post.findById(postsId).populate('creator')
      if (!post) {
        const error = new Error("Could not find post.");
        error.statusCode = 404;
        throw error;
      }
      if(post.creator._id.toString()!== req.userId){
        const error = new Error("Not Authorized");
        error.statusCode = 403;
        throw error;
      }
      if (imageurl !== post.imageurl) {
        clearImage(post.imageurl);
      }
      post.title = title;
      post.imageurl = imageurl;
      post.content = content;
      const result = await post.save();
      io.getIO().emit('posts',{action:'update',post:result})
      res.status(200).json({
        message: "post updated",
        post: result,
      });
    }
    catch(err) {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    };
};

exports.deletePosts = async (req, res, next) => {
  const postsId = req.params.postsId;
  try{
  const post = await Post.findById(postsId)
      if (!post) {
        const error = new Error("Post not found...");
        error.statusCode = 422;
        throw error;
      }
      if(post.creator.toString()!== req.userId){
        const error = new Error("Not Authorized");
        error.statusCode = 403;
        throw error;
      }
      clearImage(post.imageurl);
      await Post.findByIdAndRemove(postsId);
      const user = await User.findById(req.userId)
      user.posts.pull(postsId)
      await user.save()
      io.getIO().emit('posts',{action:'delete',post:postsId})
      res.status(200).json({ message: "Post Deleted" });
    }
    catch(err) {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    };
};
const clearImage = (filePath) => {
  filePath = path.join(__dirname, "..", filePath);
  fs.unlink(filePath, (err) => console.log(err));
};
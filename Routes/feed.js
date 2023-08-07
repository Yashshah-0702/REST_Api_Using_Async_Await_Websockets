const express = require("express");
const feedController = require("../Controller/feed");
const { body } = require("express-validator");
const isAuth = require("../middleware/is-auth");

const router = express.Router();

router.get("/posts", isAuth, feedController.getPosts);

router.post(
  "/post",
  isAuth,
  [
    body("title").trim().isLength({ min: 5 }),
    body("content").trim().isLength({ min: 5 }),
  ],
  feedController.createPosts
);

router.get("/posts/:postsId", isAuth, feedController.getPost);

router.put(
  "/posts/:postsId",
  isAuth,
  [
    body("title").trim().isLength({ min: 5 }),
    body("content").trim().isLength({ min: 5 }),
  ],
  feedController.updatePosts
);

router.delete("/posts/:postsId", isAuth, feedController.deletePosts);

module.exports = router;

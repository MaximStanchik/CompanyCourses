const express = require("express");
const router = express.Router();

const { uploadVideoHandler } = require("../Controllers/videoController");

router.post("/upload", uploadVideoHandler);

module.exports = router;

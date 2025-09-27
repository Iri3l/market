const express = require("express");
const app = express();

// Elastic Beanstalk will inject PORT
const port = process.env.PORT || 8080;

app.get("/", (_req, res) => {
  res.send("Hello from AWS Elastic Beanstalk 👋");
});

app.listen(port, () => {
  console.log(`Server listening on ${port}`);
});

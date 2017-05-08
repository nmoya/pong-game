var app = require('./web-server/app');

app.listen(3000, () => {
  console.log(`Pong web-server!`);
  console.log(`Mode: ${app.get('env')}`);
  console.log(`Port: listening on port 3000`);
  console.log(`URL: http://localhost:3000`);
})

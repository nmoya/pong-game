var app = require('./web-server/app');
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Pong web-server!`);
  console.log(`Mode: ${app.get('env')}`);
  console.log(`Port: listening on port ${PORT}`);
  console.log(`URL: http://localhost:${PORT}`);
})

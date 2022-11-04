const app = require('./app');

init();

function init () {
  try {
    app.listen(3001, () => {
      console.log('Express App Listening on Port 3001');
    });
  } catch (error) {
    console.error(`An error occurred: ${JSON.stringify(error)}`);
    process.exit(1);
  }
}



// ## future ideas & improvement
// 1- convert the project from javascript to typescript
// 2- add eslint to formate on save and follow the language Rules  Done
// 3- restructure the folders and the files to be in modules Done in just one module
// 4- add unit test and integration test Done in just one module
// 5- add ci-cd for check the lint, build, test are working fine
// 6- dockerize the application
// 7- add validation rules Done on some APIs

// i know may be there is alot of good practice that may be need to be applied, i took lots of new ideas from new framework like NestJs
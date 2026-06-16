const app = require('./app');
const config = require('./config');
const { initializeDatabase } = require('./config/db');

async function startServer() {
  try {
    await initializeDatabase();
    app.listen(config.port, () => {
      console.log(`Server is running on port ${config.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();

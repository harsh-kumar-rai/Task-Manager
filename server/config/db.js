const mongoose = require('mongoose');

let memoryServer;

const connectDB = async () => {
  try {
    let uri = process.env.MONGO_URI;
    let label = 'MongoDB';

    if (!uri) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('MONGO_URI environment variable is required in production');
      }
      const { MongoMemoryServer } = require('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create();
      uri = memoryServer.getUri();
      label = 'MongoDB (in-memory dev)';
    }

    await mongoose.connect(uri);
    console.log(`${label} connected`);
  } catch (err) {
    console.error(`Database connection failed: ${err.message}`);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
};

module.exports = { connectDB, disconnectDB };

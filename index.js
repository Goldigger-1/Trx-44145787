const express = require('express');
const { Telegraf } = require('telegraf');
const path = require('path');
const fs = require('fs');
const { Sequelize, DataTypes, Op } = require('sequelize');
require('dotenv').config();

// The bot Telegram is already initialized below in the code

// Path to the persistent database - FIXED to always use the external database path
const DB_PATH = '/var/lib/tidash_database.sqlite';

// Verify if the database file exists, create it if it doesn't
if (!fs.existsSync(DB_PATH)) {
  try {
    // Create directory if it doesn't exist (for production path)
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, '', { flag: 'wx' });
    console.log(`Database file created at ${DB_PATH}`);
  } catch (err) {
    console.error(`Error creating database file: ${err.message}`);
    // Critical: Don't crash the server, but log the error
  }
}

// Initialize the SQLite database with robust options
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: DB_PATH,
  logging: false, // Disable SQL logs for production
  retry: {
    max: 3, // Maximum retry 3 times
    match: [/SQLITE_BUSY/], // Only retry for SQLITE_BUSY errors
  },
  pool: {
    max: 5, // Maximum number of connection in pool
    min: 0, // Minimum number of connection in pool
    acquire: 30000, // The maximum time, in milliseconds, that pool will try to get connection before throwing error
    idle: 10000 // The maximum time, in milliseconds, that a connection can be idle before being released
  },
  // Add this to handle connection issues
  dialectOptions: {
    timeout: 15000 // Timeout in ms
  }
});

// Model definitions
// HowToPlayLink: persistent single-row table for YouTube help link
const HowToPlayLink = sequelize.define('HowToPlayLink', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

// PromotionBanner: persistent single-row table for promo image and link
const PromotionBanner = sequelize.define('PromotionBanner', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  imageFilename: {
    type: DataTypes.STRING,
    allowNull: true
  },
  link: {
    type: DataTypes.STRING,
    allowNull: true
  }
});
const User = sequelize.define('User', {
  gameId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    primaryKey: true
  },
  gameUsername: {
    type: DataTypes.STRING,
    allowNull: false
  },
  telegramId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  telegramUsername: {
    type: DataTypes.STRING,
    allowNull: true
  },
  paypalEmail: {
    type: DataTypes.STRING,
    allowNull: true
  },
  bestScore: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  registrationDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  deviceId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  musicEnabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  avatarSrc: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'avatar_default.jpg'
  },
  scoretotal: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
});

// Define the Season model without any User references
const Season = sequelize.define('Season', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  seasonNumber: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  startDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  prizeMoney: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  secondPrize: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
  },
  thirdPrize: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isClosed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  winnerId: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

const SeasonScore = sequelize.define('SeasonScore', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  seasonId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  score: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

// Synchronize models with the database robustly
(async () => {
  let syncRetries = 0;
  const maxRetries = 3;
  while (syncRetries < maxRetries) {
    try {
      await sequelize.sync({ force: false });
      // Ensure at least one HowToPlayLink row exists
      const count = await HowToPlayLink.count();
      if (count === 0) {
        await HowToPlayLink.create({ url: '' });
      }
      // Ensure at least one PromotionBanner row exists
      const promoCount = await PromotionBanner.count();
      if (promoCount === 0) {
        await PromotionBanner.create({ imageFilename: '', link: '' });
      }
      break;
    } catch (error) {
      syncRetries++;
      if (syncRetries >= maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
})();
(async () => {
  let syncRetries = 0;
  const maxRetries = 3;
  
  while (syncRetries < maxRetries) {
    try {
      // Use force: false to avoid dropping tables
      await sequelize.sync({ force: false });
      console.log('Database synchronized successfully');
      break; // Exit the loop if successful
    } catch (err) {
      syncRetries++;
      console.error(`Database sync error (attempt ${syncRetries}/${maxRetries}):`, err);
      
      if (syncRetries >= maxRetries) {
        console.error('Failed to synchronize database after maximum retries');
        // Don't crash the server, continue with potentially limited functionality
      } else {
        // Wait before retrying (exponential backoff)
        const waitTime = Math.pow(2, syncRetries) * 1000;
        console.log(`Retrying database sync in ${waitTime/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
})();

// Initialize the database
(async () => {
  try {
    // Check if the users table exists and contains data
    try {
      const count = await User.count();
      console.log(`📊 ${count} users found in the database`);
      
      // If the table is empty, migrate existing data if necessary
      if (count === 0) {
        console.log('The users table is empty, attempting to migrate data...');
        await migrateExistingData();
      }
    } catch (error) {
      console.error('Error while checking the data:', error);
    }
  } catch (error) {
    console.error('Error during database initialization:', error);
  }
})();

// Function to migrate existing data from the JSON file to the database
async function migrateExistingData() {
  try {
    const dataDir = path.join(__dirname, 'data');
    const usersFile = path.join(dataDir, 'users.json');
    
    if (fs.existsSync(usersFile)) {
      const usersData = fs.readFileSync(usersFile, 'utf8');
      const users = JSON.parse(usersData);
      
      console.log(`Migrating ${users.length} users to the database...`);
      
      for (const user of users) {
        // Check if the user already exists
        const [existingUser] = await User.findOrCreate({
          where: {
            [Op.or]: [
              { gameId: user.gameId },
              { telegramId: user.telegramId !== "N/A" ? user.telegramId : null }
            ]
          },
          defaults: {
            gameId: user.gameId,
            gameUsername: user.gameUsername,
            telegramId: user.telegramId !== "N/A" ? user.telegramId : null,
            telegramUsername: user.telegramUsername !== "N/A" ? user.telegramUsername : null,
            paypalEmail: user.paypalEmail || "",
            bestScore: parseInt(user.bestScore) || 0,
            registrationDate: user.registrationDate || new Date().toISOString().split('T')[0],
            lastLogin: user.lastLogin || new Date().toISOString().split('T')[0]
          }
        });
      }
      
      console.log('Migration completed successfully');
      
      // Create a backup of the JSON file
      fs.copyFileSync(usersFile, path.join(dataDir, 'users_backup.json'));
    } else {
      console.log('No user data file found for migration');
    }
  } catch (error) {
    console.error('Error during data migration:', error);
  }
}

// Create initial season if none exists
async function createInitialSeason() {
  try {
    const seasonCount = await Season.count();
    if (seasonCount === 0) {
      console.log('Creating initial season...');
      
      // Set end date to 30 days from now
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      
      const initialSeason = await Season.create({
        seasonNumber: 1,
        endDate: endDate,
        prizeMoney: 100.00,
        isActive: true,
        isClosed: false
      });
      
      console.log(`Initial season created: Season ${initialSeason.seasonNumber}`);
    }
  } catch (error) {
    console.error('Error creating initial season:', error);
  }
}

// createInitialSeason();

const app = express();
const port = process.env.PORT || 3000;
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const webAppUrl = process.env.WEBAPP_URL;

// Middleware for parsing JSON
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Initialize the bot Telegram
const bot = new Telegraf(botToken);

// Set up the /start command handler
console.log('Setting up the /start command handler');

// Handle the /help command to redirect to the YouTube video
bot.help((ctx) => {
  ctx.reply('📺 Watch the tutorial video here: https://www.youtube.com/watch?v=t0fz4KVU7yw');
});

bot.start((ctx) => {
  console.log('/start command received from:', ctx.from.id, ctx.from.username);
  ctx.reply("🚀 Play, Grab $TID Tokens, and turn your skills into cash.\n\nWelcome to TiDash Game 👾.", {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Play and Earn $TID 🚀', web_app: { url: webAppUrl } }],
        [{ text: 'Join Our Channel 📢', url: 'https://t.me/TiDash_ECO_Hub' }],
        [{ text: 'Discover ECO Project 🌐', url: 'https://eco.framer.wiki/' }],
      ]
    }
  }).then(() => {
    console.log('Response sent successfully');
  }).catch(err => {
    console.error('Error while sending the response:', err);
  });
});

// Handle the Help button
bot.action('show_help', (ctx) => {
  ctx.answerCbQuery(); // Close the loading bubble
  ctx.reply('📺 Watch the tutorial video here: https://www.youtube.com/watch?v=t0fz4KVU7yw');
});

// Launch the bot
bot.launch().then(() => {
  console.log('Telegram Bot started');
}).catch((err) => {
  console.error('Error during bot launch:', err);
});

// Route to send a message to all users (broadcast)
app.post('/api/broadcast', express.json(), async (req, res) => {
  try {
    // Basic admin authentication by header (to be secured according to your needs)
    // For example : req.headers['x-admin-auth'] === 'your_admin_token'
    // Here, we let it pass for simplicity, since the authentication is already on the admin.js side

    const { message } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Invalid message' });
    }
    // Retrieve all users with a non-null telegramId
    const users = await User.findAll({
      where: {
        telegramId: { [Sequelize.Op.not]: null }
      }
    });
    if (!users.length) {
      return res.status(404).json({ error: 'No users with TelegramId' });
    }
    let success = 0, fail = 0;
    for (const user of users) {
      try {
        await bot.telegram.sendMessage(user.telegramId, message);
        success++;
      } catch (err) {
        fail++;
        // Optional: log individual errors
        console.error(`Error sending to ${user.telegramId}:`, err.message);
      }
    }
    res.json({ sent: success, failed: fail, total: users.length });
  } catch (error) {
    console.error('Error during broadcast:', error);
    res.status(500).json({ error: 'Error sending message' });
  }
});

// Route to retrieve a specific season
app.get('/api/seasons/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const season = await Season.findByPk(id);
    if (!season) {
      return res.status(404).json({ error: 'Season not found' });
    }
    res.json(season);
  } catch (error) {
    console.error('Error during season retrieval:', error);
    res.status(500).json({ error: 'Error during season retrieval' });
  }
});

// Route to serve the admin panel
app.get('/admin754774', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin754774', 'index.html'));
});

// API to retrieve all users (with pagination and search)
app.get('/api/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    
    console.log(`Admin panel requesting users - Page: ${page}, Limit: ${limit}, Search: "${search}"`);
    
    let whereCondition = {};
    
    // Only add search conditions if a search term was provided
    if (search && search.trim() !== '') {
      try {
        // Safer approach for SQLite - use Op.like directly
        const searchPattern = `%${search}%`;
        
        whereCondition = {
          [Op.or]: [
            { gameId: { [Op.like]: searchPattern } },
            { gameUsername: { [Op.like]: searchPattern } },
            // Secure handling of potentially null fields
            Sequelize.or(
              { telegramId: { [Op.like]: searchPattern } },
              { telegramId: null }
            ),
            Sequelize.or(
              { telegramUsername: { [Op.like]: searchPattern } },
              { telegramUsername: null }
            ),
            Sequelize.or(
              { paypalEmail: { [Op.like]: searchPattern } },
              { paypalEmail: null }
            )
          ]
        };
      } catch (searchError) {
        // In case of error in search condition construction, continue without filter
        console.error('Error building search condition:', searchError);
        // Continue without search filter rather than failing completely
      }
    }
    
    // Use a more robust approach to retrieve users
    try {
      // Retrieve users with pagination
      const { count, rows } = await User.findAndCountAll({
        where: whereCondition,
        order: [['bestScore', 'DESC']],
        limit,
        offset
      });
      
      console.log(`Found ${count} users matching criteria`);
      
      res.json({
        total: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        users: rows
      });
    } catch (dbError) {
      // If the query fails, try a simpler approach without search conditions
      console.error('Error with search query, falling back to simple query:', dbError);
      
      // Fallback query without search conditions
      const { count, rows } = await User.findAndCountAll({
        order: [['bestScore', 'DESC']],
        limit,
        offset
      });
      
      console.log(`Fallback query found ${count} users`);
      
      res.json({
        total: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        users: rows
      });
    }
  } catch (error) {
    console.error('Error retrieving users:', error);
    res.status(500).json({ 
      error: 'Error retrieving users', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// New route to get user by Telegram ID
app.get('/api/users/telegram/:telegramId', async (req, res) => {
  try {
    const { telegramId } = req.params;
    
    console.log(`Attempting to find user with Telegram ID: ${telegramId}`);
    
    // Find user by Telegram ID
    const user = await User.findOne({ 
      where: { telegramId: telegramId }
    });
    
    if (!user) {
      console.log(`User with Telegram ID ${telegramId} not found`);
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log(`User with Telegram ID ${telegramId} found`);
    res.status(200).json(user);
  } catch (error) {
    console.error('Error retrieving user by Telegram ID:', error);
    res.status(500).json({ 
      error: 'Error retrieving user by Telegram ID', 
      details: error.message 
    });
  }
});

// New route to get user by device ID
app.get('/api/users/device/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    console.log(`Attempting to find user with Device ID: ${deviceId}`);
    
    // Find user by device ID (stored in a new column)
    const user = await User.findOne({ 
      where: { deviceId: deviceId }
    });
    
    if (!user) {
      console.log(`User with Device ID ${deviceId} not found`);
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log(`User with Device ID ${deviceId} found`);
    res.status(200).json(user);
  } catch (error) {
    console.error('Error retrieving user by Device ID:', error);
    res.status(500).json({ 
      error: 'Error retrieving user by Device ID', 
      details: error.message 
    });
  }
});

// API endpoint to get user by device ID

// API endpoint to get user by Telegram ID
app.get('/api/users/telegram/:telegramId', async (req, res) => {
  try {
    const { telegramId } = req.params;
    console.log(`Looking up user by Telegram ID: ${telegramId}`);
    
    if (!telegramId) {
      return res.status(400).json({ error: 'Telegram ID is required' });
    }
    
    // Find the user by Telegram ID
    const user = await User.findOne({ where: { telegramId } });
    
    if (!user) {
      console.log(`No user found with Telegram ID: ${telegramId}`);
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log(`Found user by Telegram ID: ${user.gameId}`);
    
    // Get active season for this user
    const activeSeason = await Season.findOne({ where: { isActive: true } });
    let seasonScore = 0;
    
    if (activeSeason) {
      // Get user's score for this season
      const score = await SeasonScore.findOne({
        where: {
          userId: user.gameId,
          seasonId: activeSeason.id
        }
      });
      
      seasonScore = score ? score.score : 0;
    }
    
    // Ensure avatar path is correctly formatted
    const userData = user.toJSON();
    
    // Log the avatar path for debugging
    console.log(`Avatar path in database: ${userData.avatarSrc}`);
    
    // Make sure avatarSrc is always returned with the correct format
    if (!userData.avatarSrc) {
      userData.avatarSrc = '/avatars/avatar_default.jpg';
      console.log('No avatar found, using default');
    } else if (!userData.avatarSrc.startsWith('/') && !userData.avatarSrc.startsWith('http')) {
      // If it's just a file name (without path), add the /avatars/ prefix
      userData.avatarSrc = `/avatars/${userData.avatarSrc}`;
      console.log(`Fixed avatar path: ${userData.avatarSrc}`);
    }
    
    // Return user data with season score
    res.status(200).json({
      ...userData,
      seasonScore
    });
  } catch (error) {
    console.error('Error fetching user by Telegram ID:', error);
    res.status(500).json({ 
      error: 'Error fetching user', 
      details: error.message 
    });
  }
});

// Route to retrieve a specific user
app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`Attempting to retrieve user with ID: ${id}`);
    
    // Retrieve the user by gameId (which is the primary key)
    const user = await User.findByPk(id);
    
    if (!user) {
      console.log(`User with ID ${id} not found`);
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log(`User with ID ${id} found`);
    res.status(200).json(user);
  } catch (error) {
    console.error('Error retrieving the user:', error);
    res.status(500).json({ error: 'Error retrieving the user', details: error.message });
  }
});

// API for deleting a user
app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`Attempting to delete user with ID: ${id}`);
    
    // First check if the user exists
    const user = await User.findByPk(id);
    if (!user) {
      console.log(`User with ID ${id} not found for deletion`);
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Start a transaction to ensure all operations succeed or fail together
    const transaction = await sequelize.transaction();
    
    try {
      // Disable foreign key constraints temporarily
      await sequelize.query('PRAGMA foreign_keys = OFF;', { transaction });
      
      // Delete season scores first
      await sequelize.query('DELETE FROM "SeasonScores" WHERE "userId" = ?', {
        replacements: [id],
        transaction
      });
      
      // Update season references
      await sequelize.query('UPDATE "Seasons" SET "winnerId" = NULL WHERE "winnerId" = ?', {
        replacements: [id],
        transaction
      });
      
      // Delete the user
      await sequelize.query('DELETE FROM "Users" WHERE "gameId" = ?', {
        replacements: [id],
        transaction
      });
      
      // Reactivate foreign key constraints
      await sequelize.query('PRAGMA foreign_keys = ON;', { transaction });
      
      // Commit the transaction
      await transaction.commit();
      
      console.log(`User ${id} deleted successfully`);
      res.status(200).json({ message: 'User deleted successfully' });
    } catch (innerError) {
      // Rollback the transaction in case of error
      await transaction.rollback();
      
      // Reactivate foreign key constraints even in case of error
      await sequelize.query('PRAGMA foreign_keys = ON;');
      
      console.error(`Transaction error deleting user ${id}:`, innerError);
      throw innerError;
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ 
      error: 'Error deleting user', 
      details: error.message,
      stack: error.stack
    });
  }
});

// API to register a new user or update an existing user
// Add a score to the user's scoretotal (by TelegramId or deviceId)
app.post('/api/users/add-scoretotal', async (req, res) => {
    try {
        const { id, scoreToAdd } = req.body;
        if (!id || typeof scoreToAdd !== 'number') {
            return res.status(400).json({ error: 'Missing id or scoreToAdd' });
        }
        // Search by TelegramId first, then by deviceId
        let user = await User.findOne({ where: { telegramId: id } });
        if (!user) {
            user = await User.findOne({ where: { deviceId: id } });
        }
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        user.scoretotal = (user.scoretotal || 0) + scoreToAdd;
        await user.save();
        res.json({ ok: true, scoretotal: user.scoretotal });
    } catch (err) {
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

app.post('/api/users', async (req, res) => {
  try {
    const userData = req.body;
    console.log('User data received:', userData);

    // CRITICAL FIX: Get the active season first
    const activeSeason = await Season.findOne({ where: { isActive: true } });
    
    // Simplified logic: keep only one account per Telegram ID
    let user = null;
    
    console.log('Start of user search');
    
    // Absolute priority: search by Telegram ID
    if (userData.telegramId && userData.telegramId.trim() !== '') {
      console.log(`- Search with telegramId: ${userData.telegramId}`);
      
      // Find all users with this Telegram ID
      const usersWithSameTelegramId = await User.findAll({
        where: { telegramId: userData.telegramId }
      });
      
      console.log(`Found ${usersWithSameTelegramId.length} users with the same Telegram ID`);
      
      if (usersWithSameTelegramId.length > 0) {
        // Keep the first user found
        user = usersWithSameTelegramId[0];
        console.log(`User selected with telegramId: ${user.gameId}`);
        
        // Delete all other accounts with the same Telegram ID
        if (usersWithSameTelegramId.length > 1) {
          console.log(`Found ${usersWithSameTelegramId.length} users with the same Telegram ID, cleaning up duplicates...`);
          
          for (let i = 1; i < usersWithSameTelegramId.length; i++) {
            console.log(`Deleting duplicate account: ${usersWithSameTelegramId[i].gameId}`);
            await usersWithSameTelegramId[i].destroy();
          }
        }
      }
    } else {
      // If no Telegram ID, search by deviceId or gameId
      const searchConditions = [];
      
      if (userData.gameId) {
        searchConditions.push({ gameId: userData.gameId });
        console.log(`- Search with gameId: ${userData.gameId}`);
      }
      
      if (userData.deviceId && userData.deviceId.trim() !== '') {
        searchConditions.push({ deviceId: userData.deviceId });
        console.log(`- Search with deviceId: ${userData.deviceId}`);
      }
      
      if (searchConditions.length > 0) {
        user = await User.findOne({
          where: { [Op.or]: searchConditions }
        });
        
        if (user) {
          console.log(`User found without Telegram ID: ${user.gameId}`);
        }
      }
    }
    
    // Delete all users without Telegram ID if the current user has a Telegram ID
    if (userData.telegramId && userData.telegramId.trim() !== '') {
      // Do not perform this operation if the user is already found and has no Telegram ID
      if (!(user && (!user.telegramId || user.telegramId.trim() === ''))) {
        console.log('Searching for accounts without Telegram ID for cleanup...');
        
        const usersWithoutTelegram = await User.findAll({
          where: {
            [Op.or]: [
              { telegramId: null },
              { telegramId: '' }
            ]
          }
        });
        
        if (usersWithoutTelegram.length > 0) {
          console.log(`Found ${usersWithoutTelegram.length} accounts without Telegram ID, cleaning up...`);
          
          for (const userWithoutTelegram of usersWithoutTelegram) {
            console.log(`- Deleting account without Telegram ID: ${userWithoutTelegram.gameId}`);
            await userWithoutTelegram.destroy();
          }
        }
      }
    }

    // Start a transaction to ensure data consistency
    const transaction = await sequelize.transaction();
    
    try {
      if (user) {
        // Update existing user
        console.log(`Updating existing user: ${user.gameId}`);
        
        // Log avatar data for debugging
        console.log(`Avatar received from client: ${userData.avatarSrc}`);
        console.log(`Current avatar in database: ${user.avatarSrc}`);
        
        // Update user data
        await user.update({
          gameUsername: userData.gameUsername || user.gameUsername,
          telegramId: userData.telegramId || user.telegramId,
          telegramUsername: userData.telegramUsername || user.telegramUsername,
          paypalEmail: userData.paypalEmail || user.paypalEmail,
          bestScore: Math.max(parseInt(userData.bestScore) || 0, user.bestScore || 0),
          lastLogin: new Date(),
          // IMPORTANT: Use userData.avatarSrc even if it is undefined to allow updating
          // If userData.avatarSrc is explicitly set (even empty), use it; otherwise, keep the old one
          avatarSrc: (
            userData.avatarSrc &&
            userData.avatarSrc !== "avatar_default.jpg" &&
            userData.avatarSrc !== user.avatarSrc
          ) ? userData.avatarSrc : user.avatarSrc, 
          deviceId: userData.deviceId || user.deviceId,
          musicEnabled: userData.musicEnabled !== undefined ? userData.musicEnabled : user.musicEnabled
        }, { transaction });
        
        // If there's an active season, update or create the season score
        if (activeSeason) {
          // Find or create season score for this user
          const [seasonScore, created] = await SeasonScore.findOrCreate({
            where: {
              userId: user.gameId,
              seasonId: activeSeason.id
            },
            defaults: {
              score: parseInt(userData.seasonScore) || 0
            },
            transaction
          });
          
          // If the season score already exists, update it only if the new score is higher
          if (!created) {
            const currentScore = seasonScore.score || 0;
            const newScore = parseInt(userData.seasonScore) || 0;
            
            if (newScore > currentScore) {
              await seasonScore.update({
                score: newScore
              }, { transaction });
              console.log(`Updated season score for user ${user.gameId}: ${currentScore} -> ${newScore}`);
            }
          }
        }
        
        // Commit the transaction
        await transaction.commit();
        
        // Get user data and ensure avatar path is correctly formatted
        const userJson = user.toJSON();
        
        // Log the avatar path for debugging
        console.log(`Avatar path after update: ${userJson.avatarSrc}`);
        
        // Make sure avatarSrc is always returned with the correct format
        if (!userJson.avatarSrc) {
          userJson.avatarSrc = '/avatars/avatar_default.jpg';
          console.log('No avatar found, using default');
        } else if (!userJson.avatarSrc.startsWith('/') && !userJson.avatarSrc.startsWith('http')) {
          // If it's just a file name (without path), add the /avatars/ prefix
          userJson.avatarSrc = `/avatars/${userJson.avatarSrc}`;
          console.log(`Fixed avatar path: ${userJson.avatarSrc}`);
        }
        
        // Return updated user data
        res.status(200).json({
          message: 'User updated successfully',
          user: userJson,
          seasonData: activeSeason ? {
            id: activeSeason.id,
            seasonNumber: activeSeason.seasonNumber,
            endDate: activeSeason.endDate,
            currentScore: userData.seasonScore
          } : null
        });
      } else {
        // Create a new user
        console.log('Creating new user');
        
        // Generate a unique gameId if not provided
        if (!userData.gameId) {
          // Generate a unique 10-digit ID
          const randomNum = Math.floor(1000000000 + Math.random() * 9000000000);
          userData.gameId = randomNum.toString().substring(0, 10);
          console.log(`Generated new gameId (10 digits): ${userData.gameId}`);
        }
        
        // Generate a default username if not provided
        if (!userData.gameUsername) {
          userData.gameUsername = `Player${Math.floor(Math.random() * 10000)}`;
          console.log(`Generated default username: ${userData.gameUsername}`);
        }
        
        // Log avatar data for debugging
        console.log(`Avatar for new user: ${userData.avatarSrc}`);
        
        // Create new user
        user = await User.create({
          gameId: userData.gameId,
          gameUsername: userData.gameUsername,
          telegramId: userData.telegramId,
          telegramUsername: userData.telegramUsername,
          paypalEmail: userData.paypalEmail || '',
          bestScore: parseInt(userData.bestScore) || 0,
          registrationDate: new Date(),
          lastLogin: new Date(),
          // Ensure the avatar is properly set for new users
          avatarSrc: userData.avatarSrc || 'avatar_default.jpg',
          deviceId: userData.deviceId,
          musicEnabled: userData.musicEnabled !== undefined ? userData.musicEnabled : false
        }, { transaction });
        
        // If there's an active season, create a season score for this user
        if (activeSeason) {
          await SeasonScore.create({
            userId: user.gameId,
            seasonId: activeSeason.id,
            score: parseInt(userData.seasonScore) || 0
          }, { transaction });
          
          console.log(`Created new season score for user ${user.gameId}: ${parseInt(userData.seasonScore) || 0}`);
        }
        
        // Commit the transaction
        await transaction.commit();
        
        // Get user data and ensure avatar path is correctly formatted
        const userJson = user.toJSON();
        
        // Log the avatar path for debugging
        console.log(`Avatar path for new user: ${userJson.avatarSrc}`);
        
        // Make sure avatarSrc is always returned with the correct format
        if (!userJson.avatarSrc) {
          userJson.avatarSrc = '/avatars/avatar_default.jpg';
          console.log('No avatar found, using default');
        } else if (!userJson.avatarSrc.startsWith('/') && !userJson.avatarSrc.startsWith('http')) {
          // If it's just a file name (without path), add the /avatars/ prefix
          userJson.avatarSrc = `/avatars/${userJson.avatarSrc}`;
          console.log(`Fixed avatar path: ${userJson.avatarSrc}`);
        }
        
        // Return created user data
        res.status(201).json({
          message: 'User created successfully',
          user: userJson,
          seasonData: activeSeason ? {
            id: activeSeason.id,
            seasonNumber: activeSeason.seasonNumber,
            endDate: activeSeason.endDate,
            currentScore: userData.seasonScore
          } : null
        });
      }
    } catch (error) {
      // Rollback the transaction in case of error
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error creating/updating user:', error);
    res.status(500).json({ 
      error: 'Error creating/updating user', 
      details: error.message,
      stack: error.stack
    });
  }
});

// API to get seasons
app.get('/api/seasons', async (req, res) => {
  try {
    const seasons = await Season.findAll({
      order: [['seasonNumber', 'DESC']]
    });
    
    console.log('Seasons retrieved:', seasons.map(s => s.toJSON()));
    res.json(seasons);
  } catch (error) {
    console.error('Error retrieving seasons:', error);
    res.status(500).json({ error: 'Error retrieving seasons' });
  }
});

// API to create a new season
app.post('/api/seasons', async (req, res) => {
  try {
    const { seasonNumber, startDate, endDate, prizeMoney, secondPrize, thirdPrize } = req.body;
    const season = await Season.create({
      seasonNumber,
      startDate,
      endDate,
      prizeMoney,
      secondPrize: typeof secondPrize !== 'undefined' ? secondPrize : 0,
      thirdPrize: typeof thirdPrize !== 'undefined' ? thirdPrize : 0
    });
    res.status(201).json(season);
  } catch (error) {
    console.error('Error creating season:', error);
    res.status(500).json({ error: 'Error creating season' });
  }
});

// API to update a season
app.put('/api/seasons/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { seasonNumber, startDate, endDate, prizeMoney, secondPrize, thirdPrize } = req.body;
    const season = await Season.findByPk(id);
    if (!season) {
      return res.status(404).json({ error: 'Season not found' });
    }
    season.seasonNumber = seasonNumber;
    season.startDate = startDate;
    season.endDate = endDate;
    season.prizeMoney = prizeMoney;
    season.secondPrize = typeof secondPrize !== 'undefined' ? secondPrize : 0;
    season.thirdPrize = typeof thirdPrize !== 'undefined' ? thirdPrize : 0;
    await season.save();
    res.json(season);
  } catch (error) {
    console.error('Error updating season:', error);
    res.status(500).json({ error: 'Error updating season' });
  }
});

// API to close a season
app.post('/api/seasons/:id/close', async (req, res) => {
  const { id } = req.params;
  
  try {
    const season = await Season.findByPk(id);
    if (!season) {
      return res.status(404).json({ error: 'Season not found' });
    }
    
    if (season.isClosed) {
      return res.status(400).json({ error: 'This season is already closed' });
    }
    
    // Retrieve the season winner (best score)
    const topScore = await SeasonScore.findOne({
      where: { seasonId: id },
      order: [['score', 'DESC']]
    });
    
    let winnerId = null;
    let winner = null;
    let winnerSeasonScore = null;
    
    if (topScore) {
      winnerId = topScore.userId;
      winner = await User.findByPk(winnerId);
      winnerSeasonScore = topScore.score; // Store the winner's season score
    }
    
    // Update the season
    await season.update({
      isClosed: true,
      isActive: false,
      winnerId
    });
    
    console.log('Season closed successfully:', season.toJSON());
    
    res.json({ 
      message: 'Season closed successfully',
      season,
      winner,
      winnerSeasonScore // Include the winner's season score in the response
    });
  } catch (error) {
    console.error('Error closing season:', error);
    res.status(500).json({ error: 'Error closing season' });
  }
});

// --- FIX: Optimize leaderboard loading by pages ---
// This route replaces the old implementation with a more robust version
app.get('/api/seasons/:seasonId/ranking', async (req, res) => {
  try {
    const { seasonId } = req.params;
    
    console.log(`Fetching ranking for season ${seasonId}`);
    
    // Validation of season ID
    if (!seasonId || isNaN(parseInt(seasonId))) {
      console.error(`Invalid season ID: ${seasonId}`);
      return res.status(400).json({ error: 'Invalid season ID' });
    }
    
    // Support for pagination - with limit required
    const page = parseInt(req.query.page) || 0;
    const limit = Math.min(parseInt(req.query.limit) || 15, 15); // Maximum 15 items par page
    const offset = page * limit;
    
    console.log(`Pagination: page=${page}, limit=${limit}, offset=${offset}`);
    
    // Find the season
    const season = await Season.findByPk(seasonId);
    if (!season) {
      console.error(`Season not found: ${seasonId}`);
      return res.status(404).json({ error: 'Season not found' });
    }
    
    console.log(`Found season: ${season.id} (Season ${season.seasonNumber})`);
    
    // Optimization: Retrieve scores and user details in a single query
    // Manual SQL join for performance optimization
    const query = `
      SELECT ss.*, u.gameUsername, u.avatarSrc
      FROM "SeasonScores" ss
      JOIN "Users" u ON ss.userId = u.gameId
      WHERE ss.seasonId = ?
      ORDER BY ss.score DESC
      LIMIT ? OFFSET ?
    `;
    
    const scores = await sequelize.query(query, {
      replacements: [seasonId, limit, offset],
      type: Sequelize.QueryTypes.SELECT,
      raw: true,
      nest: true
    });
    
    // Transform the results into the expected format
    const ranking = Array.isArray(scores) ? scores.map(score => {
      // Normalize avatar format
      let avatarSrc = score.avatarSrc;
      if (!avatarSrc) {
        avatarSrc = '/avatars/avatar_default.jpg';
      } else if (!avatarSrc.startsWith('/') && !avatarSrc.startsWith('http')) {
        avatarSrc = `/avatars/${avatarSrc}`;
      }
      
      return {
        userId: score.userId,
        username: score.gameUsername || 'Unknown User',
        avatarSrc: avatarSrc,
        score: score.score || 0
      };
    }) : [];
    
    // Add total count for pagination
    const countQuery = `
      SELECT COUNT(*) as count
      FROM "SeasonScores"
      WHERE seasonId = ?
    `;
    const countResult = await sequelize.query(countQuery, {
      replacements: [seasonId],
      type: Sequelize.QueryTypes.SELECT,
    });
    const totalCount = countResult[0]?.count || 0;
    
    console.log(`Found ${ranking.length} users in ranking for season ${seasonId} (page: ${page}), totalCount: ${totalCount}`);
    
    // Return the complete expected structure for the frontend
    res.status(200).json({
      items: ranking,
      pagination: {
        page,
        limit,
        totalCount: parseInt(totalCount, 10),
        offset,
        hasMore: offset + ranking.length < totalCount
      }
    });
  } catch (error) {
    console.error('Error fetching season ranking:', error);
    res.status(500).json({ 
      error: 'Error fetching season ranking', 
      details: error.message 
    });
  }
});

// --- SOLUTION OPTIMISÉE: Calculate user position without loading the list ---
// This route uses an optimized SQL query that simply counts the scores higher than the user's score
app.get('/api/seasons/:seasonId/user-position', async (req, res) => {
  try {
    // Add detailed logs to better diagnose
    console.log(`API /user-position called with parameters: ${JSON.stringify(req.params)} and query: ${JSON.stringify(req.query)}`);
    console.log(`Headers of the request: ${JSON.stringify(req.headers)}`);
    
    const { seasonId } = req.params;
    const { userId } = req.query;
    
    // Enable CORS for all origins and methods
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    
    // Handle OPTIONS method for CORS preflight requests
    if (req.method === 'OPTIONS') {
      console.log('Requête OPTIONS received - respond with CORS headers');
      return res.status(200).end();
    }
    
    // Parameter validation
    if (!userId) {
      console.log('userId missing in the request');
      return res.status(400).json({ 
        error: 'userId query parameter is required',
        position: '-',
        message: 'userId query parameter is required'
      });
    }
    
    if (!seasonId || isNaN(parseInt(seasonId))) {
      console.log(`seasonId invalid: ${seasonId}`);
      return res.status(400).json({ 
        error: 'Invalid season ID',
        position: '-',
        message: 'Invalid season ID'
      });
    }
    
    console.log(`Calculating position for user ${userId} in season ${seasonId}`);
    
    // Check if the season exists
    const season = await Season.findByPk(seasonId);
    if (!season) {
      console.log(`Season not found: ${seasonId}`);
      return res.status(404).json({ 
        error: 'Season not found',
        position: '-',
        message: 'Season not found'
      });
    }
    
    console.log(`Season found: ${season.id} (Season ${season.seasonNumber})`);
    
    // Retrieve the user's score
    const userScore = await SeasonScore.findOne({
      where: { seasonId, userId }
    });
    
    if (!userScore) {
      console.log(`Score not found for user ${userId} in season ${seasonId}`);
      return res.status(200).json({ 
        position: '-', 
        score: 0,
        message: 'No season score found for this user'
      });
    }
    
    console.log(`Score found for user ${userId}: ${userScore.score}`);
    
    // Use COUNT to calculate the rank efficiently - count higher scores
    const rankQuery = `
      SELECT COUNT(*) as higherScores
      FROM "SeasonScores"
      WHERE "seasonId" = ? AND "score" > ?
    `;
    
    console.log(`Executing SQL query: ${rankQuery.replace(/\s+/g, ' ')}`);
    console.log(`Parameters: [${seasonId}, ${userScore.score}]`);
    
    const [rankResult] = await sequelize.query(rankQuery, {
      replacements: [seasonId, userScore.score],
      type: Sequelize.QueryTypes.SELECT
    });
    
    // The position is the number of higher scores + 1
    const position = rankResult.higherScores + 1;
    
    console.log(`User ${userId} is ranked #${position} in season ${seasonId} with a score of ${userScore.score}`);
    
    // Set the content type explicitly and return the result
    res.header('Content-Type', 'application/json');
    res.status(200).json({
      userId,
      position,
      score: userScore.score,
      message: 'User position calculated successfully'
    });
  } catch (error) {
    console.error('Error calculating user position:', error);
    
    // Always return a consistent response, even in case of error
    res.status(500).json({ 
      error: 'Error calculating user position',
      details: error.message,
      position: '-',
      message: 'An error occurred while calculating user position'
    });
  }
});

// Route to fetch the global leaderboard
app.get('/api/global-ranking', async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit) : 100;
  
  try {
    const users = await User.findAll({
      order: [['bestScore', 'DESC']],
      limit
    });
    
    const ranking = users.map(user => {
      // Process avatar path to ensure correct format
      let avatarSrc = user.avatarSrc;
      if (!avatarSrc) {
        avatarSrc = '/avatars/avatar_default.jpg';
      } else if (!avatarSrc.startsWith('/') && !avatarSrc.startsWith('http')) {
        avatarSrc = `/avatars/${avatarSrc}`;
      }
      
      return {
        userId: user.gameId,
        username: user.gameUsername,
        avatarSrc: avatarSrc,
        score: user.bestScore
      };
    });
    
    res.json(ranking);
  } catch (error) {
    console.error('Error retrieving global ranking:', error);
    res.status(500).json({ error: 'Error retrieving global ranking' });
  }
});


// New API endpoint to get season scores
app.get('/api/seasons/:seasonId/scores/:userId', async (req, res) => {
  try {
    const { seasonId, userId } = req.params;
    
    console.log(`Fetching score for user ${userId} in season ${seasonId}`);
    
    // Find the season
    const season = await Season.findByPk(seasonId);
    if (!season) {
      return res.status(404).json({ error: 'Season not found' });
    }
    
    // Log the prize money for debugging
    console.log(`Prize money for season ${season.id}: ${season.prizeMoney}`);
    
    // Find the season score
    const seasonScore = await SeasonScore.findOne({
      where: {
        userId: userId,
        seasonId: seasonId
      }
    });
    
    if (!seasonScore) {
      console.log(`No score found for user ${userId} in season ${seasonId}`);
      return res.status(404).json({ error: 'Season score not found' });
    }
    
    console.log(`Score found for user ${userId} in season ${seasonId}: ${seasonScore.score}`);
    res.status(200).json(seasonScore);
  } catch (error) {
    console.error('Error retrieving season score:', error);
    res.status(500).json({ 
      error: 'Error retrieving season score', 
      details: error.message 
    });
  }
});

// CRITICAL FIX: New API endpoint to explicitly reset a user's season score
app.post('/api/seasons/:seasonId/scores/:userId/reset', async (req, res) => {
  try {
    const { seasonId, userId } = req.params;
    
    // Verify the season exists
    const season = await Season.findByPk(seasonId);
    if (!season) {
      return res.status(404).json({ error: 'Season not found' });
    }
    
    // Start a transaction
    const transaction = await sequelize.transaction();
    
    try {
      // Find or create the season score record
      let [seasonScore, created] = await SeasonScore.findOrCreate({
        where: { seasonId, userId },
        defaults: { score: 0 },
        transaction
      });
      
      if (!created) {
        // If the record already exists, reset the score to 0
        await seasonScore.update({ score: 0 }, { transaction });
      }
      
      // Commit the transaction
      await transaction.commit();
      
      console.log(`Season score explicitly reset to 0 for user ${userId} in season ${seasonId}`);
      
      // Return success
      res.status(200).json({ 
        message: 'Season score reset successfully',
        userId,
        seasonId,
        score: 0
      });
    } catch (error) {
      // Rollback the transaction in case of error
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error resetting season score:', error);
    res.status(500).json({ error: 'Error resetting season score', details: error.message });
  }
});

// API to retrieve a user's scores
app.get('/api/users/:userId/scores', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find the user
    const user = await User.findOne({ where: { gameId: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get the active season
    const activeSeason = await Season.findOne({ where: { isActive: true } });
    
    // Prepare response with global best score
    const response = {
      bestScore: user.bestScore || 0,
      seasonScore: 0 // Always default to 0
    };
    
    // If there's an active season, get the user's season score
    if (activeSeason) {
      // IMPORTANT FIX: Always ensure we have a valid season score record
      let [seasonScore, created] = await SeasonScore.findOrCreate({
        where: { userId: user.gameId, seasonId: activeSeason.id },
        defaults: { score: 0 }
      });
      
      // Extra safeguard: If this is a new season (indicated by creation of record),
      // ensure the score is set to 0
      if (created) {
        console.log(`Created new season score record for ${userId} in season ${activeSeason.id}`);
      }
      
      response.seasonScore = seasonScore.score;
      
      response.activeSeason = {
        id: activeSeason.id,
        seasonNumber: activeSeason.seasonNumber,
        endDate: activeSeason.endDate
      };
    }
    
    console.log(`Scores fetched for user ${userId}:`, response);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching user scores:', error);
    res.status(500).json({ error: 'Error fetching user scores', details: error.message });
  }
});

// New API endpoint to get user preferences
app.get('/api/users/:userId/preferences', async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`Fetching preferences for user ${userId}`);
    
    // Find the user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Return user preferences
    res.status(200).json({
      musicEnabled: user.musicEnabled || false
    });
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    res.status(500).json({ 
      error: 'Error fetching user preferences', 
      details: error.message 
    });
  }
});

// New API endpoint to save user preferences
app.post('/api/users/preferences', async (req, res) => {
  try {
    const { userId, musicEnabled } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    console.log(`Saving preferences for user ${userId}: musicEnabled=${musicEnabled}`);
    
    // Find the user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update user preferences
    await user.update({
      musicEnabled: musicEnabled !== undefined ? musicEnabled : user.musicEnabled
    });
    
    // Return success
    res.status(200).json({
      message: 'Preferences saved successfully',
      preferences: {
        musicEnabled: user.musicEnabled
      }
    });
  } catch (error) {
    console.error('Error saving user preferences:', error);
    res.status(500).json({ 
      error: 'Error saving user preferences', 
      details: error.message 
    });
  }
});

// API endpoint for admin to get all users with pagination
app.get('/api/users', async (req, res) => {
  try {
    // Parse query parameters with fallbacks
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    console.log(`Admin fetching users - Page: ${page}, Limit: ${limit}`);
    
    // CRITICAL FIX: Check database connection before querying
    if (sequelize.connectionManager.hasOwnProperty('pool') && 
        !sequelize.connectionManager.pool.hasOwnProperty('_closed') && 
        !sequelize.connectionManager.pool._closed) {
      console.log('Database connection is open');
    } else {
      console.error('Database connection appears to be closed');
      // Don't throw, continue with attempt to query
    }
    
    // Get total count of users with error handling
    let totalUsers = 0;
    try {
      totalUsers = await User.count();
      console.log(`User count successful: ${totalUsers} users`);
    } catch (countError) {
      console.error('Error counting users:', countError);
      // Continue with totalUsers = 0
    }
    
    // Get users with pagination and error handling
    let users = [];
    try {
      users = await User.findAll({
        order: [['lastLogin', 'DESC']],
        limit: limit,
        offset: offset
      });
      console.log(`Successfully retrieved ${users.length} users`);
    } catch (findError) {
      console.error('Error finding users:', findError);
      // Continue with empty users array
    }
    
    // Format the response with comprehensive error handling
    let formattedUsers = [];
    try {
      if (Array.isArray(users)) {
        formattedUsers = users.map(user => {
          try {
            if (!user || typeof user.toJSON !== 'function') {
              console.error('Invalid user object:', user);
              return {
                gameId: 'error',
                gameUsername: 'Invalid user data',
                bestScore: 0,
                lastLogin: new Date().toLocaleString()
              };
            }
            
            const userData = user.toJSON();
            
            // Format dates for better readability with error handling
            try {
              if (userData.createdAt) {
                userData.createdAt = new Date(userData.createdAt).toLocaleString();
              }
            } catch (dateError) {
              console.error('Error formatting createdAt date:', dateError);
              userData.createdAt = 'Invalid date';
            }
            
            try {
              if (userData.lastLogin) {
                userData.lastLogin = new Date(userData.lastLogin).toLocaleString();
              }
            } catch (dateError) {
              console.error('Error formatting lastLogin date:', dateError);
              userData.lastLogin = 'Invalid date';
            }
            
            return userData;
          } catch (userError) {
            console.error('Error formatting user:', userError);
            // Return a minimal valid user object to prevent errors
            return {
              gameId: 'error',
              gameUsername: 'Error processing user',
              bestScore: 0,
              lastLogin: new Date().toLocaleString()
            };
          }
        });
      } else {
        console.error('Users is not an array:', users);
      }
    } catch (mapError) {
      console.error('Error mapping users:', mapError);
      // Continue with empty formattedUsers array
    }
    
    console.log(`Final formatted users count: ${formattedUsers.length}`);
    
    // CRITICAL: admin.js expects this exact structure at lines 294-298
    // The error occurs at line 325 in admin.js where it checks users.length
    // So we MUST ensure users is a valid array
    const responseData = {
      users: Array.isArray(formattedUsers) ? formattedUsers : [],
      total: totalUsers || 0,
      totalPages: Math.ceil((totalUsers || 0) / limit)
    };
    
    console.log(`Sending response with ${responseData.users.length} users, total: ${responseData.total}, pages: ${responseData.totalPages}`);
    
    return res.status(200).json(responseData);
  } catch (error) {
    console.error('Error in /api/users endpoint:', error);
    // Even in error case, return a valid response structure
    // This is critical to prevent the TypeError in admin.js
    return res.status(200).json({ 
      users: [], // Must be an array to prevent users.length error
      total: 0,
      totalPages: 0
    });
  }
});


// API endpoint for admin to get active season (alternative endpoint for compatibility)
app.get('/api/active-season', async (req, res) => {
  try {
    console.log('Admin fetching active season');
    
    // Find the active season
    const activeSeason = await Season.findOne({ 
      where: { isActive: true }
    });
    
    if (!activeSeason) {
      console.log('No active season found');
      return res.status(404).json({ error: 'No active season found' });
    }
    
    console.log(`Active season found: ${activeSeason.id}, Season ${activeSeason.seasonNumber}`);
    res.status(200).json(activeSeason);
  } catch (error) {
    console.error('Error retrieving active season:', error);
    res.status(500).json({ 
      error: 'Error retrieving active season', 
      details: error.message 
    });
  }
});

// API endpoint to create or update a season score
app.post('/api/seasons/:seasonId/scores', async (req, res) => {
  try {
    const { seasonId } = req.params;
    const { userId, score } = req.body;
    
    console.log(`Creating/updating score for user ${userId} in season ${seasonId}`);
    
    // Validate required fields
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Find the season
    const season = await Season.findByPk(seasonId);
    if (!season) {
      return res.status(404).json({ error: 'Season not found' });
    }
    
    // Log the prize money for debugging
    console.log(`Prize money for season ${season.id}: ${season.prizeMoney}`);
    
    // Find the user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Find or create the season score
    const [seasonScore, created] = await SeasonScore.findOrCreate({
      where: {
        userId: userId,
        seasonId: seasonId
      },
      defaults: {
        score: score || 0
      }
    });
    
    // If not created, update the score if the new score is higher
    if (!created && score > seasonScore.score) {
      await seasonScore.update({ score });
      console.log(`Updated score for user ${userId} in season ${seasonId}: ${score}`);
    } else if (created) {
      console.log(`Created new score for user ${userId} in season ${seasonId}: ${score || 0}`);
    } else {
      console.log(`No update needed for user ${userId} in season ${seasonId}`);
    }
    
    res.status(created ? 201 : 200).json(seasonScore);
  } catch (error) {
    console.error('Error creating/updating season score:', error);
    res.status(500).json({ 
      error: 'Error creating/updating season score', 
      details: error.message 
    });
  }
});

// API to delete a season
app.delete('/api/seasons/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    // Check if the season exists
    const season = await Season.findByPk(id);
    if (!season) {
      return res.status(404).json({ error: 'Season not found' });
    }
    
    // Temporarily disable foreign key constraints
    await sequelize.query('PRAGMA foreign_keys = OFF;');
    
    try {
      // Delete associated season scores
      await sequelize.query('DELETE FROM "SeasonScores" WHERE "seasonId" = ?', {
        replacements: [id]
      });
      
      // Delete the season
      await sequelize.query('DELETE FROM "Seasons" WHERE "id" = ?', {
        replacements: [id]
      });
      
      // Reactivate foreign key constraints
      await sequelize.query('PRAGMA foreign_keys = ON;');
      
      console.log(`Season ${id} deleted successfully`);
      res.status(200).json({ message: 'Season deleted successfully' });
    } catch (innerError) {
      // Reactivate foreign key constraints even in case of error
      await sequelize.query('PRAGMA foreign_keys = ON;');
      throw innerError;
    }
  } catch (error) {
    console.error('Error deleting season:', error);
    res.status(500).json({ 
      error: 'Error deleting season', 
      details: error.message,
      stack: error.stack
    });
  }
});

// Route to retrieve a user's season score
app.get('/api/seasons/:seasonId/scores/:userId', async (req, res) => {
  try {
    const { seasonId, userId } = req.params;
    
    // Check if the season exists
    const season = await Season.findByPk(seasonId);
    if (!season) {
      return res.status(404).json({ error: 'Season not found' });
    }
    
    // Retrieve the user's season score
    const seasonScore = await SeasonScore.findOne({
      where: { 
        seasonId: seasonId,
        userId: userId
      }
    });
    
    if (!seasonScore) {
      // If no score is found, return 0
      return res.json({ score: 0 });
    }
    
    console.log(`Retrieved season score for user ${userId} in season ${seasonId}: ${seasonScore.score}`);
    res.json({ score: seasonScore.score });
  } catch (error) {
    console.error('Error retrieving season score:', error);
    res.status(500).json({ 
      error: 'Error retrieving season score', 
      details: error.message
    });
  }
});

// CRITICAL FIX: New API endpoint to explicitly reset a user's season score
app.post('/api/seasons/:seasonId/scores/:userId/reset', async (req, res) => {
  try {
    const { seasonId, userId } = req.params;
    
    // Verify the season exists
    const season = await Season.findByPk(seasonId);
    if (!season) {
      return res.status(404).json({ error: 'Season not found' });
    }
    
    // Start a transaction
    const transaction = await sequelize.transaction();
    
    try {
      // Find or create the season score record
      let [seasonScore, created] = await SeasonScore.findOrCreate({
        where: { seasonId, userId },
        defaults: { score: 0 },
        transaction
      });
      
      if (!created) {
        // If the record already exists, reset the score to 0
        await seasonScore.update({ score: 0 }, { transaction });
      }
      
      // Commit the transaction
      await transaction.commit();
      
      console.log(`Season score explicitly reset to 0 for user ${userId} in season ${seasonId}`);
      
      // Return success
      res.status(200).json({ 
        message: 'Season score reset successfully',
        userId,
        seasonId,
        score: 0
      });
    } catch (error) {
      // Rollback the transaction in case of error
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error resetting season score:', error);
    res.status(500).json({ error: 'Error resetting season score', details: error.message });
  }
});

// API for getting the persistent How To Play link
app.get('/api/how-to-play-link', async (req, res) => {
  try {
    const row = await HowToPlayLink.findOne({ where: { id: 1 } });
    res.json({ url: row ? row.url : '' });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch How To Play link' });
  }
});
// API for setting the persistent How To Play link
app.post('/api/how-to-play-link', express.json(), async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string' || !/^https:\/\/(www\.)?youtube\.com\//.test(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }
    let row = await HowToPlayLink.findOne({ where: { id: 1 } });
    if (!row) {
      row = await HowToPlayLink.create({ url });
    } else {
      row.url = url;
      await row.save();
    }
    res.json({ success: true, url });
  } catch (err) {
    res.status(500).json({ error: 'Could not save How To Play link' });
  }
});

// Serve promo images statically from /var/lib/tidash_promo
const promoDir = '/var/lib/tidash_promo';
if (!fs.existsSync(promoDir)) {
  fs.mkdirSync(promoDir, { recursive: true });
}
app.use('/promo-images', express.static(promoDir));

// API: Get promo banner
app.get('/api/promo-banner', async (req, res) => {
  try {
    const row = await PromotionBanner.findOne({ where: { id: 1 } });
    if (!row || !row.imageFilename) return res.json({ imageUrl: '', link: '' });
    res.json({ imageUrl: `/promo-images/${row.imageFilename}`, link: row.link || '' });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch promo banner' });
  }
});
// API: Set promo banner (image + link)
const multer = require('multer');
const upload = multer({ dest: promoDir });
app.post('/api/promo-banner', upload.single('image'), async (req, res) => {
  try {
    const link = req.body.link || '';
    let imageFilename = '';
    if (req.file) {
      // Rename file to original name + timestamp
      const ext = req.file.originalname.split('.').pop();
      imageFilename = `promo_${Date.now()}.${ext}`;
      fs.renameSync(req.file.path, `${promoDir}/${imageFilename}`);
    }
    let row = await PromotionBanner.findOne({ where: { id: 1 } });
    if (!row) {
      row = await PromotionBanner.create({ imageFilename, link });
    } else {
      // If new image uploaded, delete old one
      if (imageFilename && row.imageFilename && fs.existsSync(`${promoDir}/${row.imageFilename}`)) {
        try { fs.unlinkSync(`${promoDir}/${row.imageFilename}`); } catch (e) {}
      }
      if (imageFilename) row.imageFilename = imageFilename;
      if (link) row.link = link;
      await row.save();
    }
    res.json({ success: true, imageUrl: imageFilename ? `/promo-images/${imageFilename}` : '', link });
  } catch (err) {
    res.status(500).json({ error: 'Could not save promo banner' });
  }
});


// NEW API SPECIFIC FOR STRICT PAGINATION OF LEADERBOARD
app.get('/api/leaderboard/paginated/:seasonId', async (req, res) => {
  try {
    const { seasonId } = req.params;
    const page = parseInt(req.query.page) || 0;
    const limit = Math.min(parseInt(req.query.limit) || 15, 15); // Hard limit at 15 items per page
    const offset = page * limit;
    
    console.log('START PAGINATION');
    console.log(`FULL URL CALLED: ${req.originalUrl}`);
    console.log(`METHOD: ${req.method}`);
    console.log(`PARAMS: ${JSON.stringify(req.params)}`);
    console.log(`QUERY: ${JSON.stringify(req.query)}`);
    console.log(`PAGINATION: page=${page}, limit=${limit}, offset=${offset}`);
    
    // Validation of season ID
    if (!seasonId || isNaN(parseInt(seasonId))) {
      console.error(`INVALID SEASON ID: ${seasonId}`);
      return res.status(400).json({ error: 'Invalid season ID' });
    }
    
    // Find the season
    const season = await Season.findByPk(seasonId);
    if (!season) {
      console.error(`SEASON NOT FOUND: ${seasonId}`);
      return res.status(404).json({ error: 'Season not found' });
    }
    
    console.log(`SEASON FOUND: ID=${season.id}, Numéro=${season.seasonNumber}`);
    
    // Get the total number of records for this season (for debugging)
    const totalCount = await SeasonScore.count({ where: { seasonId } });
    console.log(`TOTAL SCORES FOR THIS SEASON: ${totalCount}`);
    
    // Use direct SQL query with LIMIT and OFFSET for strict pagination
    const query = `
      SELECT ss.id, ss.userId, ss.score, u.gameUsername, u.avatarSrc
      FROM "SeasonScores" ss
      JOIN "Users" u ON ss.userId = u.gameId
      WHERE ss.seasonId = ?
      ORDER BY ss.score DESC
      LIMIT ? OFFSET ?
    `;
    
    console.log(`SQL QUERY: ${query.replace(/\s+/g, ' ')}`);
    console.log(`PARAMETERS: [${seasonId}, ${limit}, ${offset}]`);
    
    // Capture the time before the query
    const startTime = Date.now();
    
    const [scores] = await sequelize.query(query, {
      replacements: [seasonId, limit, offset],
      type: Sequelize.QueryTypes.SELECT,
      raw: true
    });
    
    // Calculate execution time
    const execTime = Date.now() - startTime;
    console.log(`EXECUTION TIME: ${execTime}ms`);
    
    // Log the actual number of results
    console.log(`PAGINATED RESULTS: ${scores ? scores.length : 0} users`);
    
    if (scores && scores.length > 0) {
      console.log(`FIRST RESULT: ${JSON.stringify(scores[0])}`);
      console.log(`LAST RESULT: ${JSON.stringify(scores[scores.length - 1])}`);
    } else {
      console.log(`NO RESULTS FOUND FOR THIS PAGE`);
    }
    
    // Transform data to expected format
    const ranking = Array.isArray(scores) ? scores.map(score => {
      // Normalize avatar path
      let avatarSrc = score.avatarSrc;
      if (!avatarSrc) {
        avatarSrc = '/avatars/avatar_default.jpg';
      } else if (!avatarSrc.startsWith('/') && !avatarSrc.startsWith('http')) {
        avatarSrc = `/avatars/${avatarSrc}`;
      }
      
      return {
        userId: score.userId,
        username: score.gameUsername || 'Unknown User',
        avatarSrc: avatarSrc,
        score: score.score || 0
      };
    }) : [];
    
    // Prepare the response
    const response = {
      items: ranking,
      pagination: {
        page: page,
        limit: limit,
        totalCount: totalCount,
        offset: offset,
        hasMore: ranking.length === limit // If we got less than requested, there are no more
      }
    };
    
    console.log(`RESPONSE SENT: ${ranking.length} items, hasMore=${response.pagination.hasMore}`);
    console.log('END API PAGINATION');
    
    // Return paginated data with pagination metadata
    res.status(200).json(response);
  } catch (error) {
    console.error('ERROR API PAGINATION:', error);
    console.error(`STACK TRACE: ${error.stack}`);
    
    res.status(500).json({ 
      error: 'Error fetching paginated leaderboard', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});


// START SERVER
app.listen(port, '0.0.0.0', () => {
  console.log(`Server started on port ${port}`);
});

// Graceful shutdown handling
process.once('SIGINT', () => {
  bot.stop('SIGINT');
  process.exit(0);
});
process.once('SIGTERM', () => {
  bot.stop('SIGTERM');
  process.exit(0);
});

console.log('TiDash Game Bot is running...');

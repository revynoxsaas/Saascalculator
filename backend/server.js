// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js'; // Supabase client library
import companyDetailRouter from './routes/companydetail.js'; // Your API routes for company details
import path from 'path'; // Node.js path module for resolving file paths
import { fileURLToPath } from 'url'; // Utility to get __filename in ES Modules

// --- Global Error Handlers (Crucial for catching unhandled errors that crash the process) ---
// Catches synchronous errors that are not caught by try/catch blocks
process.on('uncaughtException', (err) => {
  console.error('\n!!! UNCAUGHT EXCEPTION CAUGHT !!!');
  console.error('This is a synchronous error that was not handled. Server shutting down...');
  console.error('Error details:', err);
  console.error('Stack Trace:', err.stack); // Print stack trace for better debugging
  console.error('Server will now exit with code 1.');
  process.exit(1); // Exit the process with a failure code
});

// Catches asynchronous errors (e.g., rejected Promises) that are not handled
process.on('unhandledRejection', (reason, promise) => {
  console.error('\n!!! UNHANDLED PROMISE REJECTION CAUGHT !!!');
  console.error('This is an asynchronous error that was not handled. Server shutting down...');
  console.error('Reason:', reason);
  console.error('Promise:', promise);
  console.error('Server will now exit with code 1.');
  process.exit(1); // Exit the process with a failure code
});
// --- End Global Error Handlers ---

dotenv.config(); // Load environment variables from the .env file

const app = express();
const PORT = process.env.PORT || 8000; // Get port from .env or default to 8000

// Get __dirname equivalent for ES Modules (needed for path.join if you were serving static files)
// Although static image serving for email is removed, keeping these for potential future needs.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Environment Variable Loading and Validation ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('--- Server Startup Trace (Detailed) ---');
console.log('1. Loading environment variables...');
console.log('   SUPABASE_URL:', supabaseUrl ? supabaseUrl : 'NOT LOADED');
console.log('   SUPABASE_SERVICE_ROLE_KEY (snippet):', supabaseServiceRoleKey ? supabaseServiceRoleKey.substring(0, 10) + '...' : 'NOT LOADED');
console.log('   PORT:', PORT); // Log the actual port being used

// Critical check: Ensure Supabase credentials are available before proceeding
if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("CRITICAL ERROR: Supabase URL or Service Role Key is missing in .env file. Please check your .env configuration.");
  process.exit(1); // Exit the application if essential variables are missing
}

// --- Supabase Client Initialization ---
let supabase;
console.log('2. Attempting to initialize Supabase client...');
try {
  // Initialize Supabase client using the Service Role Key for full backend privileges
  supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  console.log('   Supabase client object created.');

  // Basic synchronous check to ensure the client object has expected methods
  if (typeof supabase.from !== 'function') {
      throw new Error("Supabase client object is malformed (missing 'from' method). This might indicate a problem with the Supabase JS library or its initialization.");
  }
  console.log('   Supabase client basic method check passed.');

  // Initiate a dummy async query to test connectivity.
  // This helps catch potential issues with the connection to Supabase during startup.
  console.log('   Initiating async dummy Supabase query for health check...');
  supabase.from('dummy_table_for_health_check').select('*').limit(0) // Use a non-existent or dummy table
    .then(() => {
      console.log('   Dummy Supabase query (async) completed successfully.');
    })
    .catch(err => {
      // If this dummy query fails, it means there's an issue with Supabase connectivity
      // (e.g., incorrect URL, network firewall, RLS issues if using anon key, etc.)
      console.error('   Dummy Supabase query (async) FAILED:', err.message);
      // Note: This is an async error, so it will be caught by the unhandledRejection handler
      // if not explicitly handled here. Logging it here gives immediate context.
    });
  console.log('   Supabase client initialized and async health check initiated.');

} catch (err) {
  // Catch any synchronous errors during Supabase client creation
  console.error("CRITICAL ERROR: Failed to initialize or verify Supabase client synchronously.");
  console.error("Error details:", err);
  process.exit(1); // Exit the application if Supabase client cannot be set up
}

// --- Express Middleware Setup ---
console.log('3. Applying Express middleware...');
app.use(cors({
  origin: 'https://saascalculator.revynox.com', // your Vercel frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json()); // Parse incoming JSON request bodies

// --- Static File Serving (REMOVED for email image, as it's now Cloudinary) ---
// If you still need to serve other static files from your backend, you'd add:
// app.use('/static', express.static(path.join(__dirname, 'public')));
// The specific app.use('/images', express.static(...)) is removed as the email logo is external.


// --- API Route Configuration ---
console.log('4. Setting up API routes...');
// Pass the initialized Supabase client to your companyDetailRouter.
// The router function will then use this client to interact with the database.
app.use('/api/companydetail', companyDetailRouter(supabase));

// Basic root route to confirm the API is running
app.get('/', (req, res) => {
  res.send('API is running...');
});

// --- Server Listener Setup ---
console.log('5. Attempting to start server listener on port', PORT, '...');
const server = app.listen(PORT, () => {
  console.log('6. Inside app.listen callback: Server reports it is listening.');
  console.log(`   Server is running on port ${PORT}.`); // Final confirmation of port
  console.log('   Checking server.listening status immediately:', server.listening); // Verify server state
  console.log('--- Server ready to receive requests (according to callback) ---');
});

// --- Crash Detector (for debugging rapid synchronous crashes after listen) ---
// This timeout will check if the server is still listening after a delay.
// If not, it forces an exit and logs a warning, indicating a post-listen crash.
const crashDetectorTimeout = setTimeout(() => {
  if (!server.listening) {
    console.error("\n!!! CRASH DETECTED AFTER LISTEN CALLBACK !!!");
    console.error("Server's 'listening' state became false or process terminated without an explicit error being caught by global handlers immediately after app.listen returned.");
    process.exit(1);
  } else {
    // If server is still listening after the timeout, disarm the detector
    console.log("\nServer is still listening after 5 seconds. Crash detector disarmed.");
  }
}, 5000); // 5-second timeout

// --- Server Event Listeners (for graceful shutdown and error reporting) ---
server.on('close', () => {
  console.log('\nServer has closed gracefully.');
  clearTimeout(crashDetectorTimeout); // Clear crash detector if server closes normally
});

// Catch errors that occur during the server listening process (e.g., port already in use)
server.on('error', (err) => {
  console.error('\n!!! EXPRESS SERVER ERROR EVENT CAUGHT !!!');
  console.error('An error occurred during the server listening phase.');
  console.error('Error details:', err);
  process.exit(1); // Exit the application on server errors
});

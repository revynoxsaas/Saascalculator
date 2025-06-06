// test-server.js
import express from 'express';
import cors from 'cors'; // Keep cors just in case it's a factor, though unlikely for this issue

const app = express();
const PORT = 8000; // Hardcode port for simplicity

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Test API is running...');
});

app.listen(PORT, () => {
  console.log(`Test server is running on port ${PORT}`);
});

console.log("Attempting to start test server...");
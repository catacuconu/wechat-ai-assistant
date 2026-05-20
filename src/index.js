import Wechaty from 'wechaty';
import { OpenAI } from 'openai';
import { config } from '../config.js';
import fs from 'fs';
import path from 'path';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

// Initialize data directory
const dataDir = './data';
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// File paths
const tasksFile = path.join(dataDir, 'tasks.json');
const conversationsFile = path.join(dataDir, 'conversations.json');

// Initialize files if they don't exist
if (!fs.existsSync(tasksFile)) {
  fs.writeFileSync(tasksFile, JSON.stringify([], null, 2));
}
if (!fs.existsSync(conversationsFile)) {
  fs.writeFileSync(conversationsFile, JSON.stringify([], null, 2));
}

// Load tasks from file
function loadTasks() {
  try {
    const data = fs.readFileSync(tasksFile, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error loading tasks:', err);
    return [];
  }
}

// Save tasks to file
function saveTasks(tasks) {
  try {
    fs.writeFileSync(tasksFile, JSON.stringify(tasks, null, 2));
  } catch (err) {
    console.error('Error saving tasks:', err);
  }
}

// Extract tasks using OpenAI
async function extractTasks(message) {
  try {
    const response = await openai.chat.completions.create({
      model: config.openai.model,
      messages: [
        {
          role: 'system',
          content: config.taskExtraction.systemPrompt,
        },
        {
          role: 'user',
          content: message,
        },
      ],
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    
    // Try to parse JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return [];
  } catch (err) {
    console.error('Error extracting tasks:', err);
    return [];
  }
}

// Initialize Wechaty bot
const bot = new Wechaty({
  name: 'wechat-ai-assistant',
});

bot.on('scan', (qrcode, status) => {
  console.log(`\n[${new Date().toLocaleTimeString()}] Scan QR Code to login: ${status}\n`);
  console.log(qrcode);
});

bot.on('login', (user) => {
  console.log(`\n[${new Date().toLocaleTimeString()}] User logged in: ${user.name}\n`);
});

bot.on('logout', (user) => {
  console.log(`\n[${new Date().toLocaleTimeString()}] User logged out: ${user.name}\n`);
});

bot.on('message', async (msg) => {
  if (msg.self()) {
    return; // Ignore self messages
  }

  const text = msg.text();
  const from = msg.from();
  
  console.log(`[${new Date().toLocaleTimeString()}] Message from ${from.name()}: ${text}`);

  try {
    // Extract tasks from the message
    const tasks = await extractTasks(text);
    
    if (tasks.length > 0) {
      // Save tasks
      const allTasks = loadTasks();
      const newTasks = tasks.map(task => ({
        ...task,
        id: Date.now() + Math.random(),
        createdAt: new Date().toISOString(),
        from: from.name(),
        source: 'wechat',
      }));
      
      saveTasks([...allTasks, ...newTasks]);
      
      // Send confirmation message
      await msg.say(`✅ Found ${tasks.length} task(s):\n${tasks.map(t => `• ${t.title}`).join('\n')}`);
      
      console.log(`Tasks extracted and saved:`, newTasks);
    }
  } catch (err) {
    console.error('Error processing message:', err);
    await msg.say('❌ Error processing your message. Please try again.');
  }
});

bot.on('error', (err) => {
  console.error('Bot error:', err);
});

// Start the bot
bot.start().catch(err => {
  console.error('Failed to start bot:', err);
  process.exit(1);
});

console.log('WeChat AI Assistant is starting...');

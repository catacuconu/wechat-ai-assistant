export const config = {
  // OpenAI API Configuration
  openai: {
    apiKey: 'your-api-key-here',
    model: 'gpt-4',
  },

  // WeChat Bot Configuration
  wechat: {
    // Puppet service for Wechaty
    puppetService: 'wechaty-puppet-wechat4u',
  },

  // Task Extraction Configuration
  taskExtraction: {
    // Prompt for GPT to extract tasks from messages
    systemPrompt: `You are a task extraction assistant. When given a WeChat message or conversation, extract any tasks, reminders, or action items mentioned. 
    
    For each task, provide:
    - Title: Brief description of the task
    - Description: More details if available
    - Priority: high, medium, or low
    - DueDate: If mentioned, extract the due date
    
    Return the response as a JSON array of tasks. If no tasks are found, return an empty array.`,
  },

  // Storage Configuration
  storage: {
    // File-based storage for tasks (JSON)
    tasksFile: './data/tasks.json',
    conversationsFile: './data/conversations.json',
  },

  // Logging
  debug: true,
};

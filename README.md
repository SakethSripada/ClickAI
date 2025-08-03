# ClickAI - Free AI Browser Extension

A powerful browser extension that provides instant AI assistance directly in your browser. Highlight text, capture screen areas with OCR, or use voice input to get AI-powered answers without leaving your current tab.

## ✨ Features

- **Text Selection**: Right-click any selected text to get AI analysis
- **Screen Capture with OCR**: Select any area of your screen and extract text for AI processing
- **Voice Input**: Use speech recognition for hands-free queries
- **Floating Chat**: Resizable, dockable chat interface that works on any website
- **Dark/Light Theme**: Toggle between themes with automatic persistence
- **Continuous Conversations**: Keep context across multiple queries
- **Math Rendering**: Supports LaTeX math expressions
- **Code Highlighting**: Syntax highlighting for code blocks
- **Cross-Platform**: Works on Chrome, Edge, and other Chromium-based browsers

## 🚀 Quick Start

### Option 1: Use the Published Extension (Recommended)

Install ClickAI from the Chrome Web Store and start using AI assistance immediately:

**[Install ClickAI from Chrome Web Store](https://chromewebstore.google.com/detail/clickai/baflaglcfkdecjepfinegoklkfaeongi)**

The published extension includes a hosted backend service, so you can start using AI assistance immediately. You can also add your own OpenAI API key directly in the extension settings for full control over your AI interactions.

### Option 2: Self-Hosted Setup (Advanced)

If you prefer to host your own backend server and have complete control over the infrastructure, follow the instructions below:

#### Browser Extension Setup

1. **Download the Extension**
   ```bash
   git clone https://github.com/SakethSripada/ClickAI.git
   cd clickai
   npm install
   ```

2. **Build the Extension**
   ```bash
   npm run build
   ```

3. **Load Unpacked Extension**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the `dist` folder
   - Pin the extension to your toolbar for easy access

#### Server Deployment

##### Option 1: Railway (Recommended)

1. Fork this repository
2. Connect your GitHub account to [Railway](https://railway.app)
3. Create a new project and deploy from your forked repository
4. Set the following environment variables in Railway:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `EXTENSION_SECRET`: A secure random string (32+ characters)
   - `PORT`: 5010 (or leave empty for Railway's default)

##### Option 2: Heroku

1. Install the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
2. Create a new Heroku app:
   ```bash
   heroku create your-app-name
   ```
3. Set environment variables:
   ```bash
   heroku config:set OPENAI_API_KEY=your_openai_api_key
   heroku config:set EXTENSION_SECRET=your_secure_secret_string
   ```
4. Deploy:
   ```bash
   git subtree push --prefix server heroku main
   ```

##### Option 3: Self-Hosted (VPS/Docker)

1. **Direct Node.js Deployment**
   ```bash
   cd server
   npm install
   npm start
   ```

2. **Docker Deployment**
   ```bash
   cd server
   docker build -t clickai-server .
   docker run -p 5010:5010 --env-file .env clickai-server
   ```

## 🔧 Configuration

### Required Environment Variables

Create a `.env` file in both the root directory and the `server` directory:

#### Root `.env` (for extension build)
```
EXTENSION_SECRET=your_secure_random_string_here
BASE_URL=your-deployed-server-url.com
```

#### Server `.env` (for backend)
```
OPENAI_API_KEY=sk-proj-your_openai_api_key_here
EXTENSION_SECRET=your_secure_random_string_here
PORT=5010
```

### Environment Variable Details

- **OPENAI_API_KEY**: Get this from [OpenAI's platform](https://platform.openai.com/api-keys)
- **EXTENSION_SECRET**: A secure random string (32+ characters) that authenticates requests between the extension and server
- **BASE_URL**: Your deployed server's URL (without `https://` or trailing slash)
- **PORT**: Server port (default: 5010)

### Generating a Secure Extension Secret

```bash
# Option 1: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 2: Using OpenSSL
openssl rand -hex 32

# Option 3: Online generator
# Visit: https://www.allkeysgenerator.com/Random/Security-Encryption-Key-Generator.aspx
```

## 📁 Project Structure

```
clickai/
├── src/                          # Extension frontend source
│   ├── Components/               # React components
│   │   ├── AIResponseAlert.jsx  # Main chat interface
│   │   ├── ChatHeader.jsx       # Header with controls
│   │   ├── ChatContent.jsx      # Message display area
│   │   ├── ChatFooter.jsx       # Input area
│   │   ├── SnippingTool.jsx     # Screen capture tool
│   │   ├── PromptBox.jsx        # Additional prompt input
│   │   ├── MessageBubble.jsx    # Individual message display
│   │   └── CodeBlock.jsx        # Code syntax highlighting
│   ├── utils.js                 # Utility functions
│   ├── App.js                   # Main app component
│   └── index.js                 # Entry point
├── public/                      # Extension assets
│   ├── manifest.json            # Extension manifest
│   ├── background.js            # Background script
│   ├── content.js               # Content script
│   └── ...                     # Icons and other assets
├── server/                      # Backend server
│   ├── server.js                # Express server
│   └── .env                     # Server environment variables
├── dist/                        # Built extension (generated)
├── webpack.config.js            # Build configuration
├── zipDist.js                   # Distribution packaging
└── package.json                 # Dependencies and scripts
```

## 🔨 Development

### Local Development Setup

1. **Start the development server:**
   ```bash
   npm start
   ```

2. **Start the backend server:**
   ```bash
   cd server
   npm install
   npm start
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

4. **Create distribution package:**
   ```bash
   node zipDist.js
   ```

### Testing the Extension

1. Load the unpacked extension in Chrome
2. Navigate to any website
3. Try these features:
   - Right-click selected text → "Ask ClickAI about..."
   - Right-click anywhere → "Select area and send to ClickAI"
   - Click the extension icon for the popup interface
   - Use voice input by clicking the microphone icon

## 🛠️ Customization

### Modifying AI Behavior

Edit the server's OpenAI integration in `server/server.js`:
- Adjust temperature for creativity vs consistency
- Modify system prompts
- Change model from GPT-4 to GPT-3.5-turbo for cost savings

### UI Customization

- Component styles are in `src/Components/Styles/`
- Theme colors can be modified in the Material-UI theme configuration
- Extension icons are in `public/imgs/`

### Adding Features

The modular architecture makes it easy to add new features:
1. Create new React components in `src/Components/`
2. Add message handlers in `public/background.js`
3. Extend the content script in `public/content.js`

## 📝 API Usage

The extension communicates with the backend via HTTP POST requests:

```javascript
// Example API call structure
const response = await fetch(`https://${BASE_URL}/api/chat`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-extension-secret': EXTENSION_SECRET
  },
  body: JSON.stringify({
    messages: conversationHistory,
    temperature: 0.7
  })
});
```

## 🔒 Security

- All requests are authenticated with a shared secret
- Rate limiting prevents abuse (100 requests per 15 minutes per IP)
- CORS is configured for security
- Helmet.js provides additional security headers
- No sensitive data is stored in the extension

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Submit a pull request with a clear description

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: Report bugs or request features on GitHub
- **Documentation**: Check this README for setup and configuration
- **Community**: Join our discussions in the GitHub repository

## 🎯 Roadmap

- [ ] Support for more AI providers (Claude, Gemini)
- [ ] Offline OCR capabilities
- [ ] Custom prompt templates
- [ ] Integration with productivity tools
- [ ] Mobile browser support

---

**Made with ❤️ for developers who want AI assistance without the hassle**

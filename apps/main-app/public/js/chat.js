// LLM Tools Real Estate Agent - Chat Interface

class ChatInterface {
  constructor() {
    this.messageContainer = document.getElementById('messages');
    this.statusArea = document.getElementById('status-area');
    this.messageInput = document.getElementById('message-input');
    this.sendButton = document.getElementById('send-button');
    this.cancelButton = document.getElementById('cancel-button');
    this.typingIndicator = document.getElementById('typing-indicator');
    
    this.userId = 'user-' + Math.random().toString(36).substr(2, 9);
    this.isStreaming = false;
    
    this.setupEventListeners();
    this.checkServiceHealth();
  }

  setupEventListeners() {
    // Send message on button click
    this.sendButton.addEventListener('click', () => {
      this.sendMessage();
    });
    
    // Send message on Enter key
    this.messageInput.addEventListener('keypress', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        this.sendMessage();
      }
    });
    
    // Cancel functionality (placeholder for future streaming implementation)
    this.cancelButton.addEventListener('click', () => {
      this.cancelRequest();
    });

    // Auto-resize input
    this.messageInput.addEventListener('input', () => {
      this.messageInput.style.height = 'auto';
      this.messageInput.style.height = this.messageInput.scrollHeight + 'px';
    });
  }

  async checkServiceHealth() {
    const indicators = {
      'main-status': { url: '/health', name: 'Main App' },
      'listings-status': { url: 'http://localhost:3001/health', name: 'Listings MCP' },
      'analytics-status': { url: 'http://localhost:3002/health', name: 'Analytics MCP' }
    };

    for (const [id, config] of Object.entries(indicators)) {
      try {
        const response = await fetch(config.url);
        const statusDot = document.querySelector(`#${id} .status-dot`);
        
        if (response.ok) {
          statusDot.className = 'status-dot healthy';
        } else {
          statusDot.className = 'status-dot error';
        }
      } catch (error) {
        const statusDot = document.querySelector(`#${id} .status-dot`);
        statusDot.className = 'status-dot error';
      }
    }
  }

  async sendMessage() {
    const message = this.messageInput.value.trim();
    if (!message || this.isStreaming) return;
    
    // Add user message to chat
    this.addUserMessage(message);
    
    // Clear input and set loading state
    this.messageInput.value = '';
    this.setStreamingState(true);
    
    try {
      // Send request to backend
      const response = await fetch('/agents/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: this.userId,
          userMessage: message
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      this.addAssistantMessage(result.message || 'Sorry, I encountered an error processing your request.');
      
    } catch (error) {
      console.error('Chat error:', error);
      this.addAssistantMessage('Sorry, I encountered an error. Please make sure all services are running and try again.');
    } finally {
      this.setStreamingState(false);
    }
  }

  addUserMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user-message';
    
    messageDiv.innerHTML = `
      <div class="message-avatar"></div>
      <div class="message-content">
        <p>${this.escapeHtml(message)}</p>
      </div>
    `;
    
    this.messageContainer.appendChild(messageDiv);
    this.scrollToBottom();
  }

  addAssistantMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant-message';
    
    messageDiv.innerHTML = `
      <div class="message-avatar">🤖</div>
      <div class="message-content">
        ${this.formatMessage(message)}
      </div>
    `;
    
    this.messageContainer.appendChild(messageDiv);
    this.scrollToBottom();
  }

  formatMessage(message) {
    // Format JSON blocks with <pre> tags
    message = message.replace(/```json\n([\s\S]*?)\n```/g, '<pre>$1</pre>');
    message = message.replace(/```\n([\s\S]*?)\n```/g, '<pre>$1</pre>');
    
    // Try to detect and format JSON objects/arrays
    message = message.replace(/(\{[\s\S]*?\}|\[[\s\S]*?\])/g, (match) => {
      try {
        // Check if it's valid JSON
        const parsed = JSON.parse(match);
        const formatted = JSON.stringify(parsed, null, 2);
        return `<pre>${formatted}</pre>`;
      } catch (e) {
        // Not valid JSON, return as is
        return match;
      }
    });
    
    // Basic formatting for better readability
    return message
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/^\s*[\*\-]\s+(.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .split('</p><p>').map(p => p.includes('<li>') || p.includes('<pre>') ? p : `<p>${p}</p>`).join('');
  }

  updateStatus(message, type = 'status') {
    this.clearStatus();
    
    const statusDiv = document.createElement('div');
    statusDiv.className = `${type}-status`;
    statusDiv.textContent = message;
    
    this.statusArea.appendChild(statusDiv);
    
    // Auto-clear status after 3 seconds
    setTimeout(() => {
      if (statusDiv.parentNode) {
        statusDiv.parentNode.removeChild(statusDiv);
      }
    }, 3000);
  }

  clearStatus() {
    this.statusArea.innerHTML = '';
  }

  setStreamingState(isStreaming) {
    this.isStreaming = isStreaming;
    this.sendButton.disabled = isStreaming;
    this.messageInput.disabled = isStreaming;
    this.cancelButton.style.display = isStreaming ? 'flex' : 'none';
    this.typingIndicator.style.display = isStreaming ? 'flex' : 'none';
    
    if (isStreaming) {
      this.sendButton.querySelector('.button-text').textContent = 'Sending...';
      this.updateStatus('Processing your request...', 'status-message');
    } else {
      this.sendButton.querySelector('.button-text').textContent = 'Send';
      this.clearStatus();
    }
  }

  cancelRequest() {
    // Placeholder for cancellation logic
    this.setStreamingState(false);
    this.updateStatus('Request cancelled', 'status-message');
  }

  scrollToBottom() {
    this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize chat interface when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ChatInterface();
});

// Add some sample interactions for demo purposes
window.addEventListener('load', () => {
  // Check if this is the first visit
  if (!sessionStorage.getItem('chat-visited')) {
    sessionStorage.setItem('chat-visited', 'true');
    
    // Add a small delay to let the page settle
    setTimeout(() => {
      const chatInterface = window.chatInterface;
      if (chatInterface) {
        chatInterface.updateStatus('All services connected! Try asking about properties.', 'tool-status');
      }
    }, 1000);
  }
});

// Export for potential use in other scripts
window.ChatInterface = ChatInterface;
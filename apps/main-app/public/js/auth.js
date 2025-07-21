// LLM Tools Real Estate Agent - Authentication Interface

class AuthManager {
  constructor() {
    this.token = this.getStoredToken();
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Handle login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }

    // Handle signup form
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
      signupForm.addEventListener('submit', (e) => this.handleSignup(e));
    }
  }

  async handleLogin(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const credentials = {
      email: formData.get('email'),
      password: formData.get('password'),
    };

    this.setButtonLoading(true);
    this.hideError();

    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Login failed');
      }

      // Store the token and user info
      this.setToken(result.access_token);
      this.setUserInfo(result.user);

      // Redirect to the main application
      window.location.href = '/';
    } catch (error) {
      this.showError(error.message);
    } finally {
      this.setButtonLoading(false);
    }
  }

  async handleSignup(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const userData = {
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
    };

    // Basic client-side validation
    if (userData.password.length < 6) {
      this.showError('Password must be at least 6 characters long');
      return;
    }

    this.setButtonLoading(true);
    this.hideError();

    try {
      const response = await fetch('/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Registration failed');
      }

      // Store the token and user info
      this.setToken(result.access_token);
      this.setUserInfo(result.user);

      // Redirect to the main application
      window.location.href = '/';
    } catch (error) {
      this.showError(error.message);
    } finally {
      this.setButtonLoading(false);
    }
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  getToken() {
    return this.token;
  }

  getStoredToken() {
    return localStorage.getItem('auth_token');
  }

  setUserInfo(user) {
    localStorage.setItem('user_info', JSON.stringify(user));
  }

  getUserInfo() {
    const userInfo = localStorage.getItem('user_info');
    return userInfo ? JSON.parse(userInfo) : null;
  }

  isAuthenticated() {
    return !!this.token;
  }

  async logout() {
    try {
      if (this.token) {
        await fetch('/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
          },
        });
      }
    } catch (error) {
      console.warn('Logout error:', error);
    } finally {
      // Clear local storage regardless of API call success
      this.token = null;
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_info');
      window.location.href = '/auth/login';
    }
  }

  setButtonLoading(isLoading) {
    const button = document.querySelector('.auth-button');
    if (!button) return;

    if (isLoading) {
      button.disabled = true;
      button.textContent = button.textContent.includes('Sign In') ? 'Signing in...' : 'Creating account...';
    } else {
      button.disabled = false;
      button.textContent = button.textContent.includes('Signing') ? 'Sign In' : 'Create Account';
    }
  }

  showError(message) {
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
  }

  hideError() {
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
      errorElement.style.display = 'none';
    }
  }
}

// Initialize auth manager
window.authManager = new AuthManager();
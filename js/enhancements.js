// Enhanced JavaScript Features

// ========================================
// 1. Dark Mode Toggle
// ========================================
class ThemeManager {
    constructor() {
        this.theme = localStorage.getItem('theme') || 'light';
        this.init();
    }
    
    init() {
        this.applyTheme(this.theme);
        this.setupToggle();
    }
    
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        this.theme = theme;
    }
    
    toggle() {
        const newTheme = this.theme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
    }
    
    setupToggle() {
        const toggle = document.getElementById('themeToggle');
        if (toggle) {
            toggle.addEventListener('click', () => this.toggle());
        }
    }
}

// ========================================
// 2. Lazy Loading Images
// ========================================
class LazyLoader {
    constructor() {
        this.images = document.querySelectorAll('img[data-src]');
        this.init();
    }
    
    init() {
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadImage(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            });
            
            this.images.forEach(img => observer.observe(img));
        } else {
            this.images.forEach(img => this.loadImage(img));
        }
    }
    
    loadImage(img) {
        const src = img.getAttribute('data-src');
        if (src) {
            img.src = src;
            img.classList.add('loaded');
            img.removeAttribute('data-src');
        }
    }
}

// ========================================
// 3. Search Functionality
// ========================================
class SearchEngine {
    constructor() {
        this.searchInput = document.getElementById('searchInput');
        this.services = document.querySelectorAll('.service-card');
        this.init();
    }
    
    init() {
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                this.search(e.target.value);
            });
        }
    }
    
    search(query) {
        const searchTerm = query.toLowerCase().trim();
        
        this.services.forEach(service => {
            const title = service.querySelector('h3')?.textContent.toLowerCase();
            const desc = service.querySelector('p')?.textContent.toLowerCase();
            
            if (title?.includes(searchTerm) || desc?.includes(searchTerm)) {
                service.style.display = 'block';
                service.classList.add('animate-fadeInUp');
            } else {
                service.style.display = 'none';
            }
        });
    }
}

// ========================================
// 4. Live Chat Widget
// ========================================
class LiveChat {
    constructor() {
        this.isOpen = false;
        this.createWidget();
        this.init();
    }
    
    createWidget() {
        const chatHTML = `
            <div class="chat-widget" id="chatWidget">
                <div class="chat-header" id="chatHeader">
                    <div class="chat-header-content">
                        <i class="fas fa-comments"></i>
                        <span>الدردشة المباشرة</span>
                    </div>
                    <button class="chat-close" id="chatClose">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="chat-body" id="chatBody">
                    <div class="chat-messages" id="chatMessages">
                        <div class="chat-message bot">
                            <p>مرحباً! كيف يمكنني مساعدتك اليوم؟</p>
                        </div>
                    </div>
                    <div class="chat-input-container">
                        <input type="text" id="chatInput" placeholder="اكتب رسالتك...">
                        <button id="chatSend"><i class="fas fa-paper-plane"></i></button>
                    </div>
                </div>
            </div>
            <button class="chat-toggle" id="chatToggle">
                <i class="fas fa-comments"></i>
                <span class="chat-badge">1</span>
            </button>
        `;
        
        document.body.insertAdjacentHTML('beforeend', chatHTML);
    }
    
    init() {
        const toggle = document.getElementById('chatToggle');
        const close = document.getElementById('chatClose');
        const send = document.getElementById('chatSend');
        const input = document.getElementById('chatInput');
        
        toggle.addEventListener('click', () => this.toggleChat());
        close.addEventListener('click', () => this.toggleChat());
        send.addEventListener('click', () => this.sendMessage());
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
    }
    
    toggleChat() {
        const widget = document.getElementById('chatWidget');
        const toggle = document.getElementById('chatToggle');
        this.isOpen = !this.isOpen;
        
        if (this.isOpen) {
            widget.classList.add('open');
            toggle.style.display = 'none';
        } else {
            widget.classList.remove('open');
            toggle.style.display = 'flex';
        }
    }
    
    sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (message) {
            this.addMessage(message, 'user');
            input.value = '';
            
            // Simulate bot response
            setTimeout(() => {
                this.addMessage('شكراً لرسالتك! سيتواصل معك أحد ممثلينا قريباً.', 'bot');
            }, 1000);
        }
    }
    
    addMessage(text, type) {
        const messages = document.getElementById('chatMessages');
        const messageHTML = `
            <div class="chat-message ${type}">
                <p>${text}</p>
            </div>
        `;
        messages.insertAdjacentHTML('beforeend', messageHTML);
        messages.scrollTop = messages.scrollHeight;
    }
}

// ========================================
// 5. Form Validation
// ========================================
class FormValidator {
    constructor(formId) {
        this.form = document.getElementById(formId);
        if (this.form) this.init();
    }
    
    init() {
        this.form.addEventListener('submit', (e) => {
            if (!this.validate()) {
                e.preventDefault();
            }
        });
        
        // Real-time validation
        const inputs = this.form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearError(input));
        });
    }
    
    validate() {
        let isValid = true;
        const inputs = this.form.querySelectorAll('[required]');
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });
        
        return isValid;
    }
    
    validateField(input) {
        const value = input.value.trim();
        const type = input.type;
        let isValid = true;
        let message = '';
        
        if (input.hasAttribute('required') && !value) {
            isValid = false;
            message = 'هذا الحقل مطلوب';
        } else if (type === 'email' && value && !this.isValidEmail(value)) {
            isValid = false;
            message = 'البريد الإلكتروني غير صحيح';
        } else if (type === 'tel' && value && !this.isValidPhone(value)) {
            isValid = false;
            message = 'رقم الهاتف غير صحيح';
        }
        
        if (!isValid) {
            this.showError(input, message);
        } else {
            this.clearError(input);
        }
        
        return isValid;
    }
    
    showError(input, message) {
        this.clearError(input);
        input.classList.add('error');
        const error = document.createElement('div');
        error.className = 'error-message';
        error.textContent = message;
        input.parentNode.appendChild(error);
    }
    
    clearError(input) {
        input.classList.remove('error');
        const error = input.parentNode.querySelector('.error-message');
        if (error) error.remove();
    }
    
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    
    isValidPhone(phone) {
        return /^[0-9]{10}$/.test(phone.replace(/\s/g, ''));
    }
}

// ========================================
// 6. Scroll Animations
// ========================================
class ScrollAnimations {
    constructor() {
        this.elements = document.querySelectorAll('.service-card, .stat-item, .price-card');
        this.init();
    }
    
    init() {
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-fadeInUp');
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1 });
            
            this.elements.forEach(el => observer.observe(el));
        }
    }
}

// ========================================
// 7. Scroll to Top Button
// ========================================
class ScrollToTop {
    constructor() {
        this.createButton();
        this.init();
    }
    
    createButton() {
        const button = document.createElement('button');
        button.className = 'scroll-top';
        button.id = 'scrollTop';
        button.innerHTML = '<i class="fas fa-arrow-up"></i>';
        document.body.appendChild(button);
    }
    
    init() {
        const button = document.getElementById('scrollTop');
        
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                button.classList.add('show');
            } else {
                button.classList.remove('show');
            }
        });
        
        button.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

// ========================================
// 8. Progress Bar
// ========================================
class ProgressBar {
    constructor() {
        this.createBar();
        this.init();
    }
    
    createBar() {
        const bar = document.createElement('div');
        bar.className = 'progress-bar';
        bar.id = 'progressBar';
        document.body.insertBefore(bar, document.body.firstChild);
    }
    
    init() {
        const bar = document.getElementById('progressBar');
        
        window.addEventListener('scroll', () => {
            const winScroll = document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (winScroll / height) * 100;
            bar.style.width = scrolled + '%';
        });
    }
}

// ========================================
// Initialize All Features
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all features
    window.themeManager = new ThemeManager();
    window.lazyLoader = new LazyLoader();
    window.searchEngine = new SearchEngine();
    window.liveChat = new LiveChat();
    window.scrollAnimations = new ScrollAnimations();
    window.scrollToTop = new ScrollToTop();
    window.progressBar = new ProgressBar();
    
    // Initialize form validation for all forms
    document.querySelectorAll('form').forEach(form => {
        new FormValidator(form.id);
    });
    
    console.log('✅ All enhancements initialized!');
});

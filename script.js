// HEM AFRICA - Unified Institutional Controller
const HEM = {
    init() {
        this.loader();
        this.navScroll();
        this.handlePopup();
    },

    // Handles the Global Page Transition
    loader() {
        window.addEventListener('load', () => {
            const l = document.getElementById('global-loader');
            if (l) {
                setTimeout(() => {
                    l.classList.add('loader-hidden');
                    // Completely remove from DOM after fade for performance
                    setTimeout(() => l.style.display = 'none', 600);
                }, 800);
            }
        });
    },

    // Dynamics for Sticky Navigation
    navScroll() {
        const n = document.querySelector('.nav');
        if (!n) return;

        window.addEventListener('scroll', () => {
            window.scrollY > 50 
                ? n.style.padding = "5px 0" 
                : n.style.padding = "15px 0";
        });
    },

    // HMN Launch Popup Controller
    handlePopup() {
        window.addEventListener('load', () => {
            // Check session storage to prevent annoying repeat visitors
            if (!sessionStorage.getItem('hmn_popup_closed')) {
                setTimeout(() => {
                    const popup = document.getElementById('announcement-popup');
                    if (popup) {
                        popup.style.display = 'flex';
                        popup.style.opacity = '1';
                    }
                }, 2500); // 2.5s delay for professional impact
            }
        });
    }
};

// Global Navigation Helper
window.scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
        window.scrollTo({ 
            top: el.offsetTop - 80, 
            behavior: 'smooth' 
        });
    }
};

// Global Popup Closer
window.closePopup = () => {
    const popup = document.getElementById('announcement-popup');
    if (popup) {
        popup.style.opacity = '0';
        setTimeout(() => {
            popup.style.display = 'none';
            sessionStorage.setItem('hmn_popup_closed', 'true');
        }, 300); // Wait for fade out animation
    }
};

// Initialize HEM Infrastructure
HEM.init();
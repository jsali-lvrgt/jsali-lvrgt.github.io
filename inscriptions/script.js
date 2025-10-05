import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://mqsebxyhynaroemoupwy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xc2VieHloeW5hcm9lbW91cHd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MDM0NzgsImV4cCI6MjA3NDQ3OTQ3OH0.ieD61m0CwOt7I2EA8Dstkd5Xd3RgOMQEFs5zpvB9hTU';
const supabase = createClient(supabaseUrl, supabaseKey);
const FORMCARRY_URL = 'https://formcarry.com/s/-rz71ZfooOI';

document.addEventListener("DOMContentLoaded", async () => {
    // === LOADER ===
    const loaderWrapper = document.getElementById('loaderWrapper');
    const mainContent = document.getElementById('mainContent');
    setTimeout(() => {
        loaderWrapper?.classList.add('hidden');
        setTimeout(() => mainContent?.classList.remove('hidden'), 300);
    }, 2000);

    // === MOBILE MENU ===
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('nav-links');
    hamburger?.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        const spans = hamburger.querySelectorAll('span');
        if (navLinks.classList.contains('active')) {
            spans[0].style.transform = 'rotate(45deg) translate(6px, 6px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(-45deg) translate(6px, -6px)';
        } else {
            spans.forEach(s => s.style.cssText = '');
        }
    });

    // Close menu when clicking a link
    document.querySelectorAll('#nav-links a').forEach(a => {
        a.addEventListener('click', () => {
            navLinks.classList.remove('active');
            hamburger.querySelectorAll('span').forEach(s => s.style.cssText = '');
        });
    });

    // === AUTH & FORM LOGIC ===
    const { data: { session } } = await supabase.auth.getSession();
    const form = document.getElementById('participation-form');
    const formMessage = document.getElementById('form-message');
    const submitButton = form?.querySelector('button[type="submit"]');

    if (!session?.user || !session.user.email_confirmed_at) {
        formMessage.textContent = "Veuillez vous connecter pour soumettre.";
        formMessage.style.color = "red";
        submitButton.disabled = true;
        setTimeout(() => window.location.href = "/login.html", 2500);
        return;
    }

    // === NAV UI ===
    const welcomeNavMsg = document.getElementById('welcome-nav-msg');
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const profileSection = document.getElementById('profile-section');

    function showLoggedIn(name) {
        if (welcomeNavMsg) welcomeNavMsg.textContent = ` ${name} `;
        if (profileSection) profileSection.style.display = 'flex';
        if (welcomeNavMsg) welcomeNavMsg.style.display = 'block';
        if (loginBtn) loginBtn.style.display = 'none';
        if (registerBtn) registerBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
    }

    function showLoggedOut() {
        if (welcomeNavMsg) welcomeNavMsg.textContent = '';
        if (profileSection) profileSection.style.display = 'none';
        if (welcomeNavMsg) welcomeNavMsg.style.display = 'none';
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (registerBtn) registerBtn.style.display = 'inline-block';
        if (logoutBtn) logoutBtn.style.display = 'none';
    }

    const user = session.user;
    const userName = user.user_metadata?.full_name || user.email.split('@')[0] || 'Utilisateur';
    if (user) {
        showLoggedIn(userName);
    } else {
        showLoggedOut();
    }

    logoutBtn?.addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.href = "/index.html";
    });

    // === FORM SUBMISSION ===
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        const payload = {
            ...data,
            user_id: session.user.id,
            email: session.user.email,
            submitted_at: new Date().toISOString()
        };

        submitButton.disabled = true;
        formMessage.textContent = "Envoi en cours...";
        formMessage.style.color = "yellow";

        try {
            const response = await fetch(FORMCARRY_URL, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (result.status === 'success') {
                formMessage.textContent = "✅ Soumission réussie.";
                formMessage.style.color = "green";
                form.reset();
            } else {
                throw new Error(result.message || "Échec de la soumission");
            }
        } catch (err) {
            console.error("Erreur:", err);
            formMessage.textContent = "❌ Erreur: " + (err.message || "Impossible d’envoyer");
            formMessage.style.color = "red";
        } finally {
            submitButton.disabled = false;
        }
    });
});

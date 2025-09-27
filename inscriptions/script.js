// script.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://mqsebxyhynaroemoupwy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xc2VieHloeW5hcm9lbW91cHd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MDM0NzgsImV4cCI6MjA3NDQ3OTQ3OH0.ieD61m0CwOt7I2EA8Dstkd5Xd3RgOMQEFs5zpvB9hTU';
const supabase = createClient(supabaseUrl, supabaseKey);

const FORMCARRY_URL = 'https://formcarry.com/s/-rz71ZfooOI';

document.addEventListener("DOMContentLoaded", async () => {
    const loaderWrapper = document.getElementById('loaderWrapper');
    const mainContent = document.getElementById('mainContent');
    const form = document.getElementById('participation-form');
    const formMessage = document.getElementById('form-message');
    const submitButton = form?.querySelector('button[type="submit"]');

    // Hide loader
    setTimeout(() => {
        loaderWrapper?.classList.add('hidden');
        setTimeout(() => mainContent?.classList.remove('hidden'), 300);
    }, 2000);

    // Check if user is logged in & email confirmed
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user || !session.user.email_confirmed_at) {
        formMessage.textContent = "Veuillez vous connecter pour soumettre.";
        formMessage.style.color = "red";
        submitButton.disabled = true;
        setTimeout(() => window.location.href = "/login.html", 2500);
        return;
    }

    // Handle form submission via Formcarry
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Add user metadata (optional, for your reference)
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
            formMessage.textContent = "❌ Erreur: " + (err.message || "Impossible d’envoyer le formulaire");
            formMessage.style.color = "red";
        } finally {
            submitButton.disabled = false;
        }
    });

    // === Nav/profile UI ===
    const welcomeNavMsg = document.getElementById('welcome-nav-msg');
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const profileSection = document.getElementById('profile-section');

    function showLoggedIn(name) {
        if (welcomeNavMsg) welcomeNavMsg.textContent = ` ${name} `;
        if (profileSection) profileSection.style.display = 'flex';
        if (welcomeNavMsg) welcomeNavMsg.style.display = 'inline-block';
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
});

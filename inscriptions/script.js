import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Firebase configuration from user input
const firebaseConfig = {
    apiKey: "AIzaSyBeFGzTiu3BcMCURE_Cpw4F4cmihY059mw",
    authDomain: "jsali-fstgat.firebaseapp.com",
    projectId: "jsali-fstgat",
    storageBucket: "jsali-fstgat.firebasestorage.app",
    messagingSenderId: "887844859070",
    appId: "1:887844859070:web:ff3f88a6c8ee0547a5c2ef",
    measurementId: "G-FW9DBVQND2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Global variables for Canvas environment
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

document.addEventListener("DOMContentLoaded", () => {
    const loaderWrapper = document.getElementById('loaderWrapper');
    const mainContent = document.getElementById('mainContent');
    const minimumLoadingTime = 4000;
    const startTime = Date.now();
    const form = document.getElementById('participation-form');
    const formMessage = document.getElementById('form-message');
    const submitButton = form.querySelector('button[type="submit"]');

    const hideLoader = () => {
        const elapsed = Date.now() - startTime;
        const remainingTime = minimumLoadingTime - elapsed;

        setTimeout(() => {
            if (loaderWrapper) {
                loaderWrapper.classList.add('hidden');
            }
            setTimeout(() => {
                if (mainContent) {
                    mainContent.classList.remove('hidden');
                }
            }, 500);
        }, Math.max(0, remainingTime));
    };

    // This line ensures the loader hides if this is the ins.html page directly
    if (window.location.pathname.includes('ins.html') || window.location.pathname.includes('participation_form.html')) {
        window.addEventListener('load', hideLoader);
    } else {
        hideLoader();
    }

    // AUTHENTICATION: Use onAuthStateChanged to handle user state correctly
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log("Firebase authentication successful.", user.uid);
            // User is signed in, you can now enable the form and its logic
            form.addEventListener('submit', async (event) => {
                event.preventDefault();

                const formData = new FormData(form);
                const submissionData = Object.fromEntries(formData.entries());

                // Add timestamp and initial status
                submissionData.timestamp = serverTimestamp();
                submissionData.status = 'pending'; // Default status for new submissions

                formMessage.textContent = "Envoi en cours...";
                formMessage.style.color = "yellow";

                try {
                    // Store in Firestore: /artifacts/{appId}/public/data/formSubmissions
                    const submissionsRef = collection(db, `artifacts/${appId}/public/data/formSubmissions`);
                    await addDoc(submissionsRef, submissionData);

                    formMessage.textContent = "Votre participation a été soumise avec succès !";
                    formMessage.style.color = "green";
                    form.reset();
                } catch (error) {
                    console.error("Erreur lors de la soumission du formulaire vers Firestore:", error);
                    formMessage.textContent = "Une erreur est survenue lors de l'envoi. Veuillez réessayer.";
                    formMessage.style.color = "red";
                }
            }, { once: true }); // Ensure the listener is added only once
            
            // Re-enabling the submit button if it was disabled.
            if (submitButton) {
                submitButton.disabled = false;
            }

        } else {
            console.log("No user signed in. Attempting to sign in.");
            try {
                if (initialAuthToken) {
                    console.log("Attempting to sign in with custom token...");
                    await signInWithCustomToken(auth, initialAuthToken);
                } else {
                    console.log("No custom token provided. Signing in anonymously...");
                    await signInAnonymously(auth);
                }
            } catch (error) {
                console.error("Firebase authentication error:", error);
                formMessage.textContent = "Authentication failed. Form cannot be submitted.";
                formMessage.style.color = "red";
                if (submitButton) {
                    submitButton.disabled = true;
                }
            }
        }
    });

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            } else {
                entry.target.classList.remove('visible');
            }
        });
    }, {
        threshold: 0.2
    });

    document.querySelectorAll('.feature').forEach(el => observer.observe(el));

    const user = localStorage.getItem('jsaliUser');
    const welcomeNavMsg = document.getElementById('welcome-nav-msg');
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const profileSection = document.getElementById('profile-section');
    const profilePic = document.getElementById('profile-pic');
    const profilePicInput = document.getElementById('profile-pic-input');
    const placeholderPicPath = "https://placehold.co/40x40/919191/0a0a0a?text=P";

    function loadProfilePic() {
        const savedPic = localStorage.getItem('jsaliProfilePic');
        if (savedPic) {
            profilePic.src = savedPic;
        } else {
            profilePic.src = placeholderPicPath;
        }
    }

    function saveProfilePic(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                localStorage.setItem('jsaliProfilePic', e.target.result);
                profilePic.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    if (profilePic) {
        profilePic.addEventListener('click', () => {
            if (user) {
                profilePicInput.click();
            }
        });
    }

    if (profilePicInput) {
        profilePicInput.addEventListener('change', saveProfilePic);
    }

    function showLoggedIn(userName) {
        if (welcomeNavMsg) welcomeNavMsg.textContent = ` ${userName} `;
        if (profileSection) profileSection.style.display = 'flex';
        if (welcomeNavMsg) welcomeNavMsg.style.display = 'inline-block';
        if (loginBtn) loginBtn.style.display = 'none';
        if (registerBtn) registerBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        if (profilePic) loadProfilePic();
    }

    function showLoggedOut() {
        if (welcomeNavMsg) welcomeNavMsg.textContent = '';
        if (profileSection) profileSection.style.display = 'none';
        if (welcomeNavMsg) welcomeNavMsg.style.display = 'none';
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (registerBtn) registerBtn.style.display = 'inline-block';
        if (logoutBtn) logoutBtn.style.display = 'none';
        localStorage.removeItem('jsaliUser');
        if (profilePic) profilePic.src = placeholderPicPath;
    }

    if (user) {
        showLoggedIn(user);
    } else {
        showLoggedOut();
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            showLoggedOut();
            window.location.href = "index.html";
        });
    }

});

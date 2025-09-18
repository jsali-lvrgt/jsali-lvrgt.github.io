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

    // Corrected logic: hide the loader unconditionally on DOM content loaded
    hideLoader();

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log("Firebase authentication successful.", user.uid);
            submitButton.disabled = false;
            formMessage.textContent = "";

            form.addEventListener('submit', async (event) => {
                event.preventDefault();

                const formData = new FormData(form);
                const submissionData = Object.fromEntries(formData.entries());

                // Formcarry submission logic
                formMessage.textContent = "Envoi en cours...";
                formMessage.style.color = "yellow";
                submitButton.disabled = true;

                try {
                    const response = await fetch("https://formcarry.com/s/-rz71ZfooOI", {
                        method: "POST",
                        headers: {
                            "Accept": "application/json",
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(submissionData)
                    });

                    const result = await response.json();

                    if (result.status === "success") {
                        formMessage.textContent = "Votre participation a été soumise avec succès !";
                        formMessage.style.color = "green";
                        form.reset();
                    } else {
                        console.error("Erreur lors de la soumission du formulaire vers Formcarry:", result.message);
                        formMessage.textContent = `Une erreur est survenue: ${result.message}`;
                        formMessage.style.color = "red";
                    }
                } catch (error) {
                    console.error("Erreur de connexion au serveur Formcarry:", error);
                    formMessage.textContent = "Une erreur est survenue lors de l'envoi. Veuillez vérifier votre connexion.";
                    formMessage.style.color = "red";
                } finally {
                    submitButton.disabled = false;
                }
            });
            
        } else {
            console.log("No user signed in. Attempting to sign in.");
            submitButton.disabled = true;
            formMessage.textContent = "Vous devez être connecté pour soumettre le formulaire.";
            formMessage.style.color = "red";
            alert("Vous devez être connecté pour soumettre le formulaire. Veuillez vous connecter ou vous inscrire.");
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
                formMessage.textContent = "L'authentification a échoué. Le formulaire ne peut pas être soumis.";
                formMessage.style.color = "red";
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
    const placeholderPicPath = "/placeholder-profile-pic.png";

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
            window.location.href = "/inscriptions";
        });
    }
});

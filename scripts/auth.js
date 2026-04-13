const loginButton = document.getElementById('loginButton');
const logoutButton = document.getElementById('logoutButton');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

if (loginButton) {
    loginButton.addEventListener('click', () => {
        const email = emailInput.value;
        const password = passwordInput.value;

        auth.signInWithEmailAndPassword(email, password)
            .then(userCredential => {
                // Signed in
                const user = userCredential.user;
                console.log('User signed in:', user);
            })
            .catch(error => {
                const errorCode = error.code;
                const errorMessage = error.message;
                console.error('Error signing in:', errorCode, errorMessage);
                alert('E-mail ou senha inválidos.');
            });
    });
}

if (logoutButton) {
    logoutButton.addEventListener('click', () => {
        auth.signOut().then(() => {
            window.location.href = '/pages/login.html';
        }).catch(error => {
            console.error('Error signing out:', error);
        });
    });
}

auth.onAuthStateChanged(user => {
    if (user) {
        // User is signed in, get their role and redirect
        db.collection('usuarios').doc(user.uid).get().then(doc => {
            if (doc.exists) {
                const role = doc.data().role;
                if (window.location.pathname.includes('login.html')) {
                    redirectToRole(role);
                }
            } else {
                // Handle case where user exists in Auth but not in Firestore
                console.error('User not found in Firestore');
                auth.signOut();
            }
        }).catch(error => {
            console.error('Error getting user role:', error);
            auth.signOut();
        });
    } else {
        // User is signed out, redirect to login if not already there
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = '/pages/login.html';
        }
    }
});

function redirectToRole(role) {
    switch (role) {
        case 'superadmin':
            window.location.href = '/pages/admin.html';
            break;
        case 'admin':
            window.location.href = '/pages/dashboard.html';
            break;
        case 'sindico':
            window.location.href = '/pages/sindico.html';
            break;
        default:
            // Redirect to a generic page or show an error
            window.location.href = '/pages/login.html';
    }
}
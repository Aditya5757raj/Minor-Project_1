let container = document.getElementById('container');

// Toggle between student and faculty sign-in forms
toggle = () => {
    container.classList.toggle('sign-in');
    container.classList.toggle('sign-up');
};

// Automatically add 'sign-in' class after a short delay for initial view
setTimeout(() => {
    container.classList.add('sign-in');
}, 200);

// Forgot password function
forgotPassword = (role) => {
    let email = prompt(`Please enter your ${role} email to reset your password:`);
    
    if (email) {
        // This is where you would add your password recovery process.
        // For now, we're simulating a recovery process with an alert.
        alert(`Password recovery link has been sent to the ${role} email: ${email}`);
        
        // You can also redirect the user to a password recovery page, like:
        // window.location.href = `/forgot-password?role=${role}&email=${email}`;
    }
};

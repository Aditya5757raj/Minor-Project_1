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

// Handle form submission for student and faculty login
// const studentForm = document.querySelector('.sign-up form');
// const facultyForm = document.querySelector('.sign-in form');

// Function to handle form submission and send login data to the server
// const handleLogin = async (form) => {
//     const formData = new FormData(form);
//     const loginData = {
//         username: formData.get('username'),
//         password: formData.get('password'),
//         role: formData.get('role') // 'student' or 'faculty'
//     };

//     try {
//         // Send a POST request to the server with login data
//         const response = await fetch('/login', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify(loginData)
//         });

//         const result = await response.json();

//         if (response.ok) {
//             // Display success message or redirect based on the role
//             alert(result.message);
//             // Redirect logic based on role
//             if (loginData.role === 'student') {
//                 window.location.href = '/student-dashboard'; // Example redirect
//             } else if (loginData.role === 'faculty') {
//                 window.location.href = '/faculty-dashboard'; // Example redirect
//             }
//         } else {
//             // Handle failed login attempt
//             alert(result.message);
//         }
//     } catch (error) {
//         console.error('Error during login:', error);
//         alert('An error occurred. Please try again.');
//     }
// };

// // // Attach event listeners to the forms for handling login
// // studentForm.addEventListener('submit', function (event) {
// //     event.preventDefault(); // Prevent default form submission
// //     handleLogin(this); // Handle student login
// // });

// // facultyForm.addEventListener('submit', function (event) {
// //     event.preventDefault(); // Prevent default form submission
// //     handleLogin(this); // Handle faculty login
// // });

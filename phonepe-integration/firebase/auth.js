const { getAuth } = require("firebase-admin/auth");
const app = require("./admin.js");

const auth = getAuth(app);

async function createNewUser(email) {
    const password = generatePassword(12);
    try {
        const user = await auth.createUser({
            email: email,
            emailVerified: false,
            password: password
        });
        console.log("User created successfully: ", user);
        user.error = false;
        return user;
    } catch (error) {
        console.log("Error creating user: ", error);
        error.error = true;
        return error;
    }
}

function generatePassword(length) {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const specialChars = '!@#$%^&*()_+~`|}{[]:;?><,./-=';
    
    const allChars = uppercase + lowercase + numbers + specialChars;
    let password = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * allChars.length);
        password += allChars[randomIndex];
    }
    
    return password;
}

async function checkEmailExists(email) {
    try {
        const user = await auth.getUserByEmail(email);
        return {emailExists: true, user: user};
    } catch (error) {
        if (error.code === "auth/user-not-found") {
            return {emailExists: false, error: error};
        } else {
            return {emailExists: null, error: error};
        }
    }
        
}

module.exports.createNewUser = createNewUser;
module.exports.checkEmailExists = checkEmailExists;
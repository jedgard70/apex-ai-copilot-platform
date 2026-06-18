// User Management Module

const users = [];

function addUser(email, role) {
    const user = { email, role };
    users.push(user);
    return user;
}

function getUser(email) {
    return users.find(user => user.email === email);
}

function updateUser(email, newRole) {
    const user = getUser(email);
    if (user) {
        user.role = newRole;
        return user;
    }
    return null;
}

function deleteUser(email) {
    const index = users.findIndex(user => user.email === email);
    if (index !== -1) {
        return users.splice(index, 1)[0];
    }
    return null;
}

export { addUser, getUser, updateUser, deleteUser };
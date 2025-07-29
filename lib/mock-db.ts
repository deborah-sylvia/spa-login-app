// In-memory storage for registered users
// This will reset on page refresh, simulating temporary storage
export const registeredUsers = new Map<string, string>() // email -> password

// Optionally, add a default user for easier testing if needed,
// but for strict "user must sign up" behavior, keep this empty.
// For now, I'll keep it empty to force signup.
// registeredUsers.set("test@example.com", "Password123!");

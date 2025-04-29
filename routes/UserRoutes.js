import express from 'express';
import User from '../model/User.js';
import { generateToken, AuthMiddleware } from '../jwt.js';

const router = express.Router();

// ✅ Register Route
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const newUser = new User({ name, email, password });
        await newUser.save();
        return res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});

// ✅ Login Route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const payload = { id: user._id ,role: user.role}; // Include role in the payload
        const token = generateToken(payload);

        console.log(user.role);
        const role=user.role;

        return res.status(200).json({
            message: "Login successful",
            token,
            user,role
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});

// ✅ Profile Route (Protected)
router.get('/profile', AuthMiddleware, async (req, res) => {
    const userId = req.user.id;

    try {
        const user = await User.findById(userId).select('-password'); // Optional: exclude password
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({ user }); // ✅ Wrap user in { user }
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});




// ✅ Get All Users (Only Admin can access)
router.get('/allusers', AuthMiddleware, async (req, res) => {
    const id = req.user.id;

    try {
        // Check if requester is admin
        const user = await User.findById(id).select('role');
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: "Forbidden: Admins only" });
        }

        // Fetch only non-admin users (exclude admins)
        const users = await User.find({ role: { $ne: 'admin' } }).select('-password');

        if (users.length === 0) {
            return res.status(404).json({ message: "No users found" });
        }

        return res.status(200).json({ users });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});


router.put('/update/:id', AuthMiddleware, async (req, res) => {
    const { id } = req.params;
    const { name, email, password } = req.body;

    try {
        // Fetch the user based on their ID
        const user = await User.findById(req.user.id).select('role');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if the logged-in user is an admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Forbidden: Admins only" });
        }

        // Email validation
        if (email && !validator.isEmail(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }

        // Update user properties
        user.name = name || user.name;
        if (email) {
            user.email = email;
        }
        if (password) {
            // Hash the password before saving
            const hashedPassword = await bcrypt.hash(password, 10);
            user.password = hashedPassword;
        }

        // Save the updated user
        await user.save();

        return res.status(200).json({ message: "User updated successfully", user });
    } catch (error) {
        console.error("Error updating user:", error);  // Log error for debugging
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.delete('/delete/:id', AuthMiddleware, async (req, res) => {
    const { id } = req.params;

    try {
        // Fetch the logged-in user to check if they are an admin
        const loggedInUser = await User.findById(req.user.id).select('role');
        if (!loggedInUser) {
            return res.status(401).json({ message: "Unauthorized: User not found" });
        }

        // Check if the logged-in user has an 'admin' role
        if (loggedInUser.role !== 'admin') {
            return res.status(403).json({ message: "Forbidden: Admins only" });
        }

        // Delete the user using findByIdAndDelete
        const userToDelete = await User.findByIdAndDelete(id);
        if (!userToDelete) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Error deleting user:", error); // Log error for debugging
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});


export default router;
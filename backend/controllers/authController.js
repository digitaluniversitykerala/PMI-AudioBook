import * as AuthService from '../services/authService.js';

export const signup = async (req, res, next) => {
    try {
        const result = await AuthService.signupUser(req.body);
        res.status(201).json({ 
            message: "User created successfully",
            token: result.accessToken,
            refreshToken: result.refreshToken,
            user: { 
                id: result.user._id, 
                name: result.user.name, 
                email: result.user.email,
                role: result.user.role
            }
        });
    } catch (err) {
        next(err);
    }
};

export const login = async (req, res, next) => {
    try {
        const result = await AuthService.loginUser(req.body);
        res.json({
            token: result.accessToken,
            refreshToken: result.refreshToken,
            user: { 
                id: result.user._id, 
                name: result.user.name, 
                email: result.user.email,
                role: result.user.role 
            },
        });
    } catch (err) {
        if (err.message === "User not found" || err.message === "Invalid credentials") {
            return res.status(400).json({ error: err.message });
        }
        next(err);
    }
};

export const forgotPassword = async (req, res, next) => {
    try {
        await AuthService.forgotPassword(req.body.email);
        res.json({ 
            message: "If an account exists with this email, you will receive password reset instructions." 
        });
    } catch (err) {
        next(err);
    }
};

export const resetPassword = async (req, res, next) => {
    try {
        const result = await AuthService.resetPassword(req.body.token, req.body.newPassword);
        res.json({ 
            message: "Password reset successful",
            token: result.accessToken,
            refreshToken: result.refreshToken,
            user: { 
                id: result.user._id, 
                name: result.user.name, 
                email: result.user.email,
                role: result.user.role 
            }
        });
    } catch (err) {
        if (err.message === "Invalid or expired reset token") {
            return res.status(400).json({ error: err.message });
        }
        next(err);
    }
};

export const refreshToken = async (req, res, next) => {
    try {
        if (!req.body.refreshToken) {
            return res.status(401).json({ error: "Refresh token required" });
        }
        const tokens = await AuthService.refreshUserToken(req.body.refreshToken);
        res.json({
            token: tokens.accessToken,
            refreshToken: tokens.refreshToken
        });
    } catch (err) {
        if (err.message === "Invalid refresh token") {
            return res.status(403).json({ error: err.message });
        }
        next(err);
    }
};

export const logout = async (req, res, next) => {
    try {
        await AuthService.logoutUser(req.body.userId);
        res.json({ message: "Logged out successfully" });
    } catch (err) {
        next(err);
    }
};

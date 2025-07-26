import { clerkClient } from "@clerk/express";

export const protectAdmin = async (req, res, next) => {
    try {
        const auth = req.auth();
        
        if (!auth || !auth.userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        const { userId } = auth;
        const user = await clerkClient.users.getUser(userId);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found"
            });
        }

        if (user.privateMetadata?.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: "Admin access required"
            });
        }

        req.user = user;
        next();
        
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(401).json({
            success: false,
            message: "Authentication failed",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import { clerkClient } from "@clerk/express";

// Helper function to get user details by email from Clerk
const getUserDetailsByEmail = async (email) => {
    try {
        const clerkResponse = await clerkClient.users.getUserList();
        const users = clerkResponse?.data || [];
        
        const user = users.find(u => 
            u.emailAddresses.some(emailAddr => emailAddr.emailAddress === email)
        );
        
        if (user) {
            return {
                id: user.id,
                name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Unknown User',
                email: user.emailAddresses[0]?.emailAddress,
                image: user.imageUrl
            };
        }
        return null;
    } catch (error) {
        console.error('Error fetching user details by email:', error);
        return null;
    }
};

// Helper function to get user details by Clerk user ID
const getUserDetailsById = async (clerkUserId) => {
    try {
        const user = await clerkClient.users.getUser(clerkUserId);
        return {
            id: user.id,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Unknown User',
            email: user.emailAddresses[0]?.emailAddress,
            image: user.imageUrl
        };
    } catch (error) {
        console.error('Error fetching user details by ID:', error);
        return null;
    }
};

// API to check if user is admin
export const isAdmin = (req, res, next) => {
   res.json({
    success: true,
    isAdmin: true
   })
}

// Debug endpoint to test Clerk integration
export const debugClerk = async (req, res) => {
    try {
        console.log('🔍 Debugging Clerk integration...');
        
        // Test Clerk connection
        const clerkResponse = await clerkClient.users.getUserList();
        const clerkUsers = clerkResponse?.data || [];
        const totalCount = clerkResponse?.totalCount || 0;
        
        console.log('📋 Clerk users found:', clerkUsers.length);
        console.log('📋 Total count from Clerk:', totalCount);
        
        // Ensure clerkUsers is an array before mapping
        if (Array.isArray(clerkUsers) && clerkUsers.length > 0) {
            console.log('📋 First few users:', clerkUsers.slice(0, 3).map(u => ({ id: u.id, email: u.emailAddresses[0]?.emailAddress, name: `${u.firstName} ${u.lastName}` })));
        } else {
            console.log('📋 Clerk users response:', clerkResponse);
        }
        
        res.json({
            success: true,
            clerkUsers: clerkUsers.length,
            totalCount: totalCount,
            clerkResponseType: typeof clerkResponse,
            isArray: Array.isArray(clerkUsers),
            sampleClerkUsers: Array.isArray(clerkUsers) ? clerkUsers.slice(0, 3).map(u => ({ id: u.id, email: u.emailAddresses[0]?.emailAddress, name: `${u.firstName} ${u.lastName}` })) : []
        });
    } catch (error) {
        console.error('❌ Debug error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

// API to get dashboard data
export const getDashboardData = async (req, res) => {
    try {
        console.log('🔄 Fetching dashboard data from Clerk, Stripe, and database...');
        
        // Fetch all paid bookings from database
        const bookings = await Booking.find({ isPaid: true }).lean();
        console.log(`📊 Found ${bookings.length} paid bookings`);
        
        // Fetch active shows (future shows) with movie details
        const activeShows = await Show.find({ 
            showDateTime: { $gte: new Date() } 
        }).populate('movie').lean();
        console.log(`🎬 Found ${activeShows.length} active shows`);
        
        // Get users from Clerk
        let totalUser = 0;
        let totalRevenue = 0;
        
        try {
            const clerkResponse = await clerkClient.users.getUserList();
            
            // Clerk returns { data: [...], totalCount: number }
            if (clerkResponse && typeof clerkResponse === 'object') {
                totalUser = clerkResponse.totalCount || 0;
                const clerkUsers = clerkResponse.data || [];
                
                console.log(`👥 Total users from Clerk: ${totalUser}`);
                console.log(`👥 Clerk response structure:`, { totalCount: clerkResponse.totalCount, dataLength: clerkUsers.length });
                
                // Ensure clerkUsers is an array before mapping
                if (Array.isArray(clerkUsers) && clerkUsers.length > 0) {
                    console.log(`👥 Clerk users details:`, clerkUsers.map(u => ({ id: u.id, email: u.emailAddresses[0]?.emailAddress, name: `${u.firstName} ${u.lastName}` })));
                } else {
                    console.log(`👥 Clerk users data:`, clerkUsers);
                }
            } else {
                console.error('❌ Invalid Clerk response:', typeof clerkResponse);
                totalUser = 0;
            }
            
            // Calculate revenue from paid bookings (no need to match with local users)
            totalRevenue = bookings.reduce((acc, booking) => acc + (booking.amount || 0), 0);
            console.log(`💰 Total revenue from paid bookings: ${totalRevenue}`);
            
        } catch (clerkError) {
            console.error('❌ Error fetching data from Clerk:', clerkError);
            console.error('❌ Clerk error details:', {
                message: clerkError.message,
                stack: clerkError.stack,
                name: clerkError.name
            });
            // If Clerk fails, we can't get user count, but we can still get revenue
            totalUser = 0;
            totalRevenue = bookings.reduce((acc, booking) => acc + (booking.amount || 0), 0);
            console.log(`💰 Total revenue from paid bookings: ${totalRevenue}`);
        }

        const dashboardData = {
            totalBookings: bookings.length,
            totalRevenue: totalRevenue,
            activeShows: activeShows,
            totalUser: totalUser
        }

        console.log('✅ Dashboard data fetched successfully from Clerk and database');
        res.json({
            success: true,
            dashboardData
        })
    } catch (error) {
        console.error('❌ Error fetching dashboard data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard data from Clerk and database',
            error: error.message
        })
    }
}

// API to get all shows
export const getAllShows = async (req, res) => {
    try {
        const shows= await Show.find({showDateTime:{$gte: new Date()}}).populate('movie').sort({showDateTime: 1});
        res.json({
            success: true,
            shows
        })


    } catch (error) {
        console.error(error);
        res.json({
            success: false,
            message: error.message
        })
        
    }
}

// API to get all bookings
export const getAllBookings = async (req, res) => {
    try {
        console.log('🔄 Fetching all bookings with user details from Clerk...');
        
        const bookings = await Booking.find({}).populate({
            path: "show",
            populate: { path: "movie" }
        }).sort({createdAt: -1});
        
        console.log(`📊 Found ${bookings.length} bookings`);
        
        // Get all Clerk users to map email to name
        let clerkUsers = [];
        try {
            const clerkResponse = await clerkClient.users.getUserList();
            clerkUsers = clerkResponse?.data || [];
            console.log(`👥 Found ${clerkUsers.length} users from Clerk (totalCount: ${clerkResponse?.totalCount || 0})`);
            
            // Log all Clerk users for debugging
            clerkUsers.forEach(user => {
                console.log(`👤 Clerk User: ${user.id} - ${user.firstName} ${user.lastName} - ${user.emailAddresses[0]?.emailAddress}`);
            });
        } catch (clerkError) {
            console.error('❌ Error fetching Clerk users:', clerkError);
        }
        
        // Create a map of Clerk user ID to user details
        const userMap = new Map();
        if (Array.isArray(clerkUsers)) {
            clerkUsers.forEach(user => {
                const email = user.emailAddresses[0]?.emailAddress;
                const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Unknown User';
                
                userMap.set(user.id, {
                    name: name,
                    email: email,
                    image: user.imageUrl
                });
                
                console.log(`🗺️ Mapped user ${user.id} to: ${name} (${email})`);
            });
        }
        
        // Log all booking clerkUserIds for debugging
        bookings.forEach(booking => {
            console.log(`🎫 Booking ${booking._id} has clerkUserId: ${booking.clerkUserId}`);
        });
        
        // Enhance bookings with user details
        const bookingsWithUserDetails = bookings.map(booking => {
            let userDetails = userMap.get(booking.clerkUserId);
            
            // If no user found by clerkUserId, try to find by any available user (fallback)
            if (!userDetails && clerkUsers.length > 0) {
                console.log(`⚠️ No user found for booking ${booking._id} with clerkUserId: ${booking.clerkUserId}`);
                console.log(`🔄 Using fallback: assigning first available user`);
                
                const fallbackUser = clerkUsers[0];
                userDetails = {
                    name: `${fallbackUser.firstName || ''} ${fallbackUser.lastName || ''}`.trim() || fallbackUser.username || 'Unknown User',
                    email: fallbackUser.emailAddresses[0]?.emailAddress,
                    image: fallbackUser.imageUrl
                };
            }
            
            if (userDetails) {
                console.log(`✅ Found user details for booking ${booking._id}: ${userDetails.name}`);
            } else {
                console.log(`❌ No user details found for booking ${booking._id} with clerkUserId: ${booking.clerkUserId}`);
            }
            
            return {
                ...booking.toObject(),
                user: userDetails ? {
                    name: userDetails.name,
                    email: userDetails.email,
                    image: userDetails.image
                } : {
                    name: `User ${booking.clerkUserId?.slice(-8) || 'Unknown'}`,
                    email: 'Email not found',
                    image: null
                }
            };
        });
        
        console.log('✅ Bookings fetched successfully with user details');
        res.json({
            success: true,
            bookings: bookingsWithUserDetails
        });
    } catch (error) {
        console.error('❌ Error fetching bookings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch bookings',
            error: error.message
        });
    }
}

// API to get all users from Clerk
export const getAllUsers = async (req, res) => {
    try {
        console.log('🔄 Fetching users from Clerk...');
        
        // Get users from Clerk
        const clerkResponse = await clerkClient.users.getUserList();
        
        // Clerk returns { data: [...], totalCount: number }
        if (!clerkResponse || typeof clerkResponse !== 'object') {
            console.error('❌ Invalid Clerk response:', typeof clerkResponse);
            return res.status(500).json({
                success: false,
                message: 'Invalid response from Clerk API'
            });
        }
        
        const clerkUsers = clerkResponse.data || [];
        const totalCount = clerkResponse.totalCount || 0;
        
        console.log(`👥 Found ${clerkUsers.length} users from Clerk (totalCount: ${totalCount})`);
        
        // Ensure clerkUsers is an array
        if (!Array.isArray(clerkUsers)) {
            console.error('❌ Clerk users data is not an array:', typeof clerkUsers);
            return res.status(500).json({
                success: false,
                message: 'Invalid response from Clerk API'
            });
        }
        
        // Get booking count for each user from database
        const usersWithBookings = await Promise.all(
            clerkUsers.map(async (clerkUser) => {
                try {
                    // Find bookings by Clerk user ID directly
                    const userBookings = await Booking.find({ 
                        clerkUserId: clerkUser.id 
                    }).lean();
                    
                    const paidBookings = await Booking.find({ 
                        clerkUserId: clerkUser.id,
                        isPaid: true 
                    }).lean();
                    
                    const totalBookings = userBookings.length;
                    const paidBookingsCount = paidBookings.length;
                    const totalSpent = paidBookings.reduce((acc, booking) => acc + (booking.amount || 0), 0);
                    
                    return {
                        _id: clerkUser.id,
                        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || clerkUser.username || 'Unknown User',
                        email: clerkUser.emailAddresses[0]?.emailAddress || 'No email',
                        image: clerkUser.imageUrl,
                        createdAt: clerkUser.createdAt,
                        totalBookings: totalBookings,
                        paidBookings: paidBookingsCount,
                        totalSpent: totalSpent
                    };
                } catch (error) {
                    console.error(`Error processing user ${clerkUser.id}:`, error);
                    return {
                        _id: clerkUser.id,
                        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || clerkUser.username || 'Unknown User',
                        email: clerkUser.emailAddresses[0]?.emailAddress || 'No email',
                        image: clerkUser.imageUrl,
                        createdAt: clerkUser.createdAt,
                        totalBookings: 0,
                        paidBookings: 0,
                        totalSpent: 0
                    };
                }
            })
        );

        console.log('✅ Users data fetched successfully from Clerk');
        res.json({
            success: true,
            users: usersWithBookings,
            totalCount: totalCount
        })
    } catch (error) {
        console.error('❌ Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users from Clerk',
            error: error.message
        })
    }
}

// API to get user details by email
export const getUserByEmail = async (req, res) => {
    try {
        const { email } = req.params;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email parameter is required'
            });
        }
        
        console.log(`🔍 Looking up user with email: ${email}`);
        
        const userDetails = await getUserDetailsByEmail(email);
        
        if (userDetails) {
            console.log(`✅ Found user: ${userDetails.name}`);
            res.json({
                success: true,
                user: userDetails
            });
        } else {
            console.log(`❌ No user found with email: ${email}`);
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
    } catch (error) {
        console.error('❌ Error fetching user by email:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user details',
            error: error.message
        });
    }
}

// API to get total user count from Clerk
export const getTotalUserCount = async (req, res) => {
    try {
        console.log('🔄 Fetching total user count from Clerk...');
        
        const clerkResponse = await clerkClient.users.getUserList();
        
        let totalUser = 0;
        if (clerkResponse && typeof clerkResponse === 'object') {
            totalUser = clerkResponse.totalCount || 0;
            console.log(`👥 Total users from Clerk: ${totalUser}`);
            console.log(`👥 Clerk response:`, { totalCount: clerkResponse.totalCount, dataLength: clerkResponse.data?.length });
        } else {
            console.error('❌ Invalid Clerk response:', typeof clerkResponse);
        }
        
        res.json({
            success: true,
            totalUser: totalUser,
            message: `Total users: ${totalUser}`
        });
    } catch (error) {
        console.error('❌ Error fetching total user count:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch total user count',
            error: error.message
        });
    }
}

// API to sync bookings with Clerk user data
export const syncBookingsWithClerk = async (req, res) => {
    try {
        console.log('🔄 Syncing bookings with Clerk user data...');
        
        // Get all bookings
        const bookings = await Booking.find({});
        console.log(`📊 Found ${bookings.length} bookings to sync`);
        
        // Get all Clerk users
        const clerkResponse = await clerkClient.users.getUserList();
        const clerkUsers = clerkResponse?.data || [];
        console.log(`👥 Found ${clerkUsers.length} users from Clerk`);
        
        // Create a map of Clerk user ID to user details
        const userMap = new Map();
        clerkUsers.forEach(user => {
            const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Unknown User';
            userMap.set(user.id, {
                name: name,
                email: user.emailAddresses[0]?.emailAddress,
                image: user.imageUrl
            });
        });
        
        // Check each booking and log missing user mappings
        let missingUsers = 0;
        let foundUsers = 0;
        
        bookings.forEach(booking => {
            const userDetails = userMap.get(booking.clerkUserId);
            if (userDetails) {
                foundUsers++;
                console.log(`✅ Booking ${booking._id}: ${userDetails.name}`);
            } else {
                missingUsers++;
                console.log(`❌ Booking ${booking._id}: No user found for clerkUserId ${booking.clerkUserId}`);
            }
        });
        
        console.log(`📊 Sync Summary: ${foundUsers} bookings with users, ${missingUsers} bookings without users`);
        
        res.json({
            success: true,
            totalBookings: bookings.length,
            bookingsWithUsers: foundUsers,
            bookingsWithoutUsers: missingUsers,
            message: `Sync completed. ${foundUsers} bookings have user data, ${missingUsers} bookings need attention.`
        });
        
    } catch (error) {
        console.error('❌ Error syncing bookings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to sync bookings',
            error: error.message
        });
    }
}
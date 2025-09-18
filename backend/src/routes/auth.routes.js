import { Router } from 'express';
import User from '../models/User.js';

const router = Router();

router.post('/send-otp', (req, res) => { 
    try {
        const {phonenumber} = req.body;
        console.log(req.body);
        console.log("phonenumber: ",phonenumber);
        if(!phonenumber){
            return res.status(400).json({
                message: "Phone number is required"

            })
        }
        const phoneRegex = /^[+]?[0-9]{10,15}$/;
        if (!phoneRegex.test(phonenumber)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid phone number format'
            });
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        const data = {
            phonenumber,
            otp,
            expiresAt: Date.now() + (5 * 60 * 1000), // only 5 minutes given
            attempts: 0,
            createdAt: Date.now()
        }
        global.otpStore = global.otpStore || new Map();
        global.otpStore.set(phonenumber, data);
        console.log(`📱 SMS OTP for ${phonenumber}: ${otp} (expires in 5 minutes)`);
        
        res.json({
            success:true,
            message: "OTP sent successfully",
            data:{phonenumber}
        });
    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({
        success: false,
        message: 'Failed to send OTP'
    });
}});

router.post('/verify-otp', async (req, res) => {
    try {
        const { phonenumber, otp, name, email, type } = req.body;
        
        if (!phonenumber || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Please provide both phonenumber and otp'
            });
        }
        
        global.otpStore = global.otpStore || new Map();
        const otpData = global.otpStore.get(phonenumber);
        
        if (!otpData) {
            return res.status(400).json({
                success: false,
                message: 'No OTP found for this phone number'
            });
        }
        
        // Check if OTP is expired
        if (Date.now() > otpData.expiresAt) {
            global.otpStore.delete(phonenumber);
            return res.status(400).json({
                success: false,
                message: 'OTP has expired'
            });
        }
        
        if (otpData.attempts >= 3) {
            global.otpStore.delete(phonenumber);
            return res.status(400).json({
                success: false,
                message: 'Maximum attempts exceeded'
            });
        }
        
        if (otpData.otp === otp) {
            global.otpStore.delete(phonenumber);
            
            let user;
            
            // Check if user exists
            const existingUser = await User.findByPhoneNumber(phonenumber);
            
            if (existingUser) {
                // Login existing user
                existingUser.isPhoneVerified = true;
                await existingUser.updateLastLogin();
                user = existingUser;
            } else {
                // Create new user (signup) - check for stored signup data
                global.signupData = global.signupData || new Map();
                const signupData = global.signupData.get(phonenumber);
                
                if (!signupData && !name) {
                    return res.status(400).json({
                        success: false,
                        message: 'Name is required for new user registration'
                    });
                }
                
                const userData = signupData || { name, email: email || '', phonenumber };
                
                user = new User({
                    name: userData.name,
                    email: userData.email,
                    phonenumber,
                    isPhoneVerified: true
                });
                
                await user.save();
                await user.updateLastLogin();
                
                // Clean up signup data
                if (signupData) {
                    global.signupData.delete(phonenumber);
                }
            }
            
            res.json({
                success: true,
                message: 'OTP verified successfully',
                data: {
                    user: {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        phonenumber: user.phonenumber,
                        isPhoneVerified: user.isPhoneVerified
                    }
                }
            });
        } else {
            otpData.attempts++;
            global.otpStore.set(phonenumber, otpData);
            res.status(400).json({
                success: false,
                message: `Invalid OTP. ${3 - otpData.attempts} attempts remaining`
            });
        }
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({
            success: false,
            message: 'Network error. Please try again.'
        });
    }
});

router.post('/resend-otp',(req,res)=>{
    try {
        const { phonenumber } = req.body;
        if (!phonenumber) {
        return res.status(400).json({
            success: false,
            message: 'Phone number is required'
        });
        }
        global.otpStore = global.otpStore || new Map();
        const existingOtp = global.otpStore.get(phonenumber);
        if (existingOtp && (Date.now() - existingOtp.createdAt) < 60000) {
            const waitTime = Math.ceil((60000 - (Date.now() - existingOtp.createdAt)) / 1000);
            return res.status(429).json({
                success: false,
                message: `Please wait ${waitTime} seconds before requesting a new OTP.`
            });
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpData = {
        phonenumber,
        otp,
        expiresAt: Date.now() + (5 * 60 * 1000), // 5 minutes
        attempts: 0,
        createdAt: Date.now()
        };
        global.otpStore.set(phonenumber, otpData);
        console.log(`📱 SMS OTP (Resent) for ${phonenumber}: ${otp} (expires in 5 minutes)`);
        
        res.json({
        success: true,
        message: 'OTP sent successfully',
        data: { phonenumber }
        });
    }catch(error){
        console.error('Error resending OTP:', error);
        res.status(500).json({
        success: false,
        message: 'Failed to resend OTP'
        });

    }

})
router.post('/signup', async (req, res) => {
    try {
        const { name, email, phonenumber } = req.body;
        
        if (!name || !phonenumber) {
            return res.status(400).json({
                success: false,
                message: 'Name and phone number are required'
            });
        }
        
        // Check if user already exists
        const existingUser = await User.findByPhoneNumber(phonenumber);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this phone number already exists'
            });
        }
        
        // Store user data temporarily (will be saved after OTP verification)
        global.signupData = global.signupData || new Map();
        global.signupData.set(phonenumber, {
            name,
            email: email || '',
            phonenumber,
            createdAt: Date.now()
        });
        
        res.json({
            success: true,
            message: 'User data stored. Please verify OTP to complete registration.',
            data: {
                phonenumber
            }
        });
    } catch (error) {
        console.error('Error in signup:', error);
        res.status(500).json({
            success: false,
            message: 'Signup failed. Please try again.'
        });
    }
});

router.get('/user/:phonenumber', async (req, res) => {
    try {
        const { phonenumber } = req.params;
        
        const user = await User.findVerifiedUser(phonenumber);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phonenumber: user.phonenumber,
                    isPhoneVerified: user.isPhoneVerified
                }
            }
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user data'
        });
    }
});

router.get('/',(req,res)=>{
    return res.status(200).json({
        message:"Auth Route working"
    })
})
export default router;
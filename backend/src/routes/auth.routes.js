import { Router } from 'express';

const router = Router();

router.post('/send-otp', (req, res) => { 
    try {
        const {phonenumber} = req.body;
        if(!phonenumber){
            return res.status(400).json({
                message: "Phone number is required"

            })
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        const data = {
            phonenumber,
            otp,
            expiresAt: Date.now() + (5 * 60 * 1000), // only 5 minutes given
            attempts: 0
        }
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

router.post('/verify-otp',(req, res)=>{
    try {
        const {phonenumber, otp} = req.body;
        if (!phonenumber || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Please provide both phonenumber and otp'
            });
            
        }
        
    } catch (error) {
        
    }

})

router.post('/resend-otp',(req,res)=>{

})

export default router;
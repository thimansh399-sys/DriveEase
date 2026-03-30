const User = require('../models/User');
const Driver = require('../models/Driver');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'driveease-dev-secret';

// Login handler (no OTP required)
exports.verifyOTPAndLogin = async (req, res) => {
	try {
		const { phone, name, role = 'customer' } = req.body;
		if (!phone) {
			return res.status(400).json({ error: 'Phone is required' });
		}
		if (!name || !name.trim()) {
			return res.status(400).json({ error: 'Name is required' });
		}
		let user = null;
		if (role === 'driver') {
			user = await Driver.findOne({ phone });
			if (!user) {
				user = new Driver({ phone, name, status: 'pending' });
			}
		} else {
			user = await User.findOne({ phone });
			if (!user) {
				user = new User({ phone, name, role: 'customer' });
			}
		}
		await user.save();
		const token = jwt.sign(
			{
				id: user._id,
				phone: user.phone,
				role: role === 'driver' ? 'driver' : 'customer',
				name: user.name
			},
			JWT_SECRET,
			{ expiresIn: '30d' }
		);
		res.json({
			message: 'Login successful',
			token,
			user: {
				id: user._id,
				name: user.name,
				phone: user.phone,
				role: role === 'driver' ? 'driver' : 'customer'
			}
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};


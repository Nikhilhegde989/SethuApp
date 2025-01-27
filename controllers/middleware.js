const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  // Retrieve the token from the Authorization header or cookies
  console.log("\n request = ", req)
  const authHeader = req.headers['authorization'];
  const tokenFromHeader = authHeader && authHeader.split(' ')[1]; // Bearer <token>
  const tokenFromCookie = req.cookies?.token; // Check for token in cookies

  const receivedtoken = tokenFromHeader || tokenFromCookie;

  if (!receivedtoken) {
    return res.status(401).json({
      statusCode: 401,
      message: 'Access token is missing',
      data: null,
    });
  }

  try {
    // Verify the token's validity
    const decoded = jwt.verify(receivedtoken, process.env.JWT_SECRET_KEY);
    console.log('\nDecoded value:', decoded);

    // Append the user details from the token payload to the request object
    req.user = {
      email: decoded.email,
      name: decoded.name,
      interests: decoded.interests || [], // Default to an empty array if interests are not present
    };

    // Proceed to the next middleware/controller
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        statusCode: 401,
        message: 'Token has expired',
        data: null,
      });
    }

    return res.status(403).json({
      statusCode: 403,
      message: 'Invalid token',
      data: null,
    });
  }
};

module.exports = { authenticateToken };
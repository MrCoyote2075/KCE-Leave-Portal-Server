import jwt from "jsonwebtoken";

export const GenerateJwtTokens = (data, res) => {
    try {
        const token = jwt.sign(data, process.env.JWT_SECRET_KEY, {
            expiresIn: "7d",
        });

        const isProduction = process.env.STATUS !== 'development';

        res.cookie(process.env.JWT_TOKEN_NAME, token, {
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            httpOnly: true,
            secure: isProduction, 
            sameSite: isProduction ? 'none' : 'lax', 
        });

        return token;
    } catch (error) {
        throw new Error(`Error: Creating Json Web Token Failed... :- ${error}`);
    }
};
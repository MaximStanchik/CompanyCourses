const { PrismaClient } = require("@prisma/client");
const DbClient = new PrismaClient();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const validateRegisterInput = require("../Validation/register");
const validateLoginInput = require("../Validation/login");
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const useragent = require('useragent');

// Функция для отправки письма для подтверждения
async function sendVerificationEmail(email, token) {
    console.log(`Sending verification email to ${email} with token: ${token}`);

    let transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    let verificationLink = `https://localhost:9000/auth/verify-email?token=${token}`;

    let mailOptions = {
        from: '"CompanyCourses LLC" <' + process.env.EMAIL_USER + '>',
        to: email,
        subject: "Verify Your Email Address - CompanyCourses LLC",
        html: `<p>Dear user,</p>
               <p>Thank you for registering with CompanyCourses LLC. Please click the following link to verify your email address and activate your account:</p>
               <p><a href="${verificationLink}" style="display:inline-block;padding:10px 18px;background:#007bff;color:#ffffff;text-decoration:none;border-radius:4px;font-weight:bold;">Verify Email</a></p>
               <p style="font-size:12px;color:#555;">Or copy this link into your browser: <br/><a href="${verificationLink}" style="color:#007bff;">${verificationLink}</a></p>
               <p>This link will expire in 24 hours.</p>
               <p>If you did not register for an account with us, please ignore this email.</p>
               <p>Best regards,</p>
               <p>The CompanyCourses LLC Team</p>`,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log("Verification email sent successfully.");
    } catch (error) {
        console.error("Error sending verification email:", error);
    }
}

const generateAccessToken = (id, roles) => {
    const payload = { id, roles: Array.isArray(roles) ? roles : [roles] };
    return jwt.sign(payload, process.env.SECRET, { expiresIn: "12h" });
};

class authController {
    async checkEmailExists(req, res) {
        const { email } = req.query;
        const existingUser = await DbClient.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ email: "Email уже существует" });
        }
        return res.status(200).json({ message: "Email доступен" });
    }

    async checkUsernameExists(req, res) {
        const { username } = req.query;
        const existingUser = await DbClient.user.findUnique({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ username: "Username already taken" });
        }
        return res.status(200).json({ message: "Username доступен" });
    }

    async registration(req, res) {
        const { email, password, confirmPassword, username, name } = req.body; 
        const { errors, isValid } = validateRegisterInput(req.body);
        if (!isValid) {
            return res.status(400).json(errors);
        }
  
        try {
            const existingUser = await DbClient.user.findUnique({ where: { email } });
            if (existingUser) {
                return res.status(400).json({ email: "A user with this email is already registered" });
            }

            // Check if username exists
            const existingProfileWithSameUsername = await DbClient.user.findUnique({ where: { username } });
            if (existingProfileWithSameUsername) {
                return res.status(400).json({ username: "Username already taken" });
            }
  
            const hashedPassword = await bcrypt.hash(password, 5);
            const verificationToken = uuidv4();
            const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // Токен действителен 24 часа

            const newUser = await DbClient.user.create({
                data: {
                    username,
                    email,
                    password: hashedPassword,
                    role: "USER",
                    isVerified: false, // Пользователь изначально не верифицирован
                    emailVerificationToken: verificationToken,
                    emailVerificationExpires: verificationExpires,
                },
            });
  
            await DbClient.profile.create({
                data: {
                    userId: newUser.id,
                    name: name || "",
                    surname: "",
                    skills: [],
                },
            });
  
            // Отправка письма для подтверждения
            await sendVerificationEmail(newUser.email, verificationToken);

            // Отвечаем сообщением об успешной регистрации, но информируем, что требуется подтверждение
            return res.status(200).json({ message: "Registration successful! Please check your email for verification." });

        } catch (err) {
            console.error(err);
            return res.status(500).json({ message: "Registration error" });
        }
    }

    async verifyEmail(req, res) {
        const { token } = req.query;

        try {
            const user = await DbClient.user.findFirst({
                where: {
                    emailVerificationToken: token,
                    emailVerificationExpires: {
                        gte: new Date(), // Токен не просрочен
                    },
                },
            });

            if (!user) {
                return res.status(400).json({ message: "Invalid or expired verification token." });
            }

            // Обновить пользователя до верифицированного
            await DbClient.user.update({
                where: { id: user.id },
                data: {
                    isVerified: true,
                    emailVerificationToken: null, // Очистить токен после верификации
                    emailVerificationExpires: null,
                },
            });

            // Перенаправить на страницу входа или страницу успеха на фронтенде
            return res.redirect("https://localhost:3000/login?verified=true"); 

        } catch (err) {
            console.error(err);
            return res.status(500).json({ message: "Email verification error." });
        }
    }

    async login(req, res) {
        const { errors, isValid } = validateLoginInput(req.body);
        if (!isValid) {
            return res.status(400).json(errors);
        }

        const { email, password } = req.body;
        try {
            const user = await DbClient.user.findUnique({ where: { email } });
            if (!user) {
                return res.status(400).json({ email: `User with email ${email} does not exist` });
            }

            if (!user.isVerified) {
                return res.status(403).json({ message: "Please verify your email address to log in." });
            }

            // --- LAST ACTIVITY LOGIC ---
            const agent = useragent.parse(req.headers['user-agent']);
            const device = agent.device.toString() || agent.os.family;
            const os = agent.os.toString();
            const browser = agent.toAgent();
            let ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.connection?.remoteAddress || req.ip;
            if (Array.isArray(ip)) ip = ip[0];
            if (typeof ip === 'string' && ip.includes(',')) ip = ip.split(',')[0];
            // Для страны можно использовать geoip-lite или оставить пустым
            const country = '';
            await DbClient.user.update({
                where: { id: user.id },
                data: {
                    lastDevice: device,
                    lastOS: os,
                    lastBrowser: browser,
                    lastIP: ip,
                    lastCountry: country,
                    lastActivityTime: new Date(),
                }
            });
            // --- END LAST ACTIVITY LOGIC ---

            const token = generateAccessToken(user.id, user.role);
            return res.json({ token });
        } catch (err) {
            console.log(err);
            return res.status(400).json({ message: "Login error" });
        }
    }

    async getUsers(req, res) {
        try {
            const authorizationHeader = req.headers.authorization;
            if (authorizationHeader) {
                const tokenArray = authorizationHeader.split(" ");
                if (tokenArray.length === 2) {
                    const token = tokenArray[1];
                    let decodedToken;
                    try {
                        decodedToken = jwt.verify(token, process.env.SECRET);
                    } catch (err) {
                        return res.status(401).json("Invalid token");
                    }
                    const users = await DbClient.user.findMany({
                        include: { Profile: true }
                    });
                    return res.json(users);
                }
            }
            return res.status(401).json({ message: "Missing or invalid authorization token" });
        } catch (e) {
            console.log(e);
            res.status(400).json({ message: "Get users error" });
        }
    }

    async isAdmin(req, res) {
        try {
            const token = req.headers.authorization.split(" ")[1];
            const { id } = await jwt.verify(token, process.env.SECRET);
            const user = await DbClient.user.findUnique({ where: { id } });
            return res.json({ isAdmin: user.role === "ADMIN" });
        } catch (e) {
            console.log(e);
            res.status(400).json({ message: "Get user error" });
        }
    }

    async currentUser(req, res) {
        try {
            const authorizationHeader = req.headers.authorization;
            if (!authorizationHeader) {
                return res.status(401).json("You are not authorized");
            }
            const tokenArray = authorizationHeader.split(" ");
            if (tokenArray.length === 2) {
                const token = tokenArray[1];
                let decodedToken;
                try {
                    decodedToken = jwt.verify(token, process.env.SECRET);
                } catch (err) {
                    return res.status(401).json({ message: "Invalid token" });
                }
                const user = await DbClient.user.findUnique({ where: { id: decodedToken.id } });
                return res.json(user);
            }
        } catch (e) {
            console.log(e);
            res.status(400).json({ message: "Get user error" });
        }
    }

    async getUserById(req, res) {
        try {
            const id = parseInt(req.query.id);
            if (!Number.isInteger(id)) {
                return res.status(400).json({ message: "Invalid user ID" });
            }
            const user = await DbClient.user.findUnique({ where: { id } });
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            return res.json(user);
        } catch (e) {
            console.log(e);
            res.status(400).json({ message: "User error" });
        }
    }

    async updateUser(req, res) {
        try {
            const authorizationHeader = req.headers.authorization;
            if (authorizationHeader) {
                const tokenArray = authorizationHeader.split(" ");
                if (tokenArray.length === 2) {
                    const token = tokenArray[1];
                    let decodedToken;
                    try {
                        decodedToken = jwt.verify(token, process.env.SECRET);
                    } catch (err) {
                        return res.status(401).json({ message: "Invalid token" });
                    }
                    const roles = decodedToken.roles;
                    if (!roles.includes("ADMIN")) {
                        return res.status(403).json("You don't have enough rights");
                    }
                    const id = parseInt(req.query.id);
                    if (!Number.isInteger(id)) {
                        return res.status(400).json({ message: "Invalid user ID" });
                    }
                    const user = await DbClient.user.findUnique({ where: { id } });
                    if (!user) {
                        return res.status(404).json({ message: "User not found" });
                    }
                    const { name, email } = req.body;
                    const existingUser = await DbClient.user.findUnique({ where: { email } });
                    if (existingUser && existingUser.id !== id) {
                        return res.status(409).send("User with this email already exists");
                    }
                    const userNew = await DbClient.user.update({
                        where: { id: Number(id) },
                        data: { ...req.body },
                    });
                    return res.json(userNew);
                }
            }
        } catch (e) {
            console.log(e);
            res.status(400).json({ message: "User error" });
        }
    }

    async deleteUser(req, res) {
        try {
            const authorizationHeader = req.headers.authorization;
            if (authorizationHeader) {
                const tokenArray = authorizationHeader.split(" ");
                if (tokenArray.length === 2) {
                    const token = tokenArray[1];
                    let decodedToken;
                    try {
                        decodedToken = jwt.verify(token, process.env.SECRET);
                    } catch (err) {
                        return res.status(401).json({ message: "Invalid token" });
                    }
                    const roles = decodedToken.roles;
                    if (!roles.includes("ADMIN")) {
                        return res.status(403).json("You don't have enough rights");
                    }
                    const removedUser = await DbClient.user.delete({ where: { id: Number(req.query.id) } });
                    res.json(removedUser);
                }
            }
        } catch (err) {
            console.log(err);
            res.status(500).json(err);
        }
    }  
}

module.exports = new authController();
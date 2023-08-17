const User = require('./models/User')
const Role = require('./models/Role')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {validationResult} = require('express-validator')
const {secret} = require('./config')
const generateAccessToken = (id, roles) => {
    const payload = {
        id,
        roles
    }
    return jwt.sign(payload, secret, {expiresIn: '24h'})
}
class authController {
    async registration(req, res) {
        try {
            const errors = validationResult(req)
            if(!errors.isEmpty()){
                return res.status(400).json({message:"Ошибка при регистрации", errors})
            }
            const {username, email, password} = req.body
            const candidate = await User.findOne({username})
            if (candidate) {
                return res.status(400).json({message: 'Пользователь с таким именем уже существует'})
            }
            const hashPassword = bcrypt.hashSync(password, 7);
            const userRole = await Role.findOne({value: 'USER'})
            const user = new User({username, email, password: hashPassword, roles: [userRole.value], registeredAt: new Date()})
            
            await user.save()
            return res.json({message: 'Пользователь успешно зарегистрирован'})
        } catch (e){
            console.log(e)
            res.status(400).json({message: 'Registration error'})
        }
    }
    async login(req, res) {
        try {
            const { username, password } = req.body;
            const user = await User.findOne({ username });
            if (!user) {
                return res.status(400).json({ message: `Пользователь ${username} не найден` });
            }
            const validPassport = bcrypt.compareSync(password, user.password);
            if (!validPassport) {
                return res.status(400).json({ message: 'Введен неверный пароль' });
            }
    
            // Обновляем дату последней активности
            user.lastActiveAt = new Date();
            await user.save(); // Сохраняем обновленную запись пользователя
    
            const token = generateAccessToken(user._id, user.roles);
            return res.json({ token });
        } catch (e) {
            console.log(e);
            res.status(400).json({ message: 'Login error' });
        }
    }
    
    async getUsers(req, res) {
        try {
            const users = await User.find()
            res.json(users)
        } catch (e){
            console.log(e)
        }
    }
    async deleteUser(req, res) {
        try {
            const { userId } = req.params;
            await User.findByIdAndDelete(userId);
            
            return res.json({ message: 'Пользователь успешно удален' });
        } catch (e) {
            console.log(e);
            res.status(500).json({ message: 'Ошибка при удалении пользователя' });
        }
    }
}

module.exports = new authController()
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const validator = require("email-validator");
const jwt = require('jsonwebtoken')

const userSchema = new mongoose.Schema({
    name: {
        type: String
    },
    age: {
        type: Number
    },
    password: {
        type: String,
        required:true,
        trim:true,
        minlength: 7,
        validate(value){
            if(value.includes("password")){
                throw new Error("The pass word could not contains \"password\"!")
            }
        }
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value){
            if(!validator.validate(value)){
                throw new Error("Invalid email!")
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
},{
    timestamps: true
})

userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
})

userSchema.pre('save', async function(next) {
    const user = this

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()
})

userSchema.methods.toJSON = function () {
    const userObeject = this.toObject()

    delete userObeject.password
    delete userObeject.tokens
    delete userObeject.avatar

    return userObeject
}

userSchema.methods.generateAuthToken = async function () {

    const token = jwt.sign({ _id: this._id.toString()}, process.env.JWT_SECRET)

    this.tokens = this.tokens.concat({ token })
    
    await this.save()

    return token
}

userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({email})

    if (!user) {
        throw new Error('Unable to login!')
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if(!isMatch) {
        throw new Error("Unable to login!")
    }

    return user
} 

const User = mongoose.model("User", userSchema)

module.exports = User
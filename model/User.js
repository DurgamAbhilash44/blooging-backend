
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema=new mongoose.Schema({


         name:{
            type:String,
            required:true,
            unique:true,
         },
         email:{
            type:String,
            required:true,
            unique:true,
         },
            password:{
                type:String,
                required:true,
            },
            role:{
                type:String,
                enum:["admin","user"],
                default:"user",
         },
}, {timestamps:true});


userSchema.pre('save', async function (next) {
    // Assuming you are using bcrypt for password hashing
  
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

userSchema.methods.comparePassword = async function (password) {
    // Assuming you are using bcrypt for password hashing
   
    return await bcrypt.compare(password, this.password);
};
const User=mongoose.model("User",userSchema);
export default User;
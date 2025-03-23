const { pacsdb, mongoose } = require("./connection")
const validator = require("validator")
const util = require("../exports/util")

// Employee account
const UserSchema = mongoose.Schema(
    {
        status: { type: Boolean, default: false },
        isDeleted: { type: Boolean, default: false },
        isLocked: { type: Boolean, default: false },
        username: {
            type: String,
            required: [true, "Username must not be null"],
            trim: true,
        },
        password: { type: String, trim: true },
        email: {
            type: String,
            required: [true, "Email must not be null"],
            validate: {
                validator: function (v) { return validator.isEmail(v); },
                message: "{VALUE} is not a valid Email!",
            },
            trim: true,
        },
        createdAt: { type: Date },
        updatedAt: { type: Date },
    },
    { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
)

module.exports = pacsdb.model("users", UserSchema)

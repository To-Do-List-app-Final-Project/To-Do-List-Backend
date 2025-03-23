const { pacsdb, mongoose } = require("./connection")

// Floor基本信息操作
const categoriesSchema = mongoose.Schema(
    {
        code: {
            type: String,
            unique: true,
            trim: true,
            required: [true, "Category Code must not be null"],
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "users",
        },
        title: {
            type: String,
            trim: true,
        },
        status: {
            type: Boolean,
            default: true,
        },
        color: {
            type: String,
            trim: true,
        },
        createdAt: {
            type: Date,
        },
        updatedAt: {
            type: Date,
        },
        isDeleted:{
            type:Boolean,
            default:false
        }
    },
    { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
)

module.exports = pacsdb.model("categories", categoriesSchema)

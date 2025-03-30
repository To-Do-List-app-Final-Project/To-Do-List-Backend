const { pacsdb, mongoose } = require("./connection")

// Floor基本信息操作
const categoriesSchema = mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "users",
        },
        title: {
            type: String,
            trim: true,
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

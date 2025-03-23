const { pacsdb, mongoose } = require("./connection")

// Floor基本信息操作
const taskSchema = mongoose.Schema(
    {
        code: {
            type: String,
            unique: true,
            trim: true,
            required: [true, "Task Code must not be null"],
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "users",
        },
        title: {
            type: String,
            trim: true,
        },
        description: {
            type: String,
        },
        priority: {
            enum: ["Low", "Medium", "High"],
            type: String,
            default: "Low",
        },
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "categories",
        },
        scheduleDate: {
            type: Date,
        },
        reminderDate: {
            type: Date,
        },
        status: {
            type: String,
            enum: ["Cancelled", "Expired", "Completed", "Pending"],
        },
        repeat: {
            type: String,
            enum: ["Daily", "Weekly", "Monthly", "Yearly"],
        },
        createdAt: {
            type: Date,
        },
        updatedAt: {
            type: Date,
        },
        isDeleted: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
)

module.exports = pacsdb.model("tasks", taskSchema)

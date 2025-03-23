const Staff = require("../../models/staff");
const ErrorCode = require("../../errorcodes/index.code");
const { generateStaffId } = require("../../exports/IDGenerator.exports");
const bcrypt = require("bcryptjs");
const { generateToken } = require("../../exports/ActiveToken.exports");

//* Register New Staff
const register = async (req, res) => {
  try{
    const {email, password, firstName, lastName, role} = req.body;

    //* Check Unique Contact Information
    const notunique = await Staff.findOne({"email": email}).count();
    if(notunique){
      return res.send(ErrorCode.CONFLICT_EMAIL);
    };

    //* Generate New Unique Staff ID
    const staffId = await generateStaffId(firstName, lastName);

    const salt = await bcrypt.genSalt(10);
    const hashedpassword = await bcrypt.hash(password, salt);

    const newstaff = new Staff({
      "staffId": staffId,
      "email": email.trim().toLowerCase(),
      "firstName": firstName.toUpperCase(),
      "lastName": lastName.toUpperCase(),
      "role": role,
      "password": hashedpassword
    });

    //* Saving to Database
    await newstaff.save()
      .then(staff => {
        return res.send({status: 200, message: `Staff ${staff.staffId} - Successfully Created`});
      })
      .catch(err => {
        return res.send({status: 400, message: err.message});
      });
    
  }catch(err){
    return res.send({status: 500, message: err.message});
  }
};

//* Login as Staff-Admin
const login = async (req, res) => {
  try{
    const {email, staffId, password} = req.body;

    //* check if donor exist
    const staff = await Staff.findOne({$or: [ {"email": email}, {"staffId": staffId} ]}).select("-_id").lean();
    if(!staff){
      return res.send(ErrorCode.WRONG_USERNAME_PASSWORD);
    };

    //* Compare Password
    const validpassword = await bcrypt.compare(password, staff.password);
    if(!validpassword){
      return res.send(ErrorCode.WRONG_USERNAME_PASSWORD);
    };

    //* Generate JWT Token;
    const token = await generateToken(staff.staffId, staff.role);
    if(!token.success){
      return res.send(ErrorCode.GENERATE_TOKEN_ERROR);
    };

    //* do not send password object back;
    delete staff.password;

    return res.send({status: 200, token: token.token, staff: staff});

  }catch(err){
    return res.send({status: 500, message: err.message});
  }
};

module.exports = { register, login };

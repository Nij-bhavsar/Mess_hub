import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";

function Signup(){

const navigate = useNavigate();

const [name,setName] = useState("");
const [email,setEmail] = useState("");
const [password,setPassword] = useState("");
const [role,setRole] = useState("Student");
const [error,setError] = useState("");

const signup = async () => {

try{

setError("");

await API.post("/auth/signup",{

name,
email,
password,
role

});

// redirect to login after signup
navigate("/login");

}catch(err){

if(err.response && err.response.data){

setError(err.response.data);

}else{

setError("Signup failed. Try again.");

}

}

};

return(

<div className="auth-container">

<div className="auth-card">

<h2>Create Account</h2>

<p className="auth-subtitle">
Signup to access the Mess Management System
</p>

{error && <div className="message">{error}</div>}

<input
type="text"
placeholder="Full Name"
value={name}
onChange={(e)=>setName(e.target.value)}
/>

<input
type="email"
placeholder="Email"
value={email}
onChange={(e)=>setEmail(e.target.value)}
/>

<input
type="password"
placeholder="Password"
value={password}
onChange={(e)=>setPassword(e.target.value)}
/>

<select
value={role}
onChange={(e)=>setRole(e.target.value)}

>

<option value="Student">Student</option>
<option value="Staff">Staff</option>
<option value="Admin">Admin</option>

</select>

<button className="auth-btn" onClick={signup}>
Signup
</button>

<div className="auth-link">

Already have an account?

<Link to="/login"> Login</Link>

</div>

</div>

</div>

)

}

export default Signup;

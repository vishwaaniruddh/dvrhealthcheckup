import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    onCheck();
  }, [])
  

  const onCheck = async() => {
    var user_details = localStorage.getItem('uid');
    console.log('user_details', user_details)
    if (user_details) {
        navigate('/NewAllSitesDetails');
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://192.168.100.220:2001/login_user_api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const responseData = await response.json();
      console.log("responseData", responseData);
      if (response.status === 200) {
        // alert(responseData.status)
        console.log('responseData.userid',responseData?.userid);

        let uid = responseData?.userid;
        let uname = responseData?.uname;
        console.log('uid, uname',uid, uname);

        localStorage.setItem('uid', uid);
        localStorage.setItem('uname', uname);
        console.log("Login successful");
        navigate('/dashboard');
        //    navigate('/NewAllSitesDetails');
      } else if (response.status === 401) {
        console.error("Invalid credentials:", responseData.message); // Log the error message
      } else if (response.status === 404) {
        console.error("User not found:", responseData.message); // Log the error message
      } else {
        console.error("Internal server error:", responseData.message); // Log the error message
      }
    } catch (error) {
      console.error("Error logging in:", error);
      // Optionally, display an error message to the user
    }
  };

  return (
    <div className="container">
      <div className="login-container">
        <h2 className="text-center mb-4">Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              className="form-control"
              id="username"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              className="form-control"
              id="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <p>dont have an account ? Register Yourself</p>
          </div>
          <button type="submit" className="btn btn-primary btn-block">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;

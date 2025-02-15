import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const Register = () => {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch('http://192.168.100.220:2001/register_api_for_dvr_health', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                console.log('Registration successful');
                
                navigate('/login');
            } else {
                console.error('Registration failed');
            }
        } catch (error) {
            console.error('Error registering user:', error);
        }
    };



    return (
        <div class="container">
            <div class="login-container">
                <h2 class="text-center mb-4">Register Here !</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label for="username">Username</label>
                        <input type="text" class="form-control" id="username" placeholder="Enter username"
                            value={username} onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label for="password">Password</label>
                        <input type="password" class="form-control" id="password" placeholder="Enter password"
                            value={password} onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <div>
                        <p>Already registered ? Login here</p>
                    </div>
                    <button type="submit" class="btn btn-primary btn-block">Register</button>
                </form>
            </div>
        </div>

    )
}

export default Register
import { Link, useNavigate } from "react-router-dom";

function Header() {
  const navigate = useNavigate();

  const onLogout = async () => {
    localStorage.setItem('uid','');
    localStorage.setItem('uname','');
    navigate('/Login');
  }

  return (
    <div className="Header">
      <div className="Nav">
        <Link to="/dashboard">Home</Link>
        <button onClick={onLogout} >
          LOGOUT
        </button>
      </div>
    </div>
  );
}

export default Header;

import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="landing-container">

      <div className="landing-card">

        <img src="/l_3.png" alt="Mess Management System" className="logo-img" />

        <h1>Mess Management System</h1>

        <p>
          A smart platform to manage student meals,
          attendance and daily menu with ease.
        </p>

        <Link to="/login">
          <button className="start-btn">Get Started</button>
        </Link>

      </div>

    </div>
  );
}

export default Home;
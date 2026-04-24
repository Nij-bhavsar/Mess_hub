import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="landing-container">

      <div className="landing-card">

        <div className="logo-circle" style={{ margin: "0 auto var(--space-6)" }}>
          <img src="/logo_messhub.png" alt="Mess Management" className="logo-img" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>

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
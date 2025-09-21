import React from "react";

const Dashboard = () => {
  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Yay!! Welcome! You’re logged in!!! ✅</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

export default Dashboard;

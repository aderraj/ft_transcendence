import '../styles/Navbar.css'

function NavBar() {
    return (
        <header>
            <div className="Nav-Title">
                <h1>Active Tab</h1>
                <p>Welcome back, Traveler</p>
            </div>
            <div className="Nav-Actions">
                <button className="notification-btn"></button>
                <div className="Nav-Profile">
                    <p>Username</p>
                    <p id="level">Level 42</p>
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=traveler"></img>
                </div>
            </div>
        </header>
    )
}

export default NavBar;
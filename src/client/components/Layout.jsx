import { Outlet } from "react-router";

export default function Layout() {
    return (
        <>
            <main>
                <Outlet />
            </main>
            <footer>
                <p>&copy; Puneet Gopinath {new Date().getFullYear()}</p>
                <p>Made with tinge of devotion to Lord Krsna</p>
            </footer>
        </>
    );
};
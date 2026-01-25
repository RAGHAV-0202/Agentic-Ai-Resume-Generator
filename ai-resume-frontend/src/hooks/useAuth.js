import { useState, useEffect } from "react";
import { isLoggedInAPI } from "../services/auth.api";

export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await isLoggedInAPI();
                console.log(response)
                setUser(response.data);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    const login = async (data) => {
        try {
            const response = await loginAPI(data);
            setUser(response.data);
        } catch (error) {
            setError(error.message);
        }
    };

    const logout = async () => {
        try {
            await logoutAPI();
            setUser(null);
        } catch (error) {
            setError(error.message);
        }
    };

    return { user, loading, error, login, logout };
};
document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const messageDiv = document.getElementById("message");
    const loadingDiv = document.getElementById("loading");
    const overlayDiv = document.getElementById("overlay");

    const setLoading = (isLoading) => {
        if (isLoading) {
            overlayDiv.style.display = "block";
            loadingDiv.style.display = "block";
            loginForm.querySelectorAll("input, button").forEach((element) => {
                element.disabled = true;
            });
        } else {
            overlayDiv.style.display = "none";
            loadingDiv.style.display = "none";
            loginForm.querySelectorAll("input, button").forEach((element) => {
                element.disabled = false;
            });
        }
    };

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(loginForm);
        const username = formData.get("username");
        const password = formData.get("password");

        setLoading(true);

        try {
            const response = await fetch("http://127.0.0.1:8000/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            setLoading(false);

            if (!response.ok) {
                throw new Error(data.detail);
            }
            localStorage.setItem("token", data.token);
            localStorage.setItem("token", data.token);

            // 获取场馆数据并保存
            const venuesResponse = await fetch("http://127.0.0.1:8000/api/venues", {
                method: "GET",

            });

            const venuesData = await venuesResponse.json();

            if (!venuesResponse.ok) {
                throw new Error(venuesData.detail);
            }

            localStorage.setItem("venues", JSON.stringify(venuesData));

            window.location.replace("index.html");

        } catch (error) {
            setLoading(false);
            messageDiv.textContent = `错误：${error.message}`;
            messageDiv.style.color = "red";
        }
    });
});

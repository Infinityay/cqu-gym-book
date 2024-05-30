document.addEventListener("DOMContentLoaded", async () => {
    const userInfoDiv = document.getElementById("userInfo");
    const loadingDiv = document.getElementById("loading");
    const overlayDiv = document.getElementById("overlay");

    const setLoading = (isLoading) => {
        if (isLoading) {
            overlayDiv.style.display = "block";
            loadingDiv.style.display = "block";
        } else {
            overlayDiv.style.display = "none";
            loadingDiv.style.display = "none";
        }
    };

    const token = localStorage.getItem("token");
    if (!token) {
        userInfoDiv.textContent = "请先登录。";
        userInfoDiv.style.color = "red";
        return;
    }

    setLoading(true);

    try {
        const response = await fetch(`http://127.0.0.1:8000/user_info?token=${token}`);
        const data = await response.json();

        setLoading(false);

        if (!response.ok) {
            throw new Error(data.detail);
        }

        const {username, member: {memberTypeName, idNo, phone, openid, sex}} = data.data;

        userInfoDiv.innerHTML = `
            <p><strong>用户名：</strong> ${username}</p>
            <p><strong>会员类型：</strong> ${memberTypeName}</p>
            <p><strong>身份证号：</strong> ${idNo}</p>
            <p><strong>手机号：</strong> ${phone}</p>
            <p><strong>OpenID：</strong> ${openid}</p>
            <p><strong>性别：</strong> ${sex === 'M' ? '男' : '女'}</p>
        `;
        userInfoDiv.style.color = "black";
    } catch (error) {
        setLoading(false);
        userInfoDiv.textContent = `错误：${error.message}`;
        userInfoDiv.style.color = "red";
    }
});

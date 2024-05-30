import {fetchAreaIds, fetchReserveDataByAreaId, createOrder} from './utils.js';

document.addEventListener("DOMContentLoaded", () => {
    const reserveInfo = document.getElementById("reserveInfo");
    const todayButton = document.getElementById("todayButton");
    const tomorrowButton = document.getElementById("tomorrowButton");
    const dayAfterTomorrowButton = document.getElementById("dayAfterTomorrowButton");
    const venueTitle = document.getElementById("venueTitle");
    const venueHeader = document.getElementById("venueHeader");

    const token = localStorage.getItem("token");
    const venuesData = JSON.parse(localStorage.getItem("venues"));
    const currentVenue = JSON.parse(localStorage.getItem("currentVenue"));
    const {venueId, itemId, venueName} = currentVenue;

    // 设置标题和头部
    venueTitle.textContent = `${venueName}预订信息`;
    venueHeader.textContent = `${venueName}预订信息`;

    const buttons = [todayButton, tomorrowButton, dayAfterTomorrowButton];

    // 初始化按钮颜色
    function updateButtonColors(selectedButton) {
        buttons.forEach(button => {
            if (button === selectedButton) {
                button.style.backgroundColor = "#FFA500"; // 橙色
            } else {
                button.style.backgroundColor = ""; // 默认颜色
            }
        });
    }

    // 获取和格式化日期
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(today.getDate() + 2);
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // 默认选择今天的日期
    loadReserveData(formatDate(today));
    updateButtonColors(todayButton);

    // 事件监听器
    todayButton.addEventListener("click", () => {
        loadReserveData(formatDate(today));
        updateButtonColors(todayButton);
    });

    tomorrowButton.addEventListener("click", () => {
        loadReserveData(formatDate(tomorrow));
        updateButtonColors(tomorrowButton);
    });

    dayAfterTomorrowButton.addEventListener("click", () => {
        const currentTime = new Date();
        if (currentTime.getHours() >= 18) {
            loadReserveData(formatDate(dayAfterTomorrow));
            updateButtonColors(dayAfterTomorrowButton);
        } else {
            Swal.fire({
                icon: 'error',
                title: '查询失败',
                text: '后天预订时间未到，请18:00后再试'
            });
        }
    });

    async function loadReserveData(queryDate) {
        try {
            // 使用新的 fetchAreaIds 函数
            const areaIds = await fetchAreaIds(venueId, itemId, token);

            let areaId;
            if (areaIds.length > 1) {
                // 多个 areaId 的情况，弹出选择框让用户选择
                const choice = await Swal.fire({
                    title: '选择场地类型',
                    input: 'radio',
                    inputOptions: {
                        [areaIds[0]]: '全场',
                        [areaIds[1]]: '半场'
                    },
                    inputValidator: (value) => {
                        if (!value) {
                            return '您需要选择一个选项！';
                        }
                    }
                });

                if (choice.isConfirmed) {
                    areaId = choice.value;
                } else {
                    throw new Error('未选择场地类型');
                }
            } else if (areaIds.length === 1) {
                areaId = areaIds[0];
            } else {
                throw new Error('未找到有效的 areaId');
            }

            // 使用新的 fetchReserveDataByAreaId 函数
            const reserveData = await fetchReserveDataByAreaId(venueId, areaId, queryDate, itemId, token);

            if (!reserveData.success) {
                throw new Error("查询失败");
            }
            localStorage.setItem("reserveData", JSON.stringify(reserveData));
            displayReserveData(reserveData.data, areaId, queryDate);
        } catch (error) {
            console.error(`错误：${error.message}`);
            reserveInfo.textContent = "未找到可预订场地信息或查询失败。";
        }
    }

    function displayReserveData(data, areaId, queryDate) {
        const timeAxisList = data.timeAxisList;
        const fieldAndPriceList = data.allFieldAndPriceList;
        const timeUnit = data.timeUnit;
        const currentAreaId = areaId;
        reserveInfo.innerHTML = "";
        const reserveTable = document.createElement("table");
        const headerRow = document.createElement("tr");
        const timeHeader = document.createElement("th");
        timeHeader.textContent = "时间";
        headerRow.appendChild(timeHeader);

        fieldAndPriceList.forEach(field => {
            const fieldName = field.fieldName;
            const fieldHeader = document.createElement("th");
            fieldHeader.textContent = fieldName;
            headerRow.appendChild(fieldHeader);
        });

        reserveTable.appendChild(headerRow);

        timeAxisList.forEach((time, index) => {
            if (index === timeAxisList.length - 1) return;
            const timeRow = document.createElement("tr");
            const timeCell = document.createElement("td");
            const timeParts = time.split(':');
            const timeInMinutes = parseInt(timeParts[0]) * 60 + parseInt(timeParts[1]);
            const endTimeInMinutes = timeInMinutes + parseInt(timeUnit);
            const endHours = Math.floor(endTimeInMinutes / 60);
            const endMinutes = endTimeInMinutes % 60;
            const endTimeFormatted = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
            timeCell.textContent = `${time} - ${endTimeFormatted}`;
            timeRow.appendChild(timeCell);

            fieldAndPriceList.forEach(field => {
                const priceInfo = field.priceList.find(price => price.beginTime.startsWith(time));
                const priceCell = document.createElement("td");
                const button = document.createElement("button");
                button.textContent = "预约";

                if (priceInfo) {
                    const currentTime = new Date();
                    const [hours, minutes, seconds] = priceInfo.beginTime.split(':').map(Number);
                    const beginTime = new Date(queryDate); // 使用 queryDate 作为日期
                    beginTime.setHours(hours, minutes, seconds, 0);

                    if (queryDate === currentTime.toISOString().split('T')[0] && currentTime > beginTime) {
                        button.disabled = true;
                        button.textContent = "已超时";
                    } else if (priceInfo.timeCancelOrOpenFlag) {
                        button.addEventListener("click", async function () {
                            // 使用 SweetAlert2 进行确认
                            const result = await Swal.fire({
                                title: '确认预约',
                                text: '您确认要预约该时间段吗？',
                                icon: 'warning',
                                showCancelButton: true,
                                confirmButtonText: '确认',
                                cancelButtonText: '取消'
                            });

                            if (!result.isConfirmed) {
                                return; // 如果用户取消预约，则直接返回
                            }

                            const orderDetails = {
                                venueId: currentVenue.venueId,
                                itemId: currentVenue.itemId,
                                fieldAreaId: currentAreaId,
                                orderDate: queryDate,
                                orderDetailList: [{
                                    fieldId: field.fieldId,
                                    beginTime: priceInfo.beginTime,
                                    price: priceInfo.price,
                                    isMember: priceInfo.isMember,
                                    venueItemId: currentVenue.itemId,
                                }],
                                token: token
                            };

                            try {
                                const orderResult = await createOrder(orderDetails);
                                if (orderResult.success) {
                                    Swal.fire({
                                        icon: 'success',
                                        title: '预约成功',
                                        text: '您的预约已成功！'
                                    });
                                } else {
                                    throw new Error("预约失败");
                                }
                            } catch (error) {
                                console.error(`错误：${error.message}`);
                                Swal.fire({
                                    icon: 'error',
                                    title: '预约失败',
                                    text: '预约过程中出现问题，请稍后重试。'
                                });
                            }
                        });
                    } else {
                        button.disabled = true;
                        button.textContent = "已预约";
                    }
                } else {
                    button.disabled = true;
                    button.textContent = "已预约";
                }

                priceCell.appendChild(button);
                timeRow.appendChild(priceCell);
            });

            reserveTable.appendChild(timeRow);
        });

        reserveInfo.appendChild(reserveTable);
    }
});

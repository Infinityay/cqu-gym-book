import {fetchTicketTypesGymAndPool, bookTicket} from './utils.js';

document.addEventListener("DOMContentLoaded", async () => {
    const venueInfo = JSON.parse(localStorage.getItem("currentVenue"));
    const venueElement = document.getElementById("venueInfo");
    const itemId = venueInfo.itemId;
    if (venueInfo) {
        // Dynamically set the document title and header
        document.title = `${venueInfo.venueName}预定信息`;
        document.getElementById("venueHeader").textContent = `${venueInfo.venueName}预定信息`;

        venueElement.innerHTML = `
            <h2>${venueInfo.venueName}</h2>
        `;

        const todayButton = document.getElementById('todayButton');
        const tomorrowButton = document.getElementById('tomorrowButton');
        const dayAfterTomorrowButton = document.getElementById('dayAfterTomorrowButton');

        let selectedDate = formatDate(new Date());

        todayButton.addEventListener('click', () => handleDateButtonClick(todayButton.textContent));
        tomorrowButton.addEventListener('click', () => handleDateButtonClick(tomorrowButton.textContent));
        dayAfterTomorrowButton.addEventListener('click', () => handleDateButtonClick(dayAfterTomorrowButton.textContent));

        async function handleDateButtonClick(dateString) {
            selectedDate = dateString;
            await fetchAndDisplayTickets(venueInfo.venueId, selectedDate);
        }

        async function fetchAndDisplayTickets(venueId, date) {
            try {
                const token = localStorage.getItem("token"); // Assuming you have the user token stored in localStorage
                const ticketQuery = {
                    token: token,
                    item_ids: itemId,
                    venue_id: venueId,
                    use_date_time: date,
                    limit_range: '-86400' // 86400 seconds = 24 hours
                };

                const ticketTypesInfo = await fetchTicketTypesGymAndPool(ticketQuery);

                // Clear previous table if exists
                const oldTable = document.querySelector('.styled-table');
                if (oldTable) {
                    oldTable.remove();
                }

                const table = document.createElement("table");
                table.classList.add("styled-table");

                const headerRow = document.createElement("tr");
                const typeNameHeader = document.createElement("th");
                const limitCountHeader = document.createElement("th");
                const reserveHeader = document.createElement("th");

                typeNameHeader.textContent = "票类型名称";
                limitCountHeader.textContent = "剩余票数";
                reserveHeader.textContent = "操作";

                headerRow.appendChild(typeNameHeader);
                headerRow.appendChild(limitCountHeader);
                headerRow.appendChild(reserveHeader);
                table.appendChild(headerRow);
                ticketTypesInfo.data.forEach(ticket => {
                    const row = document.createElement("tr");
                    const typeNameCell = document.createElement("td");
                    const limitCountCell = document.createElement("td");
                    const reserveCell = document.createElement("td");
                    const reserveButton = document.createElement("button");

                    typeNameCell.textContent = ticket.typeName;
                    limitCountCell.textContent = ticket.limitCount;
                    reserveButton.textContent = "预约";
                    reserveButton.classList.add("reserve-button");
                    reserveButton.addEventListener("click", async () => {
                        const result = await Swal.fire({
                            title: '确认预约',
                            text: `您确认要预约${ticket.typeName}吗？`,
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonText: '确认',
                            cancelButtonText: '取消'
                        });

                        if (result.isConfirmed) {
                            try {
                                const token = localStorage.getItem("token"); // Assuming you have the user token stored in localStorage
                                const ticketInfo = {
                                    typeId: ticket.typeId,
                                    typeName: ticket.typeName,
                                    limitCount: ticket.limitCount
                                };

                                const bookingResponse = await bookTicket(token, ticketInfo, ticket.timeOfDay, selectedDate);

                                Swal.fire(
                                    '预约成功！',
                                    `您已成功预约${ticket.typeName}。`,
                                    'success'
                                );
                            } catch (error) {
                                Swal.fire(
                                    '预约失败',
                                    `无法预约${ticket.typeName}：${error.message}`,
                                    'error'
                                );
                            }
                        }
                    });

                    reserveCell.appendChild(reserveButton);
                    row.appendChild(typeNameCell);
                    row.appendChild(limitCountCell);
                    row.appendChild(reserveCell);
                    table.appendChild(row);
                });


                venueElement.appendChild(table);
            } catch (error) {
                console.error(`获取预订数据失败：${error.message}`);
            }
        }

        // Initialize with today's date
        await fetchAndDisplayTickets(venueInfo.venueId, selectedDate);

    } else {
        console.error("未找到场馆信息");
    }
});

// 获取今天、明天和后天的日期
const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const dayAfterTomorrow = new Date(today);
dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

// 设置按钮文本为动态日期
document.getElementById('todayButton').innerText = formatDate(today);
document.getElementById('tomorrowButton').innerText = formatDate(tomorrow);
document.getElementById('dayAfterTomorrowButton').innerText = formatDate(dayAfterTomorrow);

// 格式化日期函数
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

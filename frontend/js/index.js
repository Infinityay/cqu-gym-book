import {fetchAreaIds, fetchReserveDataByAreaId, fetchTicketTypesGymAndPool} from './utils.js';

document.addEventListener("DOMContentLoaded", () => {
    const personalInfoCard = document.getElementById("personalInfoCard");

    personalInfoCard.addEventListener("click", () => {
        window.location.href = "userinfo.html";
    });

    const venuesData = JSON.parse(localStorage.getItem("venues"));

    // 各个场馆的卡片点击事件处理
    const venueCardClickHandler = async (venueName, isGymOrPool) => {
        const venueInfo = venuesData[venueName];

        if (venueInfo) {
            const {venueId, itemId} = venueInfo;
            const token = localStorage.getItem("token");

            // 存储当前选择的场馆信息
            localStorage.setItem("currentVenue", JSON.stringify({venueId, itemId, venueName}));

            try {
                const queryDate = new Date().toISOString().split('T')[0];

                if (isGymOrPool) {
                    // 获取票种信息
                    const ticketQuery = {
                        token: token,
                        item_ids: itemId,
                        venue_id: venueId,
                        use_date_time: new Date().toISOString(),
                        limit_range: '-86400'
                    };

                    const ticketTypesInfo = await fetchTicketTypesGymAndPool(ticketQuery);
                    
                    localStorage.setItem("ticketTypesInfo", JSON.stringify(ticketTypesInfo));

                    window.location.href = "gym_or_pool.html";
                } else {
                    // 获取 areaIds
                    const areaIds = await fetchAreaIds(venueId, itemId, token);

                    if (areaIds.length > 0) {
                        // 选择第一个 areaId
                        const areaId = areaIds[0];
                        const reserveData = await fetchReserveDataByAreaId(venueId, areaId, queryDate, itemId, token);

                        localStorage.setItem("currentAreaId", areaId);  // 保存 areaId 以备后用
                        localStorage.setItem("reserveData", JSON.stringify(reserveData));

                        window.location.href = "reserve.html";
                    } else {
                        console.error("未找到有效的 areaId");
                    }
                }
            } catch (error) {
                console.error(`错误：${error.message}`);
            }

        } else {
            console.error(`未找到场馆：${venueName}`);
        }
    };

    // 绑定需要进行操作的场馆卡片点击事件
    const handleVenueClick = (elementId, venueName, isGymOrPool = false) => {
        document.getElementById(elementId).addEventListener("click", () => venueCardClickHandler(venueName, isGymOrPool));
    };

    handleVenueClick("basketballCourtCard", "重庆大学-虎溪校区篮球馆");
    handleVenueClick("badmintonCourtCard", "重庆大学-虎溪校区羽毛球馆");
    handleVenueClick("tableTennisHallCard", "重庆大学-虎溪校区乒乓球馆");

    handleVenueClick("gymCard", "重庆大学-虎溪校区健身馆", true);
    handleVenueClick("swimmingPoolCard", "重庆大学-虎溪校区游泳馆", true);
});

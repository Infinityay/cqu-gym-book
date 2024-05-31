// utils.js

async function fetchTicketTypesGymAndPool(ticketQuery) {
    try {
        const response = await fetch("http://47.236.246.169:8000/api/query_ticket_types", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(ticketQuery)
        });
        console.log(JSON.stringify(ticketQuery))
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail);
        }
        return data;
    } catch (error) {
        console.error(`error: ${error.message}`);
        throw error;
    }
}

function organizeTicketsByIndex(responseJson) {
    const ticketsByTimeOfDay = {
        'morning': null,
        'afternoon': null,
        'night': null
    };

    if (responseJson.data.length >= 3) {
        const tickets = responseJson.data;
        ticketsByTimeOfDay['morning'] = {
            'typeId': tickets[0].typeId,
            'name': tickets[0].typeName,
            'limitCount': tickets[0].limitCount
        };
        ticketsByTimeOfDay['afternoon'] = {
            'typeId': tickets[1].typeId,
            'name': tickets[1].typeName,
            'limitCount': tickets[1].limitCount
        };
        ticketsByTimeOfDay['night'] = {
            'typeId': tickets[2].typeId,
            'name': tickets[2].typeName,
            'limitCount': tickets[2].limitCount
        };
    } else {
        throw new Error("API response does not contain enough data entries.");
    }

    return ticketsByTimeOfDay;
}

async function bookTicket(token, ticketInfo, timeOfDay, useDate) {
    try {
        const postData = {
            token: token,
            ticket_info: ticketInfo,
            time_of_day: timeOfDay,
            use_date: useDate
        };
        console.log('postdata' + JSON.stringify(postData))
        const response = await fetch("http://47.236.246.169:8000/api/book_ticket", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(postData)
        });
        console.log('response' + JSON.stringify(response))

        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(responseData.detail);
        }

        return responseData;
    } catch (error) {
        console.error(`error: ${error.message}`);
        throw error;
    }
}

async function fetchAreaIds(venueId, itemId, token) {
    try {
        const areaIdResponse = await fetch(`http://47.236.246.169:8000/api/area_ids?venueId=${venueId}&itemId=${itemId}&token=${token}`);
        const areaIdData = await areaIdResponse.json();

        if (!areaIdResponse.ok) {
            throw new Error(areaIdData.detail);
        }

        return areaIdData.areaIds;
    } catch (error) {
        console.error(`error: ${error.message}`);
        throw error;
    }
}

async function fetchReserveDataByAreaId(venueId, areaId, queryDate, itemId, token) {
    try {
        const postData = {
            venueId: venueId.toString(),
            areaId: areaId.toString(),
            queryDate: queryDate,
            itemId: itemId.toString(),
            token: token
        };

        const reserveResponse = await fetch("http://47.236.246.169:8000/api/field_reserve_display_data", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(postData)
        });

        const reserveData = await reserveResponse.json();

        if (!reserveResponse.ok) {
            throw new Error(reserveData.detail);
        }

        return reserveData;
    } catch (error) {
        console.error(`error: ${error.message}`);
        throw error;
    }
}

async function createOrder(orderDetails) {
    try {
        const response = await fetch("http://47.236.246.169:8000/api/create_order", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(orderDetails)
        });

        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(responseData.detail);
        }

        return responseData;
    } catch (error) {
        console.error(`error: ${error.message}`);
        throw error;
    }
}


// 导出函数
export {
    fetchTicketTypesGymAndPool,
    organizeTicketsByIndex,
    fetchAreaIds,
    fetchReserveDataByAreaId,
    createOrder,
    bookTicket
};

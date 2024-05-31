from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from starlette.middleware.cors import CORSMiddleware
from typing import List, Optional

from .utils import *


class LoginRequest(BaseModel):
    username: str
    password: str


from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, ValidationError


class OrderDetail(BaseModel):
    fieldId: int
    beginTime: str
    endTime: str
    beginDate: str
    endDate: str
    priceOrig: Optional[float] = None
    pricePay: Optional[float] = None


class CreateOrderRequest(BaseModel):
    venueId: int
    itemId: int
    fieldAreaId: int
    orderDate: str
    orderDetailList: List[OrderDetail]
    saleMode: str
    cardId: str | None
    priceOrig: Optional[float] = None
    pricePay: Optional[float] = None
    token: str
    orderType: str


class FieldReserveQuery(BaseModel):
    venueId: str
    areaId: str
    queryDate: str
    itemId: str
    token: str


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/login")
def login(login_request: LoginRequest):
    code = login_and_get_authorization_code(login_request.username, login_request.password)
    if not code:
        raise HTTPException(status_code=401, detail="Failed to get authorization code.")
    token = send_login_request(code)
    if not token:
        raise HTTPException(status_code=401, detail="Failed to get token.")
    return {"token": token}


@app.get("/user_info")
def user_info(token: str):
    user_info = get_login_user_info(token)
    if 'error' in user_info:
        raise HTTPException(status_code=400, detail=user_info)
    return user_info


@app.get("/venues")
def get_venues():
    try:
        venue_data = fetch_venue_data()
        if not venue_data:
            raise HTTPException(status_code=500, detail="Failed to fetch venue data.")
        return venue_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/area_ids")
def get_area_id(venueId: int = Query(...), itemId: int = Query(...), token: str = Query(...)):
    try:
        area_ids = get_area_id_by_venue_id_and_item_id(venueId, itemId, token)
        if not area_ids:
            raise HTTPException(status_code=404, detail="Area ID not found.")
        return {"areaIds": area_ids}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/field_reserve_display_data")
def field_reserve_display_data(query: FieldReserveQuery):
    try:

        data = get_field_reserve_display_data(
            query.venueId, query.areaId, query.queryDate, query.itemId, query.token
        )
        return data

    except Exception as e:

        print(f"Error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/create_order")
def create_order(request: CreateOrderRequest):
    try:

        response = create_field_reserve_order(
            venue_id=request.venueId,
            item_id=request.itemId,
            field_area_id=request.fieldAreaId,
            order_date=request.orderDate,
            order_detail_list=[detail.dict() for detail in request.orderDetailList],
            sale_mode=request.saleMode,
            card_id=request.cardId,
            price_orig=request.priceOrig,
            price_pay=request.pricePay,
            token=request.token,
            order_type=request.orderType
        )
        print(response)
        return response
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=e.errors())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


class TicketQuery(BaseModel):
    token: str
    item_ids: str
    venue_id: str
    use_date_time: datetime
    limit_range: str = '-86400'


@app.post("/query_ticket_types")
async def query_ticket_types_gym_and_pool(ticket_query: TicketQuery):
    try:
        query_ticket_types_info = query_ticket_types(
            token=ticket_query.token,
            item_ids=ticket_query.item_ids,
            venue_id=ticket_query.venue_id,
            use_date_time=ticket_query.use_date_time,
            limit_range=ticket_query.limit_range
        )
        return query_ticket_types_info
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ValidationError as e:
        print(e.json())
        raise HTTPException(status_code=422, detail=e.errors())

class BookingRequest(BaseModel):
    token: str
    ticket_info: dict
    use_date: str


@app.post("/book_ticket")
async def book_ticket_gym_and_pool(booking_request: BookingRequest):
    try:

        response = create_ticket_order(
            token=booking_request.token,
            ticket_info=booking_request.ticket_info,
            use_date=booking_request.use_date
        )

        if response.get("success"):
            return {"message": "book success", "data": response}
        else:
            raise HTTPException(status_code=400, detail="book failed")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)

# -*- coding: utf-8 -*-
# @Project : GymReserve
# @Time    : 2024/5/30 11:14
# @Author  : infinityay
# @File    : utils.py
# @Software: PyCharm 
# @Contact me: https://github.com/Infinityay or stu.lyh@outlook.com
# @Comment :
import json
from datetime import datetime, timedelta
import requests
import re
from .login import login

# 登录URL
url = "https://sso.cqu.edu.cn/login?service=https:%2F%2Fsso.cqu.edu.cn%2Foauth2.0%2FcallbackAuthorize%3Fclient_id%3DHXTYZXZHGLXT%26redirect_uri%3Dhttp%253A%252F%252Fhuxispce.cqu.edu.cn%252Fpages%252Flogin%252Fchongqing%26response_type%3Dcode%26client_name%3DCasOAuthClient"


def send_login_request(code):
    # 请求的URL
    url = "http://huxispce.cqu.edu.cn/api/weixin/auth/login"

    # JSON请求
    payload = {
        "authType": "code",
        "code": code,
        "loginType": "chongqing"
    }

    # 请求
    headers = {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0",
        "Accept": "*/*",
        "Origin": "http://huxispce.cqu.edu.cn",
        "Referer": f"http://huxispce.cqu.edu.cn/pages/login/chongqing?code={code}&state=chongqing",
        "Accept-Encoding": "gzip, deflate",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
    }

    # 发送POST请求
    response = requests.post(url, json=payload, headers=headers)

    # 将响应文本解析为JSON格式
    response_json = response.json()

    # 从解析后的JSON中提取token
    token = response_json.get('data', {}).get('token', None)

    return token


def login_and_get_authorization_code(username: str, password: str):
    """登录SSO并获取授权码"""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36"
    }
    # 使用提供的登录函数进行登录，获取session
    session = login(username, password)

    # 访问指定的服务并获取授权
    service_url = "https://sso.cqu.edu.cn/oauth2.0/authorize?response_type=code&client_id=HXTYZXZHGLXT&redirect_uri=http://huxispce.cqu.edu.cn/pages/login/chongqing&state=chongqing"
    service_response = session.get(service_url, headers=headers, allow_redirects=True)

    # 提取URL中的授权
    match = re.search(r'code=([^&]*)', service_response.url)
    if match:
        return match.group(1)  # 返回找到的授权码
    return None  # 如果没有找到授权码，返回None


def get_login_user_info(token):
    """
    Function to get login user information from the API.

    Parameters:
        token (str): The JWT token for authorization.

    Returns:
        dict: The response data containing user information or error details.
    """
    # Construct the full URL
    url = "http://huxispce.cqu.edu.cn/api/weixin/auth/getLoginUserInfo?appType="

    # Set up the headers
    headers = {
        'Connection': 'keep-alive',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0',
        'lg-authorization': token,
        'DNT': '1',
        'Accept': '*/*',
        'Referer': 'http://huxispce.cqu.edu.cn/pages/user/info',
        'Accept-Encoding': 'gzip, deflate',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
    }

    # Send the GET request
    response = requests.get(url, headers=headers)

    # Check if the request was successful
    if response.status_code == 200:
        return response.json()
    else:
        return {'error': f"Request failed with status code {response.status_code}", 'details': response.text}


def fetch_venue_data():
    """
    address = {重庆大学-虎溪校区游泳, 重庆大学-虎溪校区篮球, 重庆大学-虎溪校区羽毛球馆, 重庆大学-虎溪校区健身馆}
    :return:
    """
    # 请求的URL
    url = "http://huxispce.cqu.edu.cn/api/system/wechat/venue/getVenueDataByWeChat"

    # 请求
    headers = {
        "Host": "huxispce.cqu.edu.cn",
        "Connection": "keep-alive",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0",
        "DNT": "1",
        "Accept": "*/*",
        "Referer": "http://huxispce.cqu.edu.cn/",
        "Accept-Encoding": "gzip, deflate",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
    }

    # 发送GET请求
    response = requests.get(url, headers=headers)

    # 将响应文本解析为JSON
    data = json.loads(response.text)

    # 初始化一个列表来存储每个场馆的信
    venues_info = []

    # 初始化一个字典来存储每个场馆的信息，场馆名称作为
    venues_info = {}

    # 检查响应数据中'success'字段，确保请求成
    if data['success']:
        # 提取每个场馆的venueId和itemId，然后存储到字典
        for venue in data['data']:
            venues_info[venue['address']] = {
                "venueId": venue['venueId'],
                "itemId": venue['itemId']
            }

        return venues_info  # 返回包含所有场馆信息的字典
    else:
        print("Failed to fetch data")
        return {}  # 如果请求失败，返回空字典


def get_area_id_by_venue_id_and_item_id(venueId, itemId, token):
    """
    Fetch area  data from the API based on venue ID and item ID with dynamic input parameters.

    :param venueId: Unique identifier for the venue
    :param itemId: Item identifier associated with the query
    :param token: Authorization token required for the API
    :return: None
    """
    url = "http://huxispce.cqu.edu.cn/api/field/fieldArea/getAreaListByVenueIdAndItemId"
    params = {
        "venueId": venueId,
        "itemId": itemId
    }
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0",
        "Accept": "*/*",
        "lg-authorization": token,  # Assuming the token is used with the 'Authorization' header
        "Referer": f"http://huxispce.cqu.edu.cn/pages/fieldReservation/index?venueId={venueId}&itemId={itemId}",
        "Accept-Encoding": "gzip, deflate",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6"
    }

    response = requests.get(url, headers=headers, params=params)
    response_data = json.loads(response.text)

    if response_data['success']:
        if response_data['data']:
            area_ids = [area_info['areaId'] for area_info in response_data['data']]
            return area_ids  # 返回所有areaId的列?
        else:
            print("No data found for the given venueId and itemId.")
            return None  # 未找到数据时返回None
    else:
        print("Failed to fetch data:", response_data.get('msg'))
        return None  # 请求失败时返回None


def get_field_reserve_display_data(venueId, areaId, queryDate, itemId, token, isVirtual='F'):
    """
    Fetch field reserve display data from the API with dynamic input parameters.
    适用于除了游泳馆 健身馆之外的
    :param venueId: Unique identifier for the venue
    :param areaId: Unique identifier for the area
    :param queryDate: Date for the query
    :param isVirtual: Specifies if the query is for virtual items
    :param itemId: Item identifier associated with the query
    :param token: Authorization token required for the API
    :return: None
    """
    url = "http://huxispce.cqu.edu.cn/api/field/wechat/fieldReserve/getFieldReserveDisplayData"
    params = {
        "venueId": venueId,
        "areaId": areaId,
        "queryDate": queryDate,
        "isVirtual": isVirtual,
        "itemId": itemId  # Assuming you need to pass this as a URL parameter
    }
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0",
        "Accept": "*/*",
        "lg-authorization": token,
        "Referer": f"http://huxispce.cqu.edu.cn/pages/fieldReservation/index?venueId={venueId}&itemId={itemId}",
        "Accept-Encoding": "gzip, deflate",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6"
    }

    response = requests.get(url, headers=headers, params=params)
    response_data = json.loads(response.text)
    return response_data


def extract_upcoming_true_prices(data):
    results = []

    for field in data['data']['allFieldAndPriceList']:
        field_name = field['fieldName']
        field_id = field['fieldId']
        for price in field['priceList']:
            if price['timeCancelOrOpenFlag']:
                results.append({
                    'fieldId': field_id,
                    'fieldName': field_name,
                    'beginTime': price['beginTime'],
                    'endTime': price['endTime']
                })
    return results


def create_field_reserve_order(venue_id, item_id, field_area_id, order_date, order_detail_list, sale_mode='F',
                               card_id=None, price_orig=None, price_pay=None, token='', order_type='R'):
    """
    Send a POST request to create a field reserve order with dynamic parameters.
    用于预定乒乓球馆 羽毛球馆 篮球
    :param venue_id: Venue identifier
    :param item_id: Item identifier
    :param field_area_id: Field area identifier
    :param order_date: Date of the order
    :param order_detail_list: List of order details, each a dictionary including fieldId, beginTime, endTime, beginDate, endDate, priceOrig, and pricePay
    :param sale_mode: Mode of sale, default is 'F'
    :param card_id: Card identifier, default is None
    :param price_orig: Original price, default is 12
    :param price_pay: Payment price, default is 12
    :param token: Authorization token
    :param order_type: Type of order, default is 'R'
    :return: Response from the server as a JSON object
    """
    url = "http://huxispce.cqu.edu.cn/api/field/wechat/fieldReserve/createFieldReserveOrder"
    headers = {
        "Content-Type": "application/json",
        "lg-authorization": token,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0",
        "Accept": "*/*",
        "Origin": "http://huxispce.cqu.edu.cn",
        "Referer": f"http://huxispce.cqu.edu.cn/pages/fieldReservation/index?venueId={venue_id}&itemId={item_id}",
        "Accept-Encoding": "gzip, deflate",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6"
    }
    # Construct the JSON body with dynamic parameters
    body = {
        "venueId": venue_id,
        "itemId": item_id,
        "fieldAreaId": field_area_id,
        "orderType": order_type,
        "orderDate": order_date,
        "orderDetailList": order_detail_list,
        "saleMode": sale_mode,
        "cardId": card_id,
        "priceOrig": price_orig,
        "pricePay": price_pay
    }

    # Send the POST request
    response = requests.post(url, headers=headers, data=json.dumps(body))
    return response.json()  # Assuming the server responds with JSON


# 健身馆和游泳馆需要单独写预定函数
def query_ticket_types(token, item_ids, venue_id, use_date_time, limit_range='-86400'):
    """
    查询健身房或者游泳馆票种信息
    :param token:
    :param item_ids:
    :param venue_id:
    :param use_date_time:
    :param limit_range:
    :return:
    """
    # 创建一个新的datetime对象，时间设00:00:00
    midnight = datetime(use_date_time.year, use_date_time.month, use_date_time.day, 0, 0, 0).strftime(
        "%Y-%m-%d %H:%M:%S")

    # 为URL编码日期时间字符
    url_encoded_date_time = midnight.replace(' ', '+')

    url = f'http://huxispce.cqu.edu.cn/api/ticket/wechat/ticketType/query?itemIds={item_ids}&venueId={venue_id}&useDateTime={url_encoded_date_time}&limitRange={limit_range}'
    headers = {
        'Host': 'huxispce.cqu.edu.cn',
        'Connection': 'keep-alive',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0',
        'lg-authorization': token,
        'DNT': '1',
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6'
    }

    response = requests.get(url, headers=headers)
    return response.json()


def organize_tickets_by_index(response_json):
    """
    根据索引位置（假设固定）重新组织票种信息
    :param response_json: 从API获得的JSON数据
    :return: 按固定顺序（早、午、晚）分类的票种信息
    """
    # 定义一个字典来保存按时间段分类的票种信
    tickets_by_time_of_day = {
        'morning': None,
        'afternoon': None,
        'night': None
    }

    # 检查数据长度是否符合预
    if len(response_json['data']) >= 3:
        tickets = response_json['data']
        tickets_by_time_of_day['morning'] = {
            'typeId': tickets[0]['typeId'],
            'name': tickets[0]['typeName'],
            'limitCount': tickets[0]['limitCount']
        }
        tickets_by_time_of_day['afternoon'] = {
            'typeId': tickets[1]['typeId'],
            'name': tickets[1]['typeName'],
            'limitCount': tickets[1]['limitCount']
        }
        tickets_by_time_of_day['night'] = {
            'typeId': tickets[2]['typeId'],
            'name': tickets[2]['typeName'],
            'limitCount': tickets[2]['limitCount']
        }
    else:
        raise ValueError("API response does not contain enough data entries.")

    return tickets_by_time_of_day


def create_ticket_order(token, ticket_info, use_date):
    """
    根据用户选择的时间段创建订单
    用于预订游泳馆和健身
    :param token: API授权Token
    :param ticket_info: 包含各时间段票种信息的字
    :param use_date: 使用票的日期 格式 2024-05-18
    :return: API响应
    """
    url = 'http://huxispce.cqu.edu.cn/api/ticket/wechat/ticketOrder/createOrder'
    headers = {
        'Host': 'huxispce.cqu.edu.cn',
        'Connection': 'keep-alive',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0',
        'lg-authorization': token,
        'Content-Type': 'application/json',
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6'
    }
    # 构建请求
    payload = {
        "source": "W",
        "details": [
            {
                "ticketTypeId": ticket_info["typeId"],
                "qty": 1
            }
        ],
        "voucherNos": [],
        "useDate": use_date
    }

    response = requests.post(url, headers=headers, json=payload)
    return response.json()

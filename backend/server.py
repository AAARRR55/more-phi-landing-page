import hashlib
import hmac
import logging
import os
import secrets
import smtplib
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from typing import Any, Dict, List, Optional
from uuid import uuid4

import jwt
from dotenv import load_dotenv
from emergentintegrations.payments.stripe.checkout import (
    CheckoutSessionRequest,
    StripeCheckout,
)
from fastapi import Depends, FastAPI, Header, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse
from fastapi.responses import RedirectResponse
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, Field, field_validator

load_dotenv()

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME")
JWT_SECRET = os.environ.get("JWT_SECRET")
STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))
CORS_ALLOWED_ORIGINS_ENV = os.environ.get("CORS_ALLOWED_ORIGINS")
SMTP_HOST = os.environ.get("SMTP_HOST")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USERNAME = os.environ.get("SMTP_USERNAME")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD")
SMTP_FROM = os.environ.get("SMTP_FROM")
SMTP_USE_TLS = os.environ.get("SMTP_USE_TLS", "true").lower() == "true"

if not MONGO_URL or not DB_NAME or not JWT_SECRET or not STRIPE_API_KEY or not CORS_ALLOWED_ORIGINS_ENV:
    raise RuntimeError("Missing required backend environment variables")

CORS_ALLOWED_ORIGINS = [origin.strip().rstrip("/") for origin in CORS_ALLOWED_ORIGINS_ENV.split(",") if origin.strip()]

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("more_phi_store")

app = FastAPI(
    title="More-Phi VST3 Purchasing API",
    version="1.0.0",
    description="Production-ready API for plugin purchasing, customer accounts, Stripe Checkout, and license delivery.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

PRODUCT = {
    "id": "more-phi-vst3",
    "name": "More-Phi",
    "version": "1.0.0",
    "formats": ["VST3", "AU"],
    "platforms": ["macOS 12+", "Windows 10+"],
    "price": 129.00,
    "currency": "usd",
    "license_type": "perpetual_single_user",
    "license_terms": "One engineer/producer may activate More-Phi on up to three owned machines. Resale, key sharing, and public redistribution are prohibited.",
    "download_url": "https://downloads.more-phi.example/releases/more-phi-1.0.0.zip",
    "support_email": "support@more-phi.example",
}


class CustomerCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    company: Optional[str] = Field(default=None, max_length=120)
    country: Optional[str] = Field(default=None, max_length=80)


class CustomerLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    customer: Dict[str, Any]


class CheckoutCreate(BaseModel):
    origin_url: str = Field(min_length=8, max_length=300)

    @field_validator("origin_url")
    @classmethod
    def validate_origin(cls, value: str) -> str:
        if not value.startswith(("http://", "https://")):
            raise ValueError("origin_url must be a valid http(s) origin")
        return value.rstrip("/")


class ActivationCreate(BaseModel):
    license_key: str = Field(min_length=12, max_length=80)
    machine_id: str = Field(min_length=8, max_length=160)
    host_name: Optional[str] = Field(default=None, max_length=120)
    daw: Optional[str] = Field(default=None, max_length=80)


class ActivationResponse(BaseModel):
    id: str
    license_key: str
    machine_id: str
    status: str
    activated_at: str


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def public_customer(doc: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": doc["id"],
        "name": doc["name"],
        "email": doc["email"],
        "company": doc.get("company"),
        "country": doc.get("country"),
        "created_at": doc["created_at"],
    }


async def rate_limit(request: Request, bucket: str, limit: int, window_seconds: int) -> None:
    forwarded_for = request.headers.get("x-forwarded-for", "")
    ip = forwarded_for.split(",")[0].strip() or request.client.host if request.client else "unknown"
    key = hashlib.sha256(f"{bucket}:{ip}".encode()).hexdigest()
    window_start = datetime.now(timezone.utc) - timedelta(seconds=window_seconds)
    await db.rate_limits.delete_many({"created_at_dt": {"$lt": window_start}})
    count = await db.rate_limits.count_documents({"key": key, "created_at_dt": {"$gte": window_start}})
    if count >= limit:
        raise HTTPException(status_code=429, detail="Too many attempts. Please try again shortly.")
    await db.rate_limits.insert_one({"id": str(uuid4()), "key": key, "bucket": bucket, "created_at": now_iso(), "created_at_dt": datetime.now(timezone.utc)})


def create_token(customer_id: str, email: str) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": customer_id, "email": email, "exp": expires_at}, JWT_SECRET, algorithm="HS256")


async def current_customer(authorization: Optional[str] = Header(default=None)) -> Dict[str, Any]:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    customer = await db.customers.find_one({"id": payload.get("sub")}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=401, detail="Customer not found")
    return customer


def generate_license_key(customer_id: str, order_id: str) -> str:
    raw = f"{customer_id}:{order_id}:{secrets.token_hex(16)}".encode()
    digest = hmac.new(JWT_SECRET.encode(), raw, hashlib.sha256).hexdigest().upper()
    return f"MPHI-{digest[:5]}-{digest[5:10]}-{digest[10:15]}-{digest[15:20]}"


def send_license_email(to_email: str, license_key: str, order_id: str) -> Dict[str, str]:
    if not SMTP_HOST or not SMTP_FROM:
        return {"status": "pending_configuration", "detail": "SMTP_HOST and SMTP_FROM are required for email delivery"}
    message = EmailMessage()
    message["Subject"] = "Your More-Phi license key"
    message["From"] = SMTP_FROM
    message["To"] = to_email
    message.set_content(
        f"""Thanks for purchasing More-Phi.

Order: {order_id}
License key: {license_key}

Open your customer dashboard to view purchase history and activations.
"""
    )
    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as smtp:
            if SMTP_USE_TLS:
                smtp.starttls()
            if SMTP_USERNAME and SMTP_PASSWORD:
                smtp.login(SMTP_USERNAME, SMTP_PASSWORD)
            smtp.send_message(message)
        return {"status": "sent", "detail": "License email sent"}
    except Exception as exc:
        logger.exception("License email delivery failed")
        return {"status": "failed", "detail": str(exc)}


async def ensure_indexes() -> None:
    await db.customers.create_index("email", unique=True)
    await db.customers.create_index("id", unique=True)
    await db.orders.create_index("customer_id")
    await db.orders.create_index("checkout_session_id", unique=True, sparse=True)
    await db.licenses.create_index("license_key", unique=True)
    await db.licenses.create_index("customer_id")
    await db.payment_transactions.create_index("session_id", unique=True, sparse=True)
    await db.payment_transactions.create_index("customer_id")
    await db.license_activations.create_index([("license_key", 1), ("machine_id", 1)], unique=True)
    await db.rate_limits.create_index("created_at_dt", expireAfterSeconds=86400)


async def provision_paid_order(session_id: str, source: str) -> Dict[str, Any]:
    transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not transaction:
        raise HTTPException(status_code=404, detail="Payment transaction not found")
    order = await db.orders.find_one({"id": transaction["order_id"]}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.get("status") == "paid":
        license_doc = await db.licenses.find_one({"order_id": order["id"]}, {"_id": 0})
        return {"order": order, "license": license_doc, "already_processed": True}

    license_key = generate_license_key(transaction["customer_id"], order["id"])
    license_doc = {
        "id": str(uuid4()),
        "license_key": license_key,
        "customer_id": transaction["customer_id"],
        "order_id": order["id"],
        "product_id": PRODUCT["id"],
        "status": "active",
        "activation_limit": 3,
        "created_at": now_iso(),
        "delivered_at": now_iso(),
        "delivery_channel": "dashboard_and_email_hook",
    }
    await db.licenses.insert_one(license_doc)
    await db.orders.update_one({"id": order["id"], "status": {"$ne": "paid"}}, {"$set": {"status": "paid", "paid_at": now_iso(), "updated_at": now_iso()}})
    await db.payment_transactions.update_one({"session_id": session_id}, {"$set": {"status": "complete", "payment_status": "paid", "processed_at": now_iso(), "provision_source": source}})
    email_result = send_license_email(transaction.get("customer_email"), license_doc["license_key"], order["id"])
    await db.email_events.insert_one({
        "id": str(uuid4()),
        "customer_id": transaction["customer_id"],
        "order_id": order["id"],
        "license_id": license_doc["id"],
        "to": transaction.get("customer_email"),
        "template": "license_delivery",
        "status": email_result["status"],
        "detail": email_result["detail"],
        "created_at": now_iso(),
    })
    updated_order = await db.orders.find_one({"id": order["id"]}, {"_id": 0})
    return {"order": updated_order, "license": {k: v for k, v in license_doc.items() if k != "_id"}, "already_processed": False}


@app.on_event("startup")
async def startup() -> None:
    await ensure_indexes()


@app.middleware("http")
async def request_logger(request: Request, call_next):
    started = datetime.now(timezone.utc)
    try:
        response = await call_next(request)
    except Exception as exc:
        logger.exception("Unhandled request failure: %s %s", request.method, request.url.path)
        raise exc
    duration_ms = int((datetime.now(timezone.utc) - started).total_seconds() * 1000)
    logger.info("%s %s -> %s (%sms)", request.method, request.url.path, response.status_code, duration_ms)
    return response


@app.exception_handler(ValueError)
async def value_error_handler(_: Request, exc: ValueError):
    return JSONResponse(status_code=400, content={"detail": str(exc)})


@app.get("/api/health")
async def health() -> Dict[str, str]:
    return {"status": "ok", "service": "more-phi-purchasing-api"}


@app.get("/api/product")
async def get_product() -> Dict[str, Any]:
    return PRODUCT


@app.post("/api/auth/register", response_model=TokenResponse)
async def register(payload: CustomerCreate, request: Request) -> TokenResponse:
    await rate_limit(request, "register", 8, 900)
    email = payload.email.lower()
    existing = await db.customers.find_one({"email": email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=409, detail="An account already exists for this email")
    customer = {
        "id": str(uuid4()),
        "name": payload.name.strip(),
        "email": email,
        "company": payload.company,
        "country": payload.country,
        "password_hash": pwd_context.hash(payload.password),
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    await db.customers.insert_one(customer)
    return TokenResponse(access_token=create_token(customer["id"], email), customer=public_customer(customer))


@app.post("/api/auth/login", response_model=TokenResponse)
async def login(payload: CustomerLogin, request: Request) -> TokenResponse:
    await rate_limit(request, "login", 10, 900)
    customer = await db.customers.find_one({"email": payload.email.lower()}, {"_id": 0})
    if not customer or not pwd_context.verify(payload.password, customer["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    await db.customers.update_one({"id": customer["id"]}, {"$set": {"last_login_at": now_iso()}})
    return TokenResponse(access_token=create_token(customer["id"], customer["email"]), customer=public_customer(customer))


@app.get("/api/auth/me")
async def me(customer: Dict[str, Any] = Depends(current_customer)) -> Dict[str, Any]:
    return public_customer(customer)


@app.get("/api/orders")
async def my_orders(customer: Dict[str, Any] = Depends(current_customer)) -> List[Dict[str, Any]]:
    orders = await db.orders.find({"customer_id": customer["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return orders


@app.get("/api/licenses")
async def my_licenses(customer: Dict[str, Any] = Depends(current_customer)) -> List[Dict[str, Any]]:
    licenses = await db.licenses.find({"customer_id": customer["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    for license_doc in licenses:
        license_doc["activations"] = await db.license_activations.find({"license_key": license_doc["license_key"]}, {"_id": 0}).to_list(20)
    return licenses


@app.post("/api/licenses/activate", response_model=ActivationResponse)
async def activate_license(payload: ActivationCreate, customer: Dict[str, Any] = Depends(current_customer)) -> ActivationResponse:
    license_doc = await db.licenses.find_one({"license_key": payload.license_key, "customer_id": customer["id"]}, {"_id": 0})
    if not license_doc or license_doc.get("status") != "active":
        raise HTTPException(status_code=404, detail="Active license not found")
    existing = await db.license_activations.find_one({"license_key": payload.license_key, "machine_id": payload.machine_id}, {"_id": 0})
    if existing:
        return ActivationResponse(**existing)
    count = await db.license_activations.count_documents({"license_key": payload.license_key, "status": "active"})
    if count >= license_doc["activation_limit"]:
        raise HTTPException(status_code=403, detail="Activation limit reached")
    activation = {
        "id": str(uuid4()),
        "license_key": payload.license_key,
        "customer_id": customer["id"],
        "machine_id": payload.machine_id,
        "host_name": payload.host_name,
        "daw": payload.daw,
        "status": "active",
        "activated_at": now_iso(),
    }
    await db.license_activations.insert_one(activation)
    return ActivationResponse(**{k: v for k, v in activation.items() if k != "_id"})


@app.post("/api/payments/checkout")
async def create_checkout(payload: CheckoutCreate, request: Request, customer: Dict[str, Any] = Depends(current_customer)) -> Dict[str, str]:
    await rate_limit(request, "checkout", 6, 900)
    order_id = str(uuid4())
    metadata = {"order_id": order_id, "customer_id": customer["id"], "product_id": PRODUCT["id"], "customer_email": customer["email"]}
    success_url = f"{payload.origin_url}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{payload.origin_url}/#checkout"
    host_url = str(request.base_url).rstrip("/")
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=f"{host_url}/api/webhook/stripe")
    checkout_request = CheckoutSessionRequest(amount=float(PRODUCT["price"]), currency=PRODUCT["currency"], success_url=success_url, cancel_url=cancel_url, metadata=metadata)
    session = await stripe_checkout.create_checkout_session(checkout_request)
    order = {
        "id": order_id,
        "customer_id": customer["id"],
        "customer_email": customer["email"],
        "product_id": PRODUCT["id"],
        "amount": PRODUCT["price"],
        "currency": PRODUCT["currency"],
        "status": "pending",
        "checkout_session_id": session.session_id,
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    transaction = {
        "id": str(uuid4()),
        "order_id": order_id,
        "customer_id": customer["id"],
        "customer_email": customer["email"],
        "amount": PRODUCT["price"],
        "currency": PRODUCT["currency"],
        "metadata": metadata,
        "session_id": session.session_id,
        "payment_id": None,
        "status": "initiated",
        "payment_status": "pending",
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    await db.orders.insert_one(order)
    await db.payment_transactions.insert_one(transaction)
    return {"url": session.url, "session_id": session.session_id}


@app.get("/api/payments/checkout/status/{session_id}")
async def checkout_status(session_id: str, request: Request, customer: Dict[str, Any] = Depends(current_customer)) -> Dict[str, Any]:
    transaction = await db.payment_transactions.find_one({"session_id": session_id, "customer_id": customer["id"]}, {"_id": 0})
    if not transaction:
        raise HTTPException(status_code=404, detail="Payment transaction not found")
    host_url = str(request.base_url).rstrip("/")
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=f"{host_url}/api/webhook/stripe")
    status_response = await stripe_checkout.get_checkout_status(session_id)
    await db.payment_transactions.update_one({"session_id": session_id}, {"$set": {"status": status_response.status, "payment_status": status_response.payment_status, "amount_total": status_response.amount_total, "updated_at": now_iso()}})
    result: Dict[str, Any] = {"status": status_response.status, "payment_status": status_response.payment_status, "amount_total": status_response.amount_total, "currency": status_response.currency, "metadata": status_response.metadata}
    if status_response.payment_status == "paid":
        result.update(await provision_paid_order(session_id, "status_poll"))
    elif status_response.status in {"expired", "canceled"}:
        await db.orders.update_one({"id": transaction["order_id"]}, {"$set": {"status": "cancelled", "updated_at": now_iso()}})
    return result


@app.post("/api/webhook/stripe")
async def stripe_webhook(request: Request) -> Dict[str, Any]:
    body = await request.body()
    host_url = str(request.base_url).rstrip("/")
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=f"{host_url}/api/webhook/stripe")
    event = await stripe_checkout.handle_webhook(body, request.headers.get("Stripe-Signature"))
    await db.payment_events.insert_one({"id": event.event_id, "event_type": event.event_type, "session_id": event.session_id, "payment_status": event.payment_status, "metadata": event.metadata, "created_at": now_iso()})
    if event.session_id:
        await db.payment_transactions.update_one({"session_id": event.session_id}, {"$set": {"payment_status": event.payment_status, "last_event_type": event.event_type, "updated_at": now_iso()}})
    if event.payment_status == "paid" and event.session_id:
        await provision_paid_order(event.session_id, "stripe_webhook")
    elif event.event_type in {"checkout.session.expired", "payment_intent.payment_failed"} and event.session_id:
        await db.payment_transactions.update_one({"session_id": event.session_id}, {"$inc": {"retry_count": 1}, "$set": {"status": "requires_retry", "updated_at": now_iso()}})
    return {"received": True, "event_type": event.event_type}


@app.get("/api/schema")
async def schema() -> Dict[str, Any]:
    return {
        "database": DB_NAME,
        "collections": {
            "customers": ["id", "name", "email", "company", "country", "password_hash", "created_at", "updated_at"],
            "orders": ["id", "customer_id", "product_id", "amount", "currency", "status", "checkout_session_id", "created_at", "paid_at"],
            "licenses": ["id", "license_key", "customer_id", "order_id", "product_id", "status", "activation_limit", "delivered_at"],
            "payment_transactions": ["id", "order_id", "customer_id", "amount", "currency", "session_id", "payment_status", "retry_count"],
            "license_activations": ["id", "license_key", "customer_id", "machine_id", "host_name", "daw", "status", "activated_at"],
            "payment_events": ["id", "event_type", "session_id", "payment_status", "metadata", "created_at"],
        },
    }


@app.get("/api-docs")
async def api_docs_redirect() -> RedirectResponse:
    return RedirectResponse(url="/developer-docs", status_code=307)


@app.get("/api/docs-text", response_class=PlainTextResponse)
async def docs_text() -> str:
    return """# More-Phi Purchasing API

Base path: /api

## Product
GET /api/product
Response: {"id":"more-phi-vst3","name":"More-Phi","price":129.0,"currency":"usd"}

## Register
POST /api/auth/register
Body: {"name":"Ada Producer","email":"ada@example.com","password":"securePass123","company":"Studio","country":"US"}
Response: {"access_token":"jwt","token_type":"bearer","customer":{"id":"...","email":"ada@example.com"}}

## Login
POST /api/auth/login
Body: {"email":"ada@example.com","password":"securePass123"}

## Create Stripe Checkout
POST /api/payments/checkout
Headers: Authorization: Bearer <token>
Body: {"origin_url":"https://your-frontend.example"}
Response: {"url":"https://checkout.stripe.com/...","session_id":"cs_..."}
Server sets amount from product metadata; raw card data never touches this API.

## Poll Checkout Status
GET /api/payments/checkout/status/{session_id}
Headers: Authorization: Bearer <token>
Response: {"status":"complete","payment_status":"paid","order":{...},"license":{...}}

## Stripe Webhook
POST /api/webhook/stripe
Stripe signature is verified by the Stripe checkout integration. Successful paid sessions are idempotently provisioned.

## Licenses
GET /api/licenses
POST /api/licenses/activate
Body: {"license_key":"MPHI-...","machine_id":"machine-fingerprint","host_name":"Mac Studio","daw":"Ableton Live"}
"""


@app.options("/{rest_of_path:path}")
async def preflight(rest_of_path: str) -> Response:
    return Response(status_code=status.HTTP_204_NO_CONTENT)
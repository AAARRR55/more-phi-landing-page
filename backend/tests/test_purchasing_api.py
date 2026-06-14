"""Core purchasing/auth/payment API regression tests against public preview URL."""

import os
import uuid

import pytest
import requests


BASE_URL = os.environ.get("NEXT_PUBLIC_API_URL") or os.environ.get("REACT_APP_BACKEND_URL")


def _load_base_url_from_env_files() -> str | None:
    candidate_files = ["/app/.env.local", "/app/frontend/.env.local", "/app/frontend/.env"]
    for file_path in candidate_files:
        if not os.path.exists(file_path):
            continue
        with open(file_path, "r", encoding="utf-8") as f:
            for line in f:
                row = line.strip()
                if not row or row.startswith("#") or "=" not in row:
                    continue
                key, value = row.split("=", 1)
                if key.strip() in {"NEXT_PUBLIC_API_URL", "REACT_APP_BACKEND_URL"}:
                    val = value.strip().strip('"').strip("'")
                    if val:
                        return val
    return None


def _require_base_url() -> str:
    resolved = BASE_URL or _load_base_url_from_env_files()
    if not resolved:
        pytest.skip("NEXT_PUBLIC_API_URL/REACT_APP_BACKEND_URL is not configured")
    return resolved.rstrip("/")


@pytest.fixture(scope="session")
def api_url() -> str:
    return _require_base_url()


@pytest.fixture(scope="session")
def session() -> requests.Session:
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def registered_customer(api_url: str, session: requests.Session):
    # Auth: register/login/me JWT customer workflow
    email = f"TEST_morephi_{uuid.uuid4().hex[:10]}@example.com"
    payload = {
        "name": "TEST QA User",
        "email": email,
        "password": "SecurePass123!",
        "company": "TEST Studio",
        "country": "US",
    }
    register = session.post(f"{api_url}/api/auth/register", json=payload, timeout=40)
    assert register.status_code == 200
    reg_data = register.json()
    assert isinstance(reg_data.get("access_token"), str)
    assert reg_data["customer"]["email"] == email.lower()
    assert reg_data["customer"]["name"] == "TEST QA User"

    token = reg_data["access_token"]
    return {"token": token, "email": email, "password": payload["password"]}


def test_health(api_url: str, session: requests.Session):
    response = session.get(f"{api_url}/api/health", timeout=30)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "service" in data


def test_product_metadata(api_url: str, session: requests.Session):
    response = session.get(f"{api_url}/api/product", timeout=30)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "more-phi-vst3"
    assert data["name"] == "More-Phi"
    assert data["price"] == 129.0
    assert data["currency"] == "usd"
    assert isinstance(data.get("license_terms"), str)


def test_schema_endpoint(api_url: str, session: requests.Session):
    response = session.get(f"{api_url}/api/schema", timeout=30)
    assert response.status_code == 200
    data = response.json()
    assert "collections" in data
    assert "customers" in data["collections"]
    assert "orders" in data["collections"]


def test_docs_text_endpoint(api_url: str, session: requests.Session):
    response = session.get(f"{api_url}/api/docs-text", timeout=30)
    assert response.status_code == 200
    assert "More-Phi Purchasing API" in response.text
    assert "Stripe Checkout" in response.text


def test_register_duplicate_returns_409(api_url: str, session: requests.Session, registered_customer):
    response = session.post(
        f"{api_url}/api/auth/register",
        json={
            "name": "TEST QA User",
            "email": registered_customer["email"],
            "password": "SecurePass123!",
            "company": "TEST Studio",
            "country": "US",
        },
        timeout=30,
    )
    assert response.status_code == 409
    assert "already exists" in response.json().get("detail", "").lower()


def test_login_success_and_me(api_url: str, session: requests.Session, registered_customer):
    login = session.post(
        f"{api_url}/api/auth/login",
        json={"email": registered_customer["email"], "password": registered_customer["password"]},
        timeout=30,
    )
    assert login.status_code == 200
    login_data = login.json()
    assert isinstance(login_data.get("access_token"), str)
    assert login_data["customer"]["email"] == registered_customer["email"].lower()

    me = session.get(
        f"{api_url}/api/auth/me",
        headers={"Authorization": f"Bearer {login_data['access_token']}"},
        timeout=30,
    )
    assert me.status_code == 200
    me_data = me.json()
    assert me_data["email"] == registered_customer["email"].lower()
    assert me_data["name"] == "TEST QA User"
    assert "password" not in me_data
    assert "password_hash" not in me_data


def test_login_invalid_credentials_401(api_url: str, session: requests.Session, registered_customer):
    response = session.post(
        f"{api_url}/api/auth/login",
        json={"email": registered_customer["email"], "password": "WrongPass999!"},
        timeout=30,
    )
    assert response.status_code == 401
    assert "invalid" in response.json().get("detail", "").lower()


def test_auth_required_endpoints_reject_without_token(api_url: str, session: requests.Session):
    orders = session.get(f"{api_url}/api/orders", timeout=30)
    assert orders.status_code == 401
    assert "token" in orders.json().get("detail", "").lower()

    checkout = session.post(f"{api_url}/api/payments/checkout", json={"origin_url": api_url}, timeout=30)
    assert checkout.status_code == 401
    assert "token" in checkout.json().get("detail", "").lower()


def test_checkout_validation_422(api_url: str, session: requests.Session, registered_customer):
    response = session.post(
        f"{api_url}/api/payments/checkout",
        json={},
        headers={"Authorization": f"Bearer {registered_customer['token']}"},
        timeout=30,
    )
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data


def test_checkout_creates_pending_order(api_url: str, session: requests.Session, registered_customer):
    checkout = session.post(
        f"{api_url}/api/payments/checkout",
        json={"origin_url": api_url},
        headers={"Authorization": f"Bearer {registered_customer['token']}"},
        timeout=60,
    )
    assert checkout.status_code == 200
    checkout_data = checkout.json()
    assert checkout_data["url"].startswith("https://")
    assert isinstance(checkout_data["session_id"], str)

    orders = session.get(
        f"{api_url}/api/orders",
        headers={"Authorization": f"Bearer {registered_customer['token']}"},
        timeout=30,
    )
    assert orders.status_code == 200
    order_list = orders.json()
    assert isinstance(order_list, list)
    created = [o for o in order_list if o.get("checkout_session_id") == checkout_data["session_id"]]
    assert len(created) == 1
    assert created[0]["status"] == "pending"
    assert created[0]["amount"] == 129.0


def test_checkout_ignores_frontend_amount_tampering(api_url: str, session: requests.Session, registered_customer):
    checkout = session.post(
        f"{api_url}/api/payments/checkout",
        json={"origin_url": api_url, "amount": 1.0, "currency": "usd"},
        headers={"Authorization": f"Bearer {registered_customer['token']}"},
        timeout=60,
    )
    assert checkout.status_code == 200
    session_id = checkout.json()["session_id"]
    orders = session.get(
        f"{api_url}/api/orders",
        headers={"Authorization": f"Bearer {registered_customer['token']}"},
        timeout=30,
    )
    created = [o for o in orders.json() if o.get("checkout_session_id") == session_id]
    assert created[0]["amount"] == 129.0


def test_empty_licenses_and_invalid_activation(api_url: str, session: requests.Session, registered_customer):
    licenses = session.get(
        f"{api_url}/api/licenses",
        headers={"Authorization": f"Bearer {registered_customer['token']}"},
        timeout=30,
    )
    assert licenses.status_code == 200
    assert isinstance(licenses.json(), list)

    activation = session.post(
        f"{api_url}/api/licenses/activate",
        json={"license_key": "MPHI-FAKE1-FAKE2-FAKE3-FAKE4", "machine_id": "test-machine-123"},
        headers={"Authorization": f"Bearer {registered_customer['token']}"},
        timeout=30,
    )
    assert activation.status_code == 404


def test_payment_status_requires_auth(api_url: str, session: requests.Session):
    response = session.get(f"{api_url}/api/payments/checkout/status/cs_test_missing", timeout=30)
    assert response.status_code == 401


def test_preflight_and_cors_headers(api_url: str, session: requests.Session):
    cors_origin = os.environ.get("CORS_TEST_ORIGIN", "http://localhost:3000")
    response = session.options(
        f"{api_url}/api/auth/login",
        headers={
            "Origin": cors_origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type,authorization",
        },
        timeout=30,
    )
    assert response.status_code in (200, 204)
    assert response.headers.get("access-control-allow-origin") == cors_origin


def test_disallowed_cors_origin_rejected_on_local_backend(api_url: str, session: requests.Session):
    if "localhost" not in api_url and "127.0.0.1" not in api_url:
        pytest.skip("External edge proxy can add its own CORS headers; strict backend CORS is validated locally.")
    response = session.options(
        f"{api_url}/api/auth/login",
        headers={
            "Origin": "https://malicious.example",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type,authorization",
        },
        timeout=30,
    )
    assert response.status_code == 400


def test_login_rate_limit_returns_429(api_url: str, session: requests.Session):
    # Sensitive endpoint behavior: verify 429 appears after repeated failed login attempts
    got_429 = False
    for _ in range(14):
        response = session.post(
            f"{api_url}/api/auth/login",
            json={"email": f"missing_{uuid.uuid4().hex[:6]}@example.com", "password": "WrongPass999!"},
            timeout=30,
        )
        if response.status_code == 429:
            got_429 = True
            break
        assert response.status_code == 401
    assert got_429 is True

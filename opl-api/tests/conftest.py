import pytest
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from auth import get_current_user, require_admin
from database import get_session
from main import app
from routers.division import Division
from routers.player import Player
from routers.user import User


@pytest.fixture
def session():
    engine = create_engine(
        'sqlite://',
        connect_args={'check_same_thread': False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as s:
        yield s


@pytest.fixture
def test_user(session):
    user = User(email='test@example.com', name='Test User', is_admin=True)
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@pytest.fixture
def client(session, test_user):
    def get_test_session():
        yield session

    app.dependency_overrides[get_session] = get_test_session
    app.dependency_overrides[get_current_user] = lambda: test_user
    app.dependency_overrides[require_admin] = lambda: test_user

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()


@pytest.fixture
def sample_division(session):
    division = Division(
        name='Division A',
        start_date='2025-01-01',
        end_date='2025-06-01',
        match_time='19:00',
    )
    session.add(division)
    session.commit()
    session.refresh(division)
    return division


@pytest.fixture
def sample_players(session, sample_division):
    players = [
        Player(
            first_name='Alice',
            last_name='Smith',
            rating=700,
            games_played=10,
            phone='555-0001',
            email='alice@example.com',
            division_id=sample_division.division_id,
        ),
        Player(
            first_name='Bob',
            last_name='Jones',
            rating=600,
            games_played=5,
            phone='555-0002',
            email='bob@example.com',
            division_id=sample_division.division_id,
        ),
        Player(
            first_name='Charlie',
            last_name='Brown',
            rating=550,
            games_played=3,
            phone='555-0003',
            email='charlie@example.com',
            division_id=sample_division.division_id,
        ),
        Player(
            first_name='Diana',
            last_name='Prince',
            rating=800,
            games_played=20,
            phone='555-0004',
            email='diana@example.com',
            division_id=sample_division.division_id,
        ),
    ]
    session.add_all(players)
    session.commit()
    for p in players:
        session.refresh(p)
    return players

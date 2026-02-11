def test_get_divisions_empty(client):
    response = client.get('/divisions/')
    assert response.status_code == 200
    assert response.json() == []


def test_get_divisions(client, sample_division):
    response = client.get('/divisions/')
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]['name'] == 'Division A'
    assert data[0]['active'] is True


def test_get_divisions_filter_active(client, sample_division):
    # Deactivate the division
    client.put(
        f'/divisions/{sample_division.division_id}/',
        json={
            'name': 'Division A',
            'start_date': '2025-01-01',
            'end_date': '2025-06-01',
            'match_time': '19:00',
            'active': False,
        },
    )
    response = client.get('/divisions/?active=true')
    assert response.status_code == 200
    assert len(response.json()) == 0

    response = client.get('/divisions/?active=false')
    assert response.status_code == 200
    assert len(response.json()) == 1


def test_get_division_by_id(client, sample_division):
    response = client.get(f'/divisions/{sample_division.division_id}/')
    assert response.status_code == 200
    data = response.json()
    assert data['name'] == 'Division A'
    assert data['start_date'] == '2025-01-01'


def test_get_division_not_found(client):
    response = client.get('/divisions/999/')
    assert response.status_code == 404


def test_create_division(client):
    response = client.post(
        '/divisions/',
        json={
            'name': 'Division B',
            'start_date': '2025-07-01',
            'end_date': '2025-12-01',
            'match_time': '20:00',
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data['name'] == 'Division B'
    assert data['division_id'] is not None
    assert data['active'] is True


def test_update_division(client, sample_division):
    response = client.put(
        f'/divisions/{sample_division.division_id}/',
        json={
            'name': 'Division A - Updated',
            'start_date': '2025-01-01',
            'end_date': '2025-06-30',
            'match_time': '19:30',
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data['name'] == 'Division A - Updated'
    assert data['match_time'] == '19:30'


def test_get_division_players(client, sample_division, sample_players):
    response = client.get(f'/divisions/{sample_division.division_id}/players/')
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 4


def test_add_player_to_division(client, sample_division):
    # Create a player first
    player_resp = client.post(
        '/players/',
        json={
            'first_name': 'Eve',
            'last_name': 'Wilson',
            'rating': 650,
            'games_played': 0,
            'phone': '555-0005',
            'email': 'eve@example.com',
        },
    )
    players = client.get('/players/').json()
    eve = [p for p in players if p['email'] == 'eve@example.com'][0]

    response = client.post(f'/divisions/{sample_division.division_id}/players/{eve["player_id"]}/')
    assert response.status_code == 200

    # Verify player is in division
    players_resp = client.get(f'/divisions/{sample_division.division_id}/players/')
    assert len(players_resp.json()) == 1


def test_add_player_to_division_duplicate(client, sample_division, sample_players):
    player = sample_players[0]
    response = client.post(f'/divisions/{sample_division.division_id}/players/{player.player_id}/')
    assert response.status_code == 409


def test_remove_player_from_division(client, sample_division, sample_players):
    player = sample_players[0]
    response = client.delete(f'/divisions/{sample_division.division_id}/players/{player.player_id}/')
    assert response.status_code == 200

    players_resp = client.get(f'/divisions/{sample_division.division_id}/players/')
    assert len(players_resp.json()) == 3


def test_copy_division(client, sample_division, sample_players):
    response = client.post(
        f'/divisions/{sample_division.division_id}/copy/',
        json={
            'name': 'Division A - Season 2',
            'start_date': '2025-07-01',
            'end_date': '2025-12-01',
            'match_time': '19:00',
        },
    )
    assert response.status_code == 200
    new_div = response.json()
    assert new_div['name'] == 'Division A - Season 2'
    assert new_div['active'] is True

    # Source division should be inactive
    source = client.get(f'/divisions/{sample_division.division_id}/').json()
    assert source['active'] is False

    # New division should have same players
    new_players = client.get(f'/divisions/{new_div["division_id"]}/players/').json()
    assert len(new_players) == 4

    # Source division should still have its players
    old_players = client.get(f'/divisions/{sample_division.division_id}/players/').json()
    assert len(old_players) == 4
